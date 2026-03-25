package com.guesthouse.guestapi.reservation.api;

import com.guesthouse.guestapi.reservation.service.GuestReservationCancellationResult;
import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.OffsetDateTime;

public record GuestReservationCancellationResponse(
        Long reservationId,
        String reservationNo,
        ReservationStatus status,
        OffsetDateTime cancelledAt
) {

    public static GuestReservationCancellationResponse from(GuestReservationCancellationResult result) {
        return new GuestReservationCancellationResponse(
                result.reservationId(),
                result.reservationNo(),
                result.status(),
                result.cancelledAt()
        );
    }
}
