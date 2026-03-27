package com.guesthouse.opsapi.reservation.service;

import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationInventoryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.ActiveRoomInventoryRecord;
import com.guesthouse.shared.db.reservation.model.BlockedRoomRangeRecord;
import com.guesthouse.shared.db.reservation.model.OccupiedRoomNightRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationMutationTargetRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationNightRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.reservation.ReservationStatus;
import com.guesthouse.shared.domain.user.UserRole;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ReservationReassignmentService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    private final ReservationQueryMapper reservationQueryMapper;
    private final ReservationInventoryMapper reservationInventoryMapper;
    private final ReservationCommandMapper reservationCommandMapper;
    private final OpsReservationAuditService opsReservationAuditService;
    private final Clock clock;

    public ReservationReassignmentService(
            ReservationQueryMapper reservationQueryMapper,
            ReservationInventoryMapper reservationInventoryMapper,
            ReservationCommandMapper reservationCommandMapper,
            OpsReservationAuditService opsReservationAuditService,
            Clock clock
    ) {
        this.reservationQueryMapper = reservationQueryMapper;
        this.reservationInventoryMapper = reservationInventoryMapper;
        this.reservationCommandMapper = reservationCommandMapper;
        this.opsReservationAuditService = opsReservationAuditService;
        this.clock = clock;
    }

    @Transactional
    public ReservationReassignmentResult reassignReservation(
            Long reservationId,
            List<ReservationNightReassignmentChange> requestedChanges,
            SessionUser actor
    ) {
        if (requestedChanges == null || requestedChanges.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "At least one night change is required.");
        }

        OpsReservationMutationTargetRecord target = reservationQueryMapper.lockOpsReservationMutationTarget(reservationId);
        if (target == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Reservation not found.");
        }
        requireMutationAccess(actor, target.getHostUserId());
        if (!isEligibleReservationStatus(target.getStatus())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Only pending or confirmed reservations can be reassigned."
            );
        }

        Map<Long, ReservationNightReassignmentChange> changesByNightId = normalizeChanges(requestedChanges);
        List<OpsReservationNightRecord> reservationNights =
                reservationQueryMapper.findOpsReservationNightsByReservationIds(List.of(reservationId));
        Map<Long, OpsReservationNightRecord> nightsById = new LinkedHashMap<>();
        for (OpsReservationNightRecord reservationNight : reservationNights) {
            nightsById.put(reservationNight.getReservationNightId(), reservationNight);
        }

        List<OpsReservationNightRecord> changedNights = changesByNightId.keySet().stream()
                .map(nightId -> requireReservationNight(nightsById, nightId, reservationId))
                .sorted(Comparator.comparing(OpsReservationNightRecord::getStayDate))
                .toList();

        LocalDate businessDate = LocalDate.now(clock);
        LocalDate minStayDate = changedNights.get(0).getStayDate();
        LocalDate maxStayDateExclusive = changedNights.get(changedNights.size() - 1).getStayDate().plusDays(1);

        Map<Long, ActiveRoomInventoryRecord> activeRoomsById = lockActiveRooms(target.getAccommodationId());
        Map<LocalDate, Set<Long>> blockedRoomsByDate = buildBlockedRoomsByDate(
                reservationInventoryMapper.findActiveRoomBlocksForAccommodationStay(
                        target.getAccommodationId(),
                        minStayDate,
                        maxStayDateExclusive
                ),
                minStayDate,
                maxStayDateExclusive
        );
        Map<LocalDate, Set<Long>> occupiedRoomsByDate = buildOccupiedRoomsByDate(
                reservationInventoryMapper.findOccupiedRoomNightsForAccommodationStay(
                        target.getAccommodationId(),
                        minStayDate,
                        maxStayDateExclusive
                )
        );

        List<Map<String, Object>> beforeStates = new ArrayList<>();
        List<Map<String, Object>> afterStates = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now(clock);

        for (OpsReservationNightRecord night : changedNights) {
            validateNightEligibility(night, businessDate);
            ReservationNightReassignmentChange change = changesByNightId.get(night.getReservationNightId());
            ActiveRoomInventoryRecord targetRoom = requireTargetRoom(activeRoomsById, change.assignedRoomId());

            if (night.getAssignedRoomId().equals(targetRoom.getRoomId())) {
                throw new AppException(
                        ErrorCode.INVALID_REQUEST,
                        HttpStatus.BAD_REQUEST,
                        "Selected room is already assigned to that night."
                );
            }

            Set<Long> blockedRooms = blockedRoomsByDate.getOrDefault(night.getStayDate(), Set.of());
            if (blockedRooms.contains(targetRoom.getRoomId())) {
                throw new AppException(
                        ErrorCode.INVALID_REQUEST,
                        HttpStatus.CONFLICT,
                        "Selected room is blocked for that stay date."
                );
            }

            Set<Long> occupiedRooms = new LinkedHashSet<>(occupiedRoomsByDate.getOrDefault(night.getStayDate(), Set.of()));
            occupiedRooms.remove(night.getAssignedRoomId());
            if (occupiedRooms.contains(targetRoom.getRoomId())) {
                throw new AppException(
                        ErrorCode.INVALID_REQUEST,
                        HttpStatus.CONFLICT,
                        "Selected room is already occupied for that stay date."
                );
            }

            beforeStates.add(buildNightState(
                    night.getReservationNightId(),
                    night.getStayDate(),
                    night.getAssignedRoomId(),
                    night.getAssignedRoomCode(),
                    night.getAssignedRoomTypeId(),
                    night.getAssignedRoomTypeName()
            ));
            afterStates.add(buildNightState(
                    night.getReservationNightId(),
                    night.getStayDate(),
                    targetRoom.getRoomId(),
                    targetRoom.getRoomCode(),
                    targetRoom.getRoomTypeId(),
                    targetRoom.getRoomTypeName()
            ));

            reservationCommandMapper.updateReservationNightAssignedRoom(
                    night.getReservationNightId(),
                    targetRoom.getRoomId(),
                    now
            );

            occupiedRoomsByDate
                    .computeIfAbsent(night.getStayDate(), ignored -> new LinkedHashSet<>())
                    .remove(night.getAssignedRoomId());
            occupiedRoomsByDate
                    .computeIfAbsent(night.getStayDate(), ignored -> new LinkedHashSet<>())
                    .add(targetRoom.getRoomId());
        }

        reservationCommandMapper.touchReservationUpdatedAt(reservationId, now);
        opsReservationAuditService.writeReservationAudit(
                actor,
                reservationId,
                "RESERVATION_REASSIGNED",
                "OPS_REASSIGNMENT",
                "Reservation nights reassigned by operations.",
                Map.of("nights", beforeStates),
                Map.of("nights", afterStates),
                now
        );

        return new ReservationReassignmentResult(
                target.getReservationId(),
                target.getReservationNo(),
                changedNights.size(),
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    @Transactional
    public ReservationNightSwapResult swapReservationNights(
            ReservationNightSwapChange requestedSwap,
            SessionUser actor
    ) {
        validateSwapRequest(requestedSwap);

        List<Long> reservationIdsToLock = requestedSwap.reservationIdsInLockOrder();
        Map<Long, OpsReservationMutationTargetRecord> targetsByReservationId = new LinkedHashMap<>();
        for (Long reservationId : reservationIdsToLock) {
            OpsReservationMutationTargetRecord target = reservationQueryMapper.lockOpsReservationMutationTarget(reservationId);
            if (target == null) {
                throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Reservation not found.");
            }
            requireMutationAccess(actor, target.getHostUserId());
            if (!isEligibleReservationStatus(target.getStatus())) {
                throw new AppException(
                        ErrorCode.INVALID_REQUEST,
                        HttpStatus.CONFLICT,
                        "Only pending or confirmed reservations can be swapped."
                );
            }
            targetsByReservationId.put(reservationId, target);
        }

        OpsReservationMutationTargetRecord sourceTarget = targetsByReservationId.get(requestedSwap.sourceReservationId());
        OpsReservationMutationTargetRecord targetTarget = targetsByReservationId.get(requestedSwap.targetReservationId());
        if (!sourceTarget.getAccommodationId().equals(targetTarget.getAccommodationId())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Only reservation nights in the same accommodation can be swapped."
            );
        }

        List<OpsReservationNightRecord> reservationNights =
                reservationQueryMapper.findOpsReservationNightsByReservationIds(reservationIdsToLock);
        Map<Long, OpsReservationNightRecord> nightsById = new LinkedHashMap<>();
        for (OpsReservationNightRecord reservationNight : reservationNights) {
            nightsById.put(reservationNight.getReservationNightId(), reservationNight);
        }

        OpsReservationNightRecord sourceNight = requireReservationNight(
                nightsById,
                requestedSwap.sourceReservationNightId(),
                requestedSwap.sourceReservationId()
        );
        OpsReservationNightRecord targetNight = requireReservationNight(
                nightsById,
                requestedSwap.targetReservationNightId(),
                requestedSwap.targetReservationId()
        );

        if (!sourceNight.getStayDate().equals(targetNight.getStayDate())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Only reservation nights on the same stay date can be swapped."
            );
        }
        if (sourceNight.getAssignedRoomId().equals(targetNight.getAssignedRoomId())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Swap requires two different assigned rooms."
            );
        }

        LocalDate businessDate = LocalDate.now(clock);
        validateNightEligibility(sourceNight, businessDate);
        validateNightEligibility(targetNight, businessDate);

        LocalDate stayDate = sourceNight.getStayDate();
        LocalDate stayDateExclusive = stayDate.plusDays(1);
        Map<Long, ActiveRoomInventoryRecord> activeRoomsById = lockActiveRooms(sourceTarget.getAccommodationId());
        ActiveRoomInventoryRecord sourceCurrentRoom = requireTargetRoom(activeRoomsById, sourceNight.getAssignedRoomId());
        ActiveRoomInventoryRecord targetCurrentRoom = requireTargetRoom(activeRoomsById, targetNight.getAssignedRoomId());

        Map<LocalDate, Set<Long>> blockedRoomsByDate = buildBlockedRoomsByDate(
                reservationInventoryMapper.findActiveRoomBlocksForAccommodationStay(
                        sourceTarget.getAccommodationId(),
                        stayDate,
                        stayDateExclusive
                ),
                stayDate,
                stayDateExclusive
        );
        Set<Long> blockedRooms = blockedRoomsByDate.getOrDefault(stayDate, Set.of());
        if (blockedRooms.contains(sourceCurrentRoom.getRoomId()) || blockedRooms.contains(targetCurrentRoom.getRoomId())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Blocked rooms cannot participate in a reservation-night swap."
            );
        }

        LocalDateTime now = LocalDateTime.now(clock);
        reservationCommandMapper.updateReservationNightAssignedRoom(
                sourceNight.getReservationNightId(),
                targetCurrentRoom.getRoomId(),
                now
        );
        reservationCommandMapper.updateReservationNightAssignedRoom(
                targetNight.getReservationNightId(),
                sourceCurrentRoom.getRoomId(),
                now
        );
        reservationCommandMapper.touchReservationUpdatedAt(sourceTarget.getReservationId(), now);
        reservationCommandMapper.touchReservationUpdatedAt(targetTarget.getReservationId(), now);

        Map<String, Object> sourceBeforeState = new LinkedHashMap<>();
        sourceBeforeState.put("night", buildNightState(
                sourceNight.getReservationNightId(),
                sourceNight.getStayDate(),
                sourceNight.getAssignedRoomId(),
                sourceNight.getAssignedRoomCode(),
                sourceNight.getAssignedRoomTypeId(),
                sourceNight.getAssignedRoomTypeName()
        ));
        sourceBeforeState.put("swapPartnerReservationId", targetTarget.getReservationId());
        sourceBeforeState.put("swapPartnerReservationNo", targetTarget.getReservationNo());
        Map<String, Object> sourceAfterState = new LinkedHashMap<>();
        sourceAfterState.put("night", buildNightState(
                sourceNight.getReservationNightId(),
                sourceNight.getStayDate(),
                targetCurrentRoom.getRoomId(),
                targetCurrentRoom.getRoomCode(),
                targetCurrentRoom.getRoomTypeId(),
                targetCurrentRoom.getRoomTypeName()
        ));
        sourceAfterState.put("swapPartnerReservationId", targetTarget.getReservationId());
        sourceAfterState.put("swapPartnerReservationNo", targetTarget.getReservationNo());

        Map<String, Object> targetBeforeState = new LinkedHashMap<>();
        targetBeforeState.put("night", buildNightState(
                targetNight.getReservationNightId(),
                targetNight.getStayDate(),
                targetNight.getAssignedRoomId(),
                targetNight.getAssignedRoomCode(),
                targetNight.getAssignedRoomTypeId(),
                targetNight.getAssignedRoomTypeName()
        ));
        targetBeforeState.put("swapPartnerReservationId", sourceTarget.getReservationId());
        targetBeforeState.put("swapPartnerReservationNo", sourceTarget.getReservationNo());
        Map<String, Object> targetAfterState = new LinkedHashMap<>();
        targetAfterState.put("night", buildNightState(
                targetNight.getReservationNightId(),
                targetNight.getStayDate(),
                sourceCurrentRoom.getRoomId(),
                sourceCurrentRoom.getRoomCode(),
                sourceCurrentRoom.getRoomTypeId(),
                sourceCurrentRoom.getRoomTypeName()
        ));
        targetAfterState.put("swapPartnerReservationId", sourceTarget.getReservationId());
        targetAfterState.put("swapPartnerReservationNo", sourceTarget.getReservationNo());

        opsReservationAuditService.writeReservationAudit(
                actor,
                sourceTarget.getReservationId(),
                "RESERVATION_NIGHT_SWAPPED",
                "OPS_SWAP",
                "Reservation night swapped with another reservation by operations.",
                sourceBeforeState,
                sourceAfterState,
                now
        );
        opsReservationAuditService.writeReservationAudit(
                actor,
                targetTarget.getReservationId(),
                "RESERVATION_NIGHT_SWAPPED",
                "OPS_SWAP",
                "Reservation night swapped with another reservation by operations.",
                targetBeforeState,
                targetAfterState,
                now
        );

        return new ReservationNightSwapResult(
                sourceTarget.getReservationId(),
                sourceTarget.getReservationNo(),
                targetTarget.getReservationId(),
                targetTarget.getReservationNo(),
                stayDate,
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    private Map<Long, ReservationNightReassignmentChange> normalizeChanges(
            List<ReservationNightReassignmentChange> requestedChanges
    ) {
        Map<Long, ReservationNightReassignmentChange> changesByNightId = new LinkedHashMap<>();
        for (ReservationNightReassignmentChange requestedChange : requestedChanges) {
            if (requestedChange.reservationNightId() == null || requestedChange.assignedRoomId() == null) {
                throw new AppException(
                        ErrorCode.INVALID_REQUEST,
                        HttpStatus.BAD_REQUEST,
                        "Reservation night id and assigned room id are required."
                );
            }
            if (changesByNightId.putIfAbsent(requestedChange.reservationNightId(), requestedChange) != null) {
                throw new AppException(
                        ErrorCode.INVALID_REQUEST,
                        HttpStatus.BAD_REQUEST,
                        "Each reservation night can only be changed once per request."
                );
            }
        }
        return changesByNightId;
    }

    private void validateSwapRequest(ReservationNightSwapChange requestedSwap) {
        if (requestedSwap == null
                || requestedSwap.sourceReservationId() == null
                || requestedSwap.sourceReservationNightId() == null
                || requestedSwap.targetReservationId() == null
                || requestedSwap.targetReservationNightId() == null) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Source and target reservation nights are required for swap."
            );
        }
        if (requestedSwap.sourceReservationNightId().equals(requestedSwap.targetReservationNightId())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Swap requires two different reservation nights."
            );
        }
    }

    private OpsReservationNightRecord requireReservationNight(
            Map<Long, OpsReservationNightRecord> nightsById,
            Long reservationNightId,
            Long reservationId
    ) {
        OpsReservationNightRecord reservationNight = nightsById.get(reservationNightId);
        if (reservationNight == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Reservation night not found.");
        }
        if (!reservationNight.getReservationId().equals(reservationId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Reservation night does not match the reservation.");
        }
        return reservationNight;
    }

    private Map<Long, ActiveRoomInventoryRecord> lockActiveRooms(Long accommodationId) {
        Map<Long, ActiveRoomInventoryRecord> activeRoomsById = new LinkedHashMap<>();
        for (ActiveRoomInventoryRecord activeRoom :
                reservationInventoryMapper.lockActiveRoomsByAccommodation(accommodationId)) {
            activeRoomsById.put(activeRoom.getRoomId(), activeRoom);
        }
        if (activeRoomsById.isEmpty()) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "No active rooms are available for reassignment."
            );
        }
        return activeRoomsById;
    }

    private void validateNightEligibility(OpsReservationNightRecord night, LocalDate businessDate) {
        if (night.getStayDate().isBefore(businessDate)) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Past nights cannot be reassigned."
            );
        }
    }

    private ActiveRoomInventoryRecord requireTargetRoom(
            Map<Long, ActiveRoomInventoryRecord> activeRoomsById,
            Long assignedRoomId
    ) {
        ActiveRoomInventoryRecord targetRoom = activeRoomsById.get(assignedRoomId);
        if (targetRoom == null) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Selected room is not an active room in this accommodation."
            );
        }
        return targetRoom;
    }

    private boolean isEligibleReservationStatus(ReservationStatus status) {
        return status == ReservationStatus.PENDING || status == ReservationStatus.CONFIRMED;
    }

    private void requireMutationAccess(SessionUser actor, Long hostUserId) {
        if (actor.role() == UserRole.ADMIN) {
            return;
        }
        if (!actor.userId().equals(hostUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }
    }

    private Map<LocalDate, Set<Long>> buildBlockedRoomsByDate(
            List<BlockedRoomRangeRecord> blockedRoomRanges,
            LocalDate startDate,
            LocalDate endDate
    ) {
        Map<LocalDate, Set<Long>> blockedRoomsByDate = new HashMap<>();
        for (BlockedRoomRangeRecord blockedRoomRange : blockedRoomRanges) {
            LocalDate cursor = blockedRoomRange.getStartDate().isBefore(startDate)
                    ? startDate
                    : blockedRoomRange.getStartDate();
            while (cursor.isBefore(endDate) && !cursor.isAfter(blockedRoomRange.getEndDate())) {
                blockedRoomsByDate
                        .computeIfAbsent(cursor, ignored -> new LinkedHashSet<>())
                        .add(blockedRoomRange.getRoomId());
                cursor = cursor.plusDays(1);
            }
        }
        return blockedRoomsByDate;
    }

    private Map<LocalDate, Set<Long>> buildOccupiedRoomsByDate(List<OccupiedRoomNightRecord> occupiedRoomNights) {
        Map<LocalDate, Set<Long>> occupiedRoomsByDate = new HashMap<>();
        for (OccupiedRoomNightRecord occupiedRoomNight : occupiedRoomNights) {
            occupiedRoomsByDate
                    .computeIfAbsent(occupiedRoomNight.getStayDate(), ignored -> new LinkedHashSet<>())
                    .add(occupiedRoomNight.getRoomId());
        }
        return occupiedRoomsByDate;
    }

    private Map<String, Object> buildNightState(
            Long reservationNightId,
            LocalDate stayDate,
            Long roomId,
            String roomCode,
            Long roomTypeId,
            String roomTypeName
    ) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("reservationNightId", reservationNightId);
        state.put("stayDate", stayDate);
        state.put("assignedRoomId", roomId);
        state.put("assignedRoomCode", roomCode);
        state.put("assignedRoomTypeId", roomTypeId);
        state.put("assignedRoomTypeName", roomTypeName);
        return state;
    }

    public record ReservationNightReassignmentChange(
            Long reservationNightId,
            Long assignedRoomId
    ) {
    }

    public record ReservationNightSwapChange(
            Long sourceReservationId,
            Long sourceReservationNightId,
            Long targetReservationId,
            Long targetReservationNightId
    ) {
        public List<Long> reservationIdsInLockOrder() {
            if (sourceReservationId.equals(targetReservationId)) {
                return List.of(sourceReservationId);
            }
            return sourceReservationId < targetReservationId
                    ? List.of(sourceReservationId, targetReservationId)
                    : List.of(targetReservationId, sourceReservationId);
        }
    }
}
