package com.guesthouse.opsapi.reservation.service;

import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockQueryMapper;
import com.guesthouse.shared.db.roomblock.model.OpsAccommodationOptionRecord;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.ActivePricePolicyRecord;
import com.guesthouse.shared.db.reservation.model.ActiveRoomInventoryRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationBlockContextRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationDetailRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationListRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationNightRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.reservation.ReservationStatus;
import com.guesthouse.shared.domain.user.UserRole;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class OpsReservationQueryService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    private final ReservationQueryMapper reservationQueryMapper;
    private final RoomBlockQueryMapper roomBlockQueryMapper;
    private final OpsReservationRoomAvailabilitySupport roomAvailabilitySupport;
    private final Clock clock;

    public OpsReservationQueryService(
            ReservationQueryMapper reservationQueryMapper,
            RoomBlockQueryMapper roomBlockQueryMapper,
            OpsReservationRoomAvailabilitySupport roomAvailabilitySupport,
            Clock clock
    ) {
        this.reservationQueryMapper = reservationQueryMapper;
        this.roomBlockQueryMapper = roomBlockQueryMapper;
        this.roomAvailabilitySupport = roomAvailabilitySupport;
        this.clock = clock;
    }

    public List<OpsReservationListRecord> findReservations(SessionUser sessionUser, ReservationStatus status) {
        return reservationQueryMapper.findOpsReservations(
                sessionUser.userId(),
                sessionUser.role() == UserRole.ADMIN,
                status,
                LocalDate.now(clock)
        );
    }

    public OpsReservationCalendarView getReservationCalendar(
            SessionUser sessionUser,
            Long requestedAccommodationId,
            LocalDate startDate,
            Integer requestedDays
    ) {
        int days = requestedDays == null ? 7 : requestedDays;
        if (days < 1 || days > 365) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Reservation calendar supports between 1 and 365 days."
            );
        }

        LocalDate endDateExclusive = startDate.plusDays(days);
        LocalDate businessDate = LocalDate.now(clock);
        List<OpsAccommodationOptionRecord> accommodations = roomBlockQueryMapper.findAccessibleAccommodations(
                sessionUser.userId(),
                sessionUser.role() == UserRole.ADMIN
        );
        List<LocalDate> visibleDates = buildVisibleDates(startDate, endDateExclusive);
        if (accommodations.isEmpty()) {
            return new OpsReservationCalendarView(
                    null,
                    startDate,
                    endDateExclusive,
                    visibleDates,
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of()
            );
        }

        Long selectedAccommodationId = requestedAccommodationId == null
                ? accommodations.get(0).getAccommodationId()
                : requestedAccommodationId;
        boolean accessibleAccommodation = accommodations.stream()
                .anyMatch(item -> item.getAccommodationId().equals(selectedAccommodationId));
        if (!accessibleAccommodation) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        Map<Long, ActiveRoomInventoryRecord> activeRoomsById = roomAvailabilitySupport.loadActiveRoomsById(selectedAccommodationId);
        List<OpsReservationListRecord> reservations = reservationQueryMapper.findOpsReservationsForCalendar(
                sessionUser.userId(),
                sessionUser.role() == UserRole.ADMIN,
                selectedAccommodationId,
                startDate,
                endDateExclusive,
                businessDate
        );
        List<Long> reservationIds = reservations.stream().map(OpsReservationListRecord::getReservationId).toList();
        List<OpsReservationNightRecord> nights = reservationIds.isEmpty()
                ? List.of()
                : reservationQueryMapper.findOpsReservationNightsByReservationIds(reservationIds);
        List<OpsReservationBlockContextRecord> blockContexts =
                reservationQueryMapper.findActiveRoomBlockContextsByAccommodationIdForDateRange(
                        selectedAccommodationId,
                        startDate,
                        endDateExclusive
                );

        Map<Long, OpsReservationListRecord> reservationsById = reservations.stream()
                .collect(LinkedHashMap::new, (map, item) -> map.put(item.getReservationId(), item), Map::putAll);

        return new OpsReservationCalendarView(
                selectedAccommodationId,
                startDate,
                endDateExclusive,
                visibleDates,
                accommodations.stream()
                        .map(item -> new OpsReservationCalendarView.AccommodationOption(
                                item.getAccommodationId(),
                                item.getAccommodationName(),
                                item.getRegion()
                        ))
                        .toList(),
                buildRoomTypeRows(activeRoomsById),
                reservations.stream()
                        .map(item -> new OpsReservationCalendarView.ReservationRow(
                                item.getReservationId(),
                                item.getReservationNo(),
                                item.getGuestLoginId(),
                                item.getGuestName(),
                                item.getGuestCount(),
                                item.getRoomTypeId(),
                                item.getRoomTypeName(),
                                item.getStatus(),
                                item.getCheckInDate(),
                                item.getCheckOutDate(),
                                item.getRequestedAt() == null
                                        ? null
                                        : item.getRequestedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                                item.isReassignmentPossible()
                        ))
                        .toList(),
                nights.stream()
                        .filter(item -> !item.getStayDate().isBefore(startDate))
                        .filter(item -> item.getStayDate().isBefore(endDateExclusive))
                        .map(item -> toAssignmentCell(item, reservationsById.get(item.getReservationId()), businessDate))
                        .filter(item -> item != null)
                        .toList(),
                buildBlockCells(blockContexts, startDate, endDateExclusive)
        );
    }

    public OpsReservationDetailView getReservationDetail(Long reservationId, SessionUser sessionUser) {
        OpsReservationDetailRecord reservation =
                reservationQueryMapper.findOpsReservationDetailByReservationId(reservationId);
        if (reservation == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Reservation not found.");
        }
        requireAuthorizedAccess(sessionUser, reservation.getHostUserId());

        List<OpsReservationNightRecord> nights =
                reservationQueryMapper.findOpsReservationNightsByReservationIds(List.of(reservationId));
        List<OpsReservationBlockContextRecord> blockContexts =
                reservationQueryMapper.findActiveRoomBlockContextsByAccommodationIdForDateRange(
                        reservation.getAccommodationId(),
                        reservation.getCheckInDate(),
                        reservation.getCheckOutDate()
                );
        List<ActivePricePolicyRecord> pricingPolicies =
                reservationQueryMapper.findActivePricePoliciesByRoomTypeIdForDateRange(
                        reservation.getAccommodationId(),
                        reservation.getRoomTypeId(),
                        reservation.getCheckInDate(),
                        reservation.getCheckOutDate()
                );

        Map<Long, ActiveRoomInventoryRecord> activeRoomsById =
                roomAvailabilitySupport.loadActiveRoomsById(reservation.getAccommodationId());
        Map<LocalDate, Set<Long>> blockedRoomsByDate = roomAvailabilitySupport.buildBlockedRoomsByDate(
                blockContexts,
                reservation.getCheckInDate(),
                reservation.getCheckOutDate()
        );
        Map<LocalDate, Set<Long>> occupiedRoomsByDate = roomAvailabilitySupport.buildOccupiedRoomsByDate(
                reservationQueryMapper.findOccupiedRoomNightsByAccommodationIdsForDateRange(
                        List.of(reservation.getAccommodationId()),
                        reservation.getCheckInDate(),
                        reservation.getCheckOutDate()
                )
        );
        LocalDate businessDate = LocalDate.now(clock);

        List<OpsReservationNightView> nightViews = nights.stream()
                .map(night -> toNightView(
                        reservation,
                        night,
                        activeRoomsById,
                        blockedRoomsByDate.getOrDefault(night.getStayDate(), Set.of()),
                        occupiedRoomsByDate.getOrDefault(night.getStayDate(), Set.of()),
                        businessDate
                ))
                .toList();

        boolean reassignmentPossible = nightViews.stream().anyMatch(OpsReservationNightView::reassignmentAllowed);

        return new OpsReservationDetailView(
                reservation,
                nightViews,
                reservationQueryMapper.findOpsReservationStatusHistoryByReservationId(reservationId),
                blockContexts,
                pricingPolicies,
                reassignmentPossible
        );
    }

    private OpsReservationNightView toNightView(
            OpsReservationDetailRecord reservation,
            OpsReservationNightRecord night,
            Map<Long, ActiveRoomInventoryRecord> activeRoomsById,
            Set<Long> blockedRooms,
            Set<Long> occupiedRooms,
            LocalDate businessDate
    ) {
        boolean reassignmentAllowed = isReassignmentAllowedByPolicy(reservation.getStatus(), night.getStayDate(), businessDate);
        String blockedReason = reassignmentAllowed
                ? null
                : buildReassignmentBlockedReason(reservation.getStatus(), night.getStayDate(), businessDate);

        return new OpsReservationNightView(
                night,
                blockedRooms.contains(night.getAssignedRoomId()),
                !reservation.getRoomTypeId().equals(night.getAssignedRoomTypeId()),
                reassignmentAllowed,
                blockedReason,
                buildCandidateRooms(night, activeRoomsById, blockedRooms, occupiedRooms, reassignmentAllowed)
        );
    }

    private List<OpsReassignmentCandidateView> buildCandidateRooms(
            OpsReservationNightRecord night,
            Map<Long, ActiveRoomInventoryRecord> activeRoomsById,
            Set<Long> blockedRooms,
            Set<Long> occupiedRooms,
            boolean reassignmentAllowed
    ) {
        if (!reassignmentAllowed) {
            return List.of();
        }
        return activeRoomsById.values().stream()
                .filter(room -> !room.getRoomId().equals(night.getAssignedRoomId()))
                .filter(room -> !blockedRooms.contains(room.getRoomId()))
                .filter(room -> !occupiedRooms.contains(room.getRoomId()))
                .sorted(Comparator
                        .comparing(ActiveRoomInventoryRecord::getRoomTypeName)
                        .thenComparing(ActiveRoomInventoryRecord::getRoomCode))
                .map(room -> new OpsReassignmentCandidateView(
                        room.getRoomId(),
                        room.getRoomCode(),
                        room.getRoomTypeId(),
                        room.getRoomTypeName()
                ))
                .toList();
    }

    private boolean isReassignmentAllowedByPolicy(
            ReservationStatus status,
            LocalDate stayDate,
            LocalDate businessDate
    ) {
        return (status == ReservationStatus.PENDING || status == ReservationStatus.CONFIRMED)
                && !stayDate.isBefore(businessDate);
    }

    private String buildReassignmentBlockedReason(
            ReservationStatus status,
            LocalDate stayDate,
            LocalDate businessDate
    ) {
        if (status != ReservationStatus.PENDING && status != ReservationStatus.CONFIRMED) {
            return "Only pending or confirmed reservations can be reassigned.";
        }
        if (stayDate.isBefore(businessDate)) {
            return "Past nights cannot be reassigned.";
        }
        return null;
    }

    private void requireAuthorizedAccess(SessionUser sessionUser, Long hostUserId) {
        if (sessionUser.role() == UserRole.ADMIN) {
            return;
        }
        if (!sessionUser.userId().equals(hostUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }
    }

    private OpsReservationCalendarView.AssignmentCell toAssignmentCell(
            OpsReservationNightRecord night,
            OpsReservationListRecord reservation,
            LocalDate businessDate
    ) {
        if (reservation == null) {
            return null;
        }
        return new OpsReservationCalendarView.AssignmentCell(
                night.getReservationId(),
                night.getReservationNightId(),
                night.getStayDate(),
                night.getAssignedRoomId(),
                night.getAssignedRoomCode(),
                night.getAssignedRoomTypeId(),
                night.getAssignedRoomTypeName(),
                isReassignmentAllowedByPolicy(reservation.getStatus(), night.getStayDate(), businessDate)
        );
    }

    private List<OpsReservationCalendarView.RoomTypeRow> buildRoomTypeRows(
            Map<Long, ActiveRoomInventoryRecord> activeRoomsById
    ) {
        Map<Long, List<OpsReservationCalendarView.RoomRow>> roomsByRoomType = new LinkedHashMap<>();
        Map<Long, String> roomTypeNames = new LinkedHashMap<>();

        activeRoomsById.values().stream()
                .sorted(Comparator
                        .comparing(ActiveRoomInventoryRecord::getRoomTypeName)
                        .thenComparing(ActiveRoomInventoryRecord::getRoomCode))
                .forEach(room -> {
                    roomTypeNames.putIfAbsent(room.getRoomTypeId(), room.getRoomTypeName());
                    roomsByRoomType.computeIfAbsent(room.getRoomTypeId(), ignored -> new ArrayList<>())
                            .add(new OpsReservationCalendarView.RoomRow(room.getRoomId(), room.getRoomCode()));
                });

        return roomsByRoomType.entrySet().stream()
                .map(entry -> new OpsReservationCalendarView.RoomTypeRow(
                        entry.getKey(),
                        roomTypeNames.get(entry.getKey()),
                        entry.getValue()
                ))
                .toList();
    }

    private List<OpsReservationCalendarView.BlockCell> buildBlockCells(
            List<OpsReservationBlockContextRecord> blockContexts,
            LocalDate startDate,
            LocalDate endDateExclusive
    ) {
        List<OpsReservationCalendarView.BlockCell> cells = new ArrayList<>();
        for (OpsReservationBlockContextRecord blockContext : blockContexts) {
            LocalDate current = blockContext.getStartDate().isBefore(startDate) ? startDate : blockContext.getStartDate();
            LocalDate lastDateExclusive = blockContext.getEndDate().plusDays(1);
            while (current.isBefore(endDateExclusive) && current.isBefore(lastDateExclusive)) {
                cells.add(new OpsReservationCalendarView.BlockCell(
                        blockContext.getBlockId(),
                        blockContext.getRoomId(),
                        current,
                        blockContext.getReasonType(),
                        blockContext.getReasonText()
                ));
                current = current.plusDays(1);
            }
        }
        return cells;
    }

    private List<LocalDate> buildVisibleDates(LocalDate startDate, LocalDate endDateExclusive) {
        List<LocalDate> visibleDates = new ArrayList<>();
        LocalDate current = startDate;
        while (current.isBefore(endDateExclusive)) {
            visibleDates.add(current);
            current = current.plusDays(1);
        }
        return visibleDates;
    }
}
