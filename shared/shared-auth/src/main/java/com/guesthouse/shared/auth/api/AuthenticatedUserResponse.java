package com.guesthouse.shared.auth.api;

import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.domain.user.UserRole;

public record AuthenticatedUserResponse(
        Long userId,
        String loginId,
        String name,
        UserRole role
) {

    public static AuthenticatedUserResponse from(SessionUser sessionUser) {
        return new AuthenticatedUserResponse(
                sessionUser.userId(),
                sessionUser.loginId(),
                sessionUser.name(),
                sessionUser.role()
        );
    }
}
