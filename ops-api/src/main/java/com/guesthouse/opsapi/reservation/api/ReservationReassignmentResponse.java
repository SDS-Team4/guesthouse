package com.guesthouse.opsapi.reservation.api;

import com.guesthouse.opsapi.reservation.service.ReservationReassignmentResult;

import java.time.OffsetDateTime;

public record ReservationReassignmentResponse(
        Long reservationId,
        String reservationNo,
        int changedNightCount,
        OffsetDateTime changedAt
) {

    public static ReservationReassignmentResponse from(ReservationReassignmentResult result) {
        return new ReservationReassignmentResponse(
                result.reservationId(),
                result.reservationNo(),
                result.changedNightCount(),
                result.changedAt()
        );
    }
}
