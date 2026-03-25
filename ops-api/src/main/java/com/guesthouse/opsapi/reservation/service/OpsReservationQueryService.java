package com.guesthouse.opsapi.reservation.service;

import com.guesthouse.shared.auth.session.SessionUser;
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
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class OpsReservationQueryService {

    private final ReservationQueryMapper reservationQueryMapper;
    private final OpsReservationRoomAvailabilitySupport roomAvailabilitySupport;
    private final Clock clock;

    public OpsReservationQueryService(
            ReservationQueryMapper reservationQueryMapper,
            OpsReservationRoomAvailabilitySupport roomAvailabilitySupport,
            Clock clock
    ) {
        this.reservationQueryMapper = reservationQueryMapper;
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
}
