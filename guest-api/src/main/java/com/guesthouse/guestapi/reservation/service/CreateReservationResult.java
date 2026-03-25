package com.guesthouse.guestapi.reservation.service;

import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CreateReservationResult(
        Long reservationId,
        String reservationNo,
        Long accommodationId,
        Long roomTypeId,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        ReservationStatus status,
        OffsetDateTime requestedAt
) {
}
