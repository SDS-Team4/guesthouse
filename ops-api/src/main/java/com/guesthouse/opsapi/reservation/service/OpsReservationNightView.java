package com.guesthouse.opsapi.reservation.service;

import com.guesthouse.shared.db.reservation.model.OpsReservationNightRecord;

import java.util.List;

public record OpsReservationNightView(
        OpsReservationNightRecord night,
        boolean assignedRoomBlocked,
        boolean assignedRoomTypeOverride,
        boolean reassignmentAllowed,
        String reassignmentBlockedReason,
        List<OpsReassignmentCandidateView> availableReassignmentRooms
) {
}
