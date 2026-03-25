package com.guesthouse.opsapi.admin.api;

import com.guesthouse.shared.db.user.model.AdminUserDetailRecord;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.user.UserStatus;

import java.time.OffsetDateTime;
import java.time.ZoneId;

public record AdminUserDetailResponse(
        Long userId,
        String loginId,
        String name,
        String email,
        String phone,
        UserRole role,
        UserStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        Integer failedLoginCount,
        OffsetDateTime lastFailedAt,
        OffsetDateTime lockedUntil,
        OffsetDateTime lastLoginAt,
        OffsetDateTime passwordChangedAt
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static AdminUserDetailResponse from(AdminUserDetailRecord record) {
        return new AdminUserDetailResponse(
                record.getUserId(),
                record.getLoginId(),
                record.getName(),
                record.getEmail(),
                record.getPhone(),
                record.getRole(),
                record.getStatus(),
                record.getCreatedAt() == null ? null : record.getCreatedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getUpdatedAt() == null ? null : record.getUpdatedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getFailedLoginCount(),
                record.getLastFailedAt() == null ? null : record.getLastFailedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getLockedUntil() == null ? null : record.getLockedUntil().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getLastLoginAt() == null ? null : record.getLastLoginAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getPasswordChangedAt() == null ? null : record.getPasswordChangedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }
}
