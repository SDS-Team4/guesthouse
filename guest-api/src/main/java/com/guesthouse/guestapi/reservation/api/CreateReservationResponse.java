package com.guesthouse.guestapi.reservation.api;

import com.guesthouse.guestapi.reservation.service.CreateReservationResult;
import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CreateReservationResponse(
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

    public static CreateReservationResponse from(CreateReservationResult result) {
        return new CreateReservationResponse(
                result.reservationId(),
                result.reservationNo(),
                result.accommodationId(),
                result.accommodationName(),
                result.roomTypeId(),
                result.roomTypeName(),
                result.guestCount(),
                result.checkInDate(),
                result.checkOutDate(),
                result.status(),
                result.requestedAt()
        );
    }
}
