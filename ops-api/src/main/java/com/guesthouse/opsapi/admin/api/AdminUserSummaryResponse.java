package com.guesthouse.opsapi.admin.api;

import com.guesthouse.shared.db.user.model.AdminUserListRecord;
import com.guesthouse.shared.domain.user.HostRoleRequestStatus;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.user.UserStatus;

import java.time.OffsetDateTime;
import java.time.ZoneId;

public record AdminUserSummaryResponse(
        Long userId,
        String loginId,
        String name,
        String email,
        String phone,
        UserRole role,
        UserStatus status,
        OffsetDateTime createdAt,
        Integer failedLoginCount,
        OffsetDateTime lockedUntil,
        OffsetDateTime lastLoginAt,
        HostRoleRequestStatus latestHostRoleRequestStatus
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static AdminUserSummaryResponse from(AdminUserListRecord record) {
        return new AdminUserSummaryResponse(
                record.getUserId(),
                record.getLoginId(),
                record.getName(),
                record.getEmail(),
                record.getPhone(),
                record.getRole(),
                record.getStatus(),
                record.getCreatedAt() == null ? null : record.getCreatedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getFailedLoginCount(),
                record.getLockedUntil() == null ? null : record.getLockedUntil().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getLastLoginAt() == null ? null : record.getLastLoginAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getLatestHostRoleRequestStatus()
        );
    }
}
