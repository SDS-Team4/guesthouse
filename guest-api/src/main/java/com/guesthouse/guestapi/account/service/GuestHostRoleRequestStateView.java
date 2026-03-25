package com.guesthouse.guestapi.account.service;

import com.guesthouse.shared.db.hostrole.model.HostRoleRequestRecord;
import com.guesthouse.shared.domain.user.UserRole;

public record GuestHostRoleRequestStateView(
        UserRole currentUserRole,
        boolean canSubmitNewRequest,
        String blockedReason,
        HostRoleRequestRecord latestRequest
) {
}
