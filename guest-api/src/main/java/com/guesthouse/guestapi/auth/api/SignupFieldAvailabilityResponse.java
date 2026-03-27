package com.guesthouse.guestapi.auth.api;

public record SignupFieldAvailabilityResponse(
        String loginId,
        Boolean loginIdAvailable,
        String email,
        Boolean emailAvailable,
        String phone,
        Boolean phoneAvailable
) {
}
