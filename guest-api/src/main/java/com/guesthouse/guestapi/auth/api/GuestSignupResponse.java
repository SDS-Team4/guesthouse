package com.guesthouse.guestapi.auth.api;

public record GuestSignupResponse(
        boolean registered
) {

    public static GuestSignupResponse fromRegistered() {
        return new GuestSignupResponse(true);
    }
}
