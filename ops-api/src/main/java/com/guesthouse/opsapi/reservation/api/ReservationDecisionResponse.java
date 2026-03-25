package com.guesthouse.opsapi.reservation.api;

import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.OffsetDateTime;

public record ReservationDecisionResponse(
        Long reservationId,
        String reservationNo,
        ReservationStatus status,
        OffsetDateTime changedAt
) {
}
