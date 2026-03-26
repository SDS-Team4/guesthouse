package com.guesthouse.guestapi.reservation.service;

import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CreateReservationResult(
        Long reservationId,
        String reservationNo,
        Long accommodationId,
        String accommodationName,
        Long roomTypeId,
        String roomTypeName,
        Integer guestCount,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        ReservationStatus status,
        OffsetDateTime requestedAt
) {
}
