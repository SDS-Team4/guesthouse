package com.guesthouse.opsapi.reservation.service;

import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.OffsetDateTime;

public record ReservationDecisionResult(
        Long reservationId,
        String reservationNo,
        ReservationStatus status,
        OffsetDateTime changedAt
) {
}
