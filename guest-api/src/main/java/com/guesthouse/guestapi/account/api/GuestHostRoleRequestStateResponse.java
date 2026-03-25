package com.guesthouse.guestapi.account.api;

import com.guesthouse.guestapi.account.service.GuestHostRoleRequestStateView;
import com.guesthouse.shared.domain.user.UserRole;

public record GuestHostRoleRequestStateResponse(
        UserRole currentUserRole,
        boolean canSubmitNewRequest,
        String blockedReason,
        GuestHostRoleRequestResponse latestRequest
) {

    public static GuestHostRoleRequestStateResponse from(GuestHostRoleRequestStateView view) {
        return new GuestHostRoleRequestStateResponse(
                view.currentUserRole(),
                view.canSubmitNewRequest(),
                view.blockedReason(),
                view.latestRequest() == null ? null : GuestHostRoleRequestResponse.from(view.latestRequest())
        );
    }
}
