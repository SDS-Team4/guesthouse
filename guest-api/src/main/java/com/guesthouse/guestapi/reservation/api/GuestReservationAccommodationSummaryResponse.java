package com.guesthouse.guestapi.reservation.api;

public record GuestReservationAccommodationSummaryResponse(
        Long accommodationId,
        String accommodationName,
        String region,
        String address
) {
}
