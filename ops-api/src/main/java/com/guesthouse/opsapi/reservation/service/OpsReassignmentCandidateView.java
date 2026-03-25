package com.guesthouse.opsapi.reservation.service;

public record OpsReassignmentCandidateView(
        Long roomId,
        String roomCode,
        Long roomTypeId,
        String roomTypeName
) {
}
