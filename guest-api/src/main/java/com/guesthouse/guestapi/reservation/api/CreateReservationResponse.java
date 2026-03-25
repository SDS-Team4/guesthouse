package com.guesthouse.guestapi.reservation.api;

import com.guesthouse.guestapi.reservation.service.CreateReservationResult;
import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CreateReservationResponse(
        Long reservationId,
        String reservationNo,
        Long accommodationId,
        Long roomTypeId,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        ReservationStatus status,
        OffsetDateTime requestedAt
) {

    public static CreateReservationResponse from(CreateReservationResult result) {
        return new CreateReservationResponse(
                result.reservationId(),
                result.reservationNo(),
                result.accommodationId(),
                result.roomTypeId(),
                result.checkInDate(),
                result.checkOutDate(),
                result.status(),
                result.requestedAt()
        );
    }
}
