package com.guesthouse.opsapi.admin.service;

import com.guesthouse.shared.domain.user.HostRoleRequestStatus;
import com.guesthouse.shared.domain.user.UserRole;

import java.time.OffsetDateTime;

public record AdminHostRoleRequestMutationResult(
        Long requestId,
        Long userId,
        HostRoleRequestStatus status,
        UserRole userRole,
        String reviewReason,
        OffsetDateTime reviewedAt
) {
}
