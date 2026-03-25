package com.guesthouse.guestapi.reservation.service;

import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationInventoryMapper;
import com.guesthouse.shared.db.reservation.model.BlockedRoomRangeRecord;
import com.guesthouse.shared.db.reservation.model.LockedRoomTypeRecord;
import com.guesthouse.shared.db.reservation.model.OccupiedRoomNightRecord;
import com.guesthouse.shared.db.reservation.model.ReservationInsertParam;
import com.guesthouse.shared.db.reservation.model.ReservationNightInsertParam;
import com.guesthouse.shared.db.reservation.model.ReservationStatusHistoryInsertParam;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.reservation.ReservationActionType;
import com.guesthouse.shared.domain.reservation.ReservationStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class ReservationRequestService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter RESERVATION_NO_TIMESTAMP_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final ReservationInventoryMapper reservationInventoryMapper;
    private final ReservationCommandMapper reservationCommandMapper;
    private final Clock clock;

    public ReservationRequestService(
            ReservationInventoryMapper reservationInventoryMapper,
            ReservationCommandMapper reservationCommandMapper,
            Clock clock
    ) {
        this.reservationInventoryMapper = reservationInventoryMapper;
        this.reservationCommandMapper = reservationCommandMapper;
        this.clock = clock;
    }

    @Transactional
    public CreateReservationResult createReservation(CreateReservationCommand command) {
        validateStayDateRules(command.checkInDate(), command.checkOutDate());

        LockedRoomTypeRecord lockedRoomType = reservationInventoryMapper.lockActiveRoomType(command.roomTypeId());
        if (lockedRoomType == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Room type not found.");
        }

        List<Long> lockedRoomIds = reservationInventoryMapper.lockActiveRoomIdsByRoomType(command.roomTypeId());
        if (lockedRoomIds.isEmpty()) {
            throw inventoryUnavailable();
        }

        List<BlockedRoomRangeRecord> blockedRoomRanges = reservationInventoryMapper.findActiveRoomBlocksForStay(
                command.roomTypeId(),
                command.checkInDate(),
                command.checkOutDate()
        );
        List<OccupiedRoomNightRecord> occupiedRoomNights = reservationInventoryMapper.findOccupiedRoomNightsForStay(
                command.roomTypeId(),
                command.checkInDate(),
                command.checkOutDate()
        );

        Map<LocalDate, Long> assignedRoomsByStayDate = assignRooms(
                command.checkInDate(),
                command.checkOutDate(),
                lockedRoomIds,
                blockedRoomRanges,
                occupiedRoomNights
        );

        LocalDateTime now = LocalDateTime.now(clock);
        ReservationInsertParam reservationInsertParam = buildReservationInsertParam(command, lockedRoomType, now);
        reservationCommandMapper.insertReservation(reservationInsertParam);

        List<ReservationNightInsertParam> reservationNightInsertParams = buildReservationNightInsertParams(
                reservationInsertParam.getReservationId(),
                assignedRoomsByStayDate,
                now
        );
        reservationCommandMapper.insertReservationNights(reservationNightInsertParams);
        reservationCommandMapper.insertReservationStatusHistory(
                buildReservationStatusHistoryInsertParam(reservationInsertParam.getReservationId(), command.guestUserId(), now)
        );

        return new CreateReservationResult(
                reservationInsertParam.getReservationId(),
                reservationInsertParam.getReservationNo(),
                lockedRoomType.getAccommodationId(),
                command.roomTypeId(),
                command.checkInDate(),
                command.checkOutDate(),
                ReservationStatus.PENDING,
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    private void validateStayDateRules(LocalDate checkInDate, LocalDate checkOutDate) {
        LocalDate today = LocalDate.now(clock);
        if (!checkInDate.isBefore(checkOutDate)) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Check-out date must be after check-in date."
            );
        }
        if (checkInDate.isBefore(today)) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Check-in date must not be in the past."
            );
        }
    }

    private Map<LocalDate, Long> assignRooms(
            LocalDate checkInDate,
            LocalDate checkOutDate,
            List<Long> lockedRoomIds,
            List<BlockedRoomRangeRecord> blockedRoomRanges,
            List<OccupiedRoomNightRecord> occupiedRoomNights
    ) {
        Map<LocalDate, Set<Long>> blockedRoomsByDate = buildBlockedRoomsByDate(
                checkInDate,
                checkOutDate,
                blockedRoomRanges
        );
        Map<LocalDate, Set<Long>> occupiedRoomsByDate = buildOccupiedRoomsByDate(occupiedRoomNights);
        Map<LocalDate, Long> assignments = new LinkedHashMap<>();

        LocalDate stayDate = checkInDate;
        while (stayDate.isBefore(checkOutDate)) {
            Set<Long> blockedRooms = blockedRoomsByDate.getOrDefault(stayDate, Set.of());
            Set<Long> occupiedRooms = occupiedRoomsByDate.getOrDefault(stayDate, Set.of());

            Long assignedRoomId = null;
            for (Long roomId : lockedRoomIds) {
                if (!blockedRooms.contains(roomId) && !occupiedRooms.contains(roomId)) {
                    assignedRoomId = roomId;
                    break;
                }
            }

            if (assignedRoomId == null) {
                throw inventoryUnavailable();
            }

            assignments.put(stayDate, assignedRoomId);
            stayDate = stayDate.plusDays(1);
        }

        return assignments;
    }

    private Map<LocalDate, Set<Long>> buildBlockedRoomsByDate(
            LocalDate checkInDate,
            LocalDate checkOutDate,
            List<BlockedRoomRangeRecord> blockedRoomRanges
    ) {
        Map<LocalDate, Set<Long>> blockedRoomsByDate = new HashMap<>();
        for (BlockedRoomRangeRecord blockedRoomRange : blockedRoomRanges) {
            LocalDate startDate = blockedRoomRange.getStartDate().isBefore(checkInDate)
                    ? checkInDate
                    : blockedRoomRange.getStartDate();
            LocalDate cursor = startDate;
            while (cursor.isBefore(checkOutDate) && !cursor.isAfter(blockedRoomRange.getEndDate())) {
                blockedRoomsByDate
                        .computeIfAbsent(cursor, ignored -> new HashSet<>())
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
                    .computeIfAbsent(occupiedRoomNight.getStayDate(), ignored -> new HashSet<>())
                    .add(occupiedRoomNight.getRoomId());
        }
        return occupiedRoomsByDate;
    }

    private ReservationInsertParam buildReservationInsertParam(
            CreateReservationCommand command,
            LockedRoomTypeRecord lockedRoomType,
            LocalDateTime now
    ) {
        ReservationInsertParam reservationInsertParam = new ReservationInsertParam();
        reservationInsertParam.setReservationNo(generateReservationNo(now));
        reservationInsertParam.setGuestUserId(command.guestUserId());
        reservationInsertParam.setAccommodationId(lockedRoomType.getAccommodationId());
        reservationInsertParam.setRoomTypeId(command.roomTypeId());
        reservationInsertParam.setCheckInDate(command.checkInDate());
        reservationInsertParam.setCheckOutDate(command.checkOutDate());
        reservationInsertParam.setStatus(ReservationStatus.PENDING);
        reservationInsertParam.setRequestedAt(now);
        reservationInsertParam.setCreatedAt(now);
        reservationInsertParam.setUpdatedAt(now);
        return reservationInsertParam;
    }

    private List<ReservationNightInsertParam> buildReservationNightInsertParams(
            Long reservationId,
            Map<LocalDate, Long> assignedRoomsByStayDate,
            LocalDateTime now
    ) {
        List<ReservationNightInsertParam> reservationNightInsertParams = new ArrayList<>();
        for (Map.Entry<LocalDate, Long> assignment : assignedRoomsByStayDate.entrySet()) {
            ReservationNightInsertParam reservationNightInsertParam = new ReservationNightInsertParam();
            reservationNightInsertParam.setReservationId(reservationId);
            reservationNightInsertParam.setStayDate(assignment.getKey());
            reservationNightInsertParam.setAssignedRoomId(assignment.getValue());
            reservationNightInsertParam.setCreatedAt(now);
            reservationNightInsertParam.setUpdatedAt(now);
            reservationNightInsertParams.add(reservationNightInsertParam);
        }
        return reservationNightInsertParams;
    }

    private ReservationStatusHistoryInsertParam buildReservationStatusHistoryInsertParam(
            Long reservationId,
            Long guestUserId,
            LocalDateTime now
    ) {
        ReservationStatusHistoryInsertParam reservationStatusHistoryInsertParam = new ReservationStatusHistoryInsertParam();
        reservationStatusHistoryInsertParam.setReservationId(reservationId);
        reservationStatusHistoryInsertParam.setFromStatus(null);
        reservationStatusHistoryInsertParam.setToStatus(ReservationStatus.PENDING);
        reservationStatusHistoryInsertParam.setActionType(ReservationActionType.REQUESTED);
        reservationStatusHistoryInsertParam.setChangedByUserId(guestUserId);
        reservationStatusHistoryInsertParam.setReasonType("GUEST_REQUEST");
        reservationStatusHistoryInsertParam.setReasonText("Reservation request created by guest.");
        reservationStatusHistoryInsertParam.setChangedAt(now);
        return reservationStatusHistoryInsertParam;
    }

    private String generateReservationNo(LocalDateTime now) {
        int suffix = ThreadLocalRandom.current().nextInt(100000, 1000000);
        return "GH-"
                + now.format(RESERVATION_NO_TIMESTAMP_FORMAT)
                + "-"
                + suffix;
    }

    private AppException inventoryUnavailable() {
        return new AppException(
                ErrorCode.INVENTORY_UNAVAILABLE,
                HttpStatus.CONFLICT,
                ErrorCode.INVENTORY_UNAVAILABLE.getDefaultMessage()
        );
    }
}
