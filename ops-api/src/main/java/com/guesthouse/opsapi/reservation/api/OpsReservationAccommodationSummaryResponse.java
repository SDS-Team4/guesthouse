package com.guesthouse.opsapi.reservation.api;

public record OpsReservationAccommodationSummaryResponse(
        Long accommodationId,
        String accommodationName,
        String region,
        String address
) {
}
