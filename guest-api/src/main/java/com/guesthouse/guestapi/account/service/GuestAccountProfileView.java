package com.guesthouse.guestapi.account.service;

import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.user.UserStatus;

public record GuestAccountProfileView(
        Long userId,
        String loginId,
        String name,
        String email,
        String phone,
        UserRole role,
        UserStatus status
) {
}
