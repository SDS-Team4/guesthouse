package com.guesthouse.guestapi.account.api;

import com.guesthouse.guestapi.account.service.GuestAccountProfileView;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.user.UserStatus;

public record GuestAccountProfileResponse(
        Long userId,
        String loginId,
        String name,
        String email,
        String phone,
        UserRole role,
        UserStatus status
) {

    public static GuestAccountProfileResponse from(GuestAccountProfileView view) {
        return new GuestAccountProfileResponse(
                view.userId(),
                view.loginId(),
                view.name(),
                view.email(),
                view.phone(),
                view.role(),
                view.status()
        );
    }
}
