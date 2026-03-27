package com.guesthouse.guestapi.auth.api;

public record LoginIdAvailabilityResponse(
        String loginId,
        boolean available
) {
}
