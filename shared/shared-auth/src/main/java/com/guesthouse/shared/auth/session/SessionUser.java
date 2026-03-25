package com.guesthouse.shared.auth.session;

import com.guesthouse.shared.domain.user.UserRole;

import java.io.Serializable;

public record SessionUser(
        Long userId,
        String loginId,
        String name,
        UserRole role
) implements Serializable {
}
