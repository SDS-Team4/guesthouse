package com.guesthouse.opsapi.admin.api;

import com.guesthouse.opsapi.admin.service.AdminHostRoleRequestMutationResult;
import com.guesthouse.shared.domain.user.HostRoleRequestStatus;
import com.guesthouse.shared.domain.user.UserRole;

import java.time.OffsetDateTime;

public record AdminHostRoleRequestDecisionResponse(
        Long requestId,
        Long userId,
        HostRoleRequestStatus status,
        UserRole userRole,
        String reviewReason,
        OffsetDateTime reviewedAt
) {

    public static AdminHostRoleRequestDecisionResponse from(AdminHostRoleRequestMutationResult result) {
        return new AdminHostRoleRequestDecisionResponse(
                result.requestId(),
                result.userId(),
                result.status(),
                result.userRole(),
                result.reviewReason(),
                result.reviewedAt()
        );
    }
}
