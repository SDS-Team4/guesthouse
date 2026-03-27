package com.guesthouse.opsapi.reservation.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ReservationNightSwapResult(
        Long sourceReservationId,
        String sourceReservationNo,
        Long targetReservationId,
        String targetReservationNo,
        LocalDate stayDate,
        OffsetDateTime changedAt
) {
}
