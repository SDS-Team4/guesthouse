package com.guesthouse.opsapi.reservation.api;

import com.guesthouse.opsapi.reservation.service.OpsReassignmentCandidateView;

public record OpsReassignmentCandidateResponse(
        Long roomId,
        String roomCode,
        Long roomTypeId,
        String roomTypeName
) {

    public static OpsReassignmentCandidateResponse from(OpsReassignmentCandidateView view) {
        return new OpsReassignmentCandidateResponse(
                view.roomId(),
                view.roomCode(),
                view.roomTypeId(),
                view.roomTypeName()
        );
    }
}
