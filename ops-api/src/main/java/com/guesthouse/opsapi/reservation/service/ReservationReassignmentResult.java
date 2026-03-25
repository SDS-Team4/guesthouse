package com.guesthouse.opsapi.reservation.service;

import java.time.OffsetDateTime;

public record ReservationReassignmentResult(
        Long reservationId,
        String reservationNo,
        int changedNightCount,
        OffsetDateTime changedAt
) {
}
