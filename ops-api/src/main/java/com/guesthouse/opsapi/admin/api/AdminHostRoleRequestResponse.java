package com.guesthouse.opsapi.admin.api;

import com.guesthouse.shared.db.hostrole.model.HostRoleRequestRecord;
import com.guesthouse.shared.domain.user.HostRoleRequestStatus;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.user.UserStatus;

import java.time.OffsetDateTime;
import java.time.ZoneId;

public record AdminHostRoleRequestResponse(
        Long requestId,
        Long userId,
        String userLoginId,
        String userName,
        String userEmail,
        String userPhone,
        UserRole userRole,
        UserStatus userStatus,
        String requestReason,
        HostRoleRequestStatus status,
        Long reviewedByUserId,
        String reviewedByLoginId,
        String reviewedByName,
        String reviewReason,
        OffsetDateTime createdAt,
        OffsetDateTime reviewedAt
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static AdminHostRoleRequestResponse from(HostRoleRequestRecord record) {
        return new AdminHostRoleRequestResponse(
                record.getRequestId(),
                record.getUserId(),
                record.getUserLoginId(),
                record.getUserName(),
                record.getUserEmail(),
                record.getUserPhone(),
                record.getUserRole(),
                record.getUserStatus(),
                record.getRequestReason(),
                record.getStatus(),
                record.getReviewedByUserId(),
                record.getReviewedByLoginId(),
                record.getReviewedByName(),
                record.getReviewReason(),
                record.getCreatedAt() == null ? null : record.getCreatedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getReviewedAt() == null ? null : record.getReviewedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }
}
