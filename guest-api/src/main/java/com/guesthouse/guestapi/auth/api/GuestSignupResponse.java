package com.guesthouse.guestapi.auth.api;

import com.guesthouse.guestapi.auth.service.GuestSignupResult;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.user.UserStatus;

import java.time.OffsetDateTime;

public record GuestSignupResponse(
        String loginId,
        String name,
        String email,
        String phone,
        UserRole role,
        UserStatus status,
        OffsetDateTime createdAt
) {

    public static GuestSignupResponse from(GuestSignupResult result) {
        return new GuestSignupResponse(
                result.loginId(),
                result.name(),
                result.email(),
                result.phone(),
                result.role(),
                result.status(),
                result.createdAt()
        );
    }
}
