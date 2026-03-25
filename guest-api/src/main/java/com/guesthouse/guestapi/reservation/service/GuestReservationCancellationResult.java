package com.guesthouse.guestapi.reservation.service;

import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.OffsetDateTime;

public record GuestReservationCancellationResult(
        Long reservationId,
        String reservationNo,
        ReservationStatus status,
        OffsetDateTime cancelledAt
) {
}
