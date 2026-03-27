package com.guesthouse.opsapi.reservation.api;

public record SwapReservationNightRequest(
        Long sourceReservationId,
        Long sourceReservationNightId,
        Long targetReservationId,
        Long targetReservationNightId
) {
}
