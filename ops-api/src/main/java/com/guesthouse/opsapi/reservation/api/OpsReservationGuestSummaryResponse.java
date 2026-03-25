package com.guesthouse.opsapi.reservation.api;

public record OpsReservationGuestSummaryResponse(
        Long guestUserId,
        String guestLoginId,
        String guestName
) {
}
