package com.guesthouse.guestapi.account;

import com.guesthouse.guestapi.account.api.CreateHostRoleRequestRequest;
import com.guesthouse.guestapi.account.api.GuestHostRoleRequestStateResponse;
import com.guesthouse.guestapi.account.service.GuestHostRoleRequestService;
import com.guesthouse.shared.auth.session.CurrentSessionUser;
import com.guesthouse.shared.auth.session.RequireRoles;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.domain.api.ApiResponse;
import com.guesthouse.shared.domain.user.UserRole;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/account")
public class GuestAccountController {

    private final GuestHostRoleRequestService guestHostRoleRequestService;

    public GuestAccountController(GuestHostRoleRequestService guestHostRoleRequestService) {
        this.guestHostRoleRequestService = guestHostRoleRequestService;
    }

    @GetMapping("/host-role-request")
    @RequireRoles(UserRole.GUEST)
    public ApiResponse<GuestHostRoleRequestStateResponse> getHostRoleRequestState(
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(
                GuestHostRoleRequestStateResponse.from(
                        guestHostRoleRequestService.getRequestState(sessionUser.userId())
                )
        );
    }

    @PostMapping("/host-role-request")
    @RequireRoles(UserRole.GUEST)
    public ApiResponse<GuestHostRoleRequestStateResponse> createHostRoleRequest(
            @CurrentSessionUser SessionUser sessionUser,
            @Valid @RequestBody CreateHostRoleRequestRequest request
    ) {
        return ApiResponse.success(
                GuestHostRoleRequestStateResponse.from(
                        guestHostRoleRequestService.createRequest(sessionUser, request.requestReason())
                )
        );
    }
}
