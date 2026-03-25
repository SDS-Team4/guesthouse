package com.guesthouse.opsapi.reservation.api;

import com.guesthouse.opsapi.reservation.service.OpsReservationNightView;

import java.time.LocalDate;
import java.util.List;

public record OpsReservationNightResponse(
        Long reservationNightId,
        LocalDate stayDate,
        Long assignedRoomId,
        String assignedRoomCode,
        Long assignedRoomTypeId,
        String assignedRoomTypeName,
        boolean assignedRoomBlocked,
        boolean assignedRoomTypeOverride,
        boolean reassignmentAllowed,
        String reassignmentBlockedReason,
        List<OpsReassignmentCandidateResponse> availableReassignmentRooms
) {

    public static OpsReservationNightResponse from(OpsReservationNightView view) {
        return new OpsReservationNightResponse(
                view.night().getReservationNightId(),
                view.night().getStayDate(),
                view.night().getAssignedRoomId(),
                view.night().getAssignedRoomCode(),
                view.night().getAssignedRoomTypeId(),
                view.night().getAssignedRoomTypeName(),
                view.assignedRoomBlocked(),
                view.assignedRoomTypeOverride(),
                view.reassignmentAllowed(),
                view.reassignmentBlockedReason(),
                view.availableReassignmentRooms().stream()
                        .map(OpsReassignmentCandidateResponse::from)
                        .toList()
        );
    }
}
