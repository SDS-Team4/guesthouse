package com.guesthouse.guestapi.auth.service;

import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.user.UserStatus;

import java.time.OffsetDateTime;

public record GuestSignupResult(
        Long userId,
        String loginId,
        String name,
        String email,
        String phone,
        UserRole role,
        UserStatus status,
        OffsetDateTime createdAt
) {
}
