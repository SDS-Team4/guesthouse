package com.guesthouse.guestapi.account;

import com.guesthouse.guestapi.account.api.ChangeGuestPasswordRequest;
import com.guesthouse.guestapi.account.api.CreateHostRoleRequestRequest;
import com.guesthouse.guestapi.account.api.GuestAccountPasswordChangeResponse;
import com.guesthouse.guestapi.account.api.GuestAccountProfileResponse;
import com.guesthouse.guestapi.account.api.GuestHostRoleRequestStateResponse;
import com.guesthouse.guestapi.account.api.UpdateGuestAccountProfileRequest;
import com.guesthouse.guestapi.account.service.GuestAccountProfileService;
import com.guesthouse.guestapi.account.service.GuestHostRoleRequestService;
import com.guesthouse.shared.auth.session.CurrentSessionUser;
import com.guesthouse.shared.auth.session.RequireRoles;
import com.guesthouse.shared.auth.session.SessionAuthConstants;
import com.guesthouse.shared.auth.session.SessionLifecycleService;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.domain.api.ApiResponse;
import com.guesthouse.shared.domain.user.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/account")
public class GuestAccountController {

    private final GuestAccountProfileService guestAccountProfileService;
    private final GuestHostRoleRequestService guestHostRoleRequestService;
    private final SessionLifecycleService sessionLifecycleService;

    public GuestAccountController(
            GuestAccountProfileService guestAccountProfileService,
            GuestHostRoleRequestService guestHostRoleRequestService,
            SessionLifecycleService sessionLifecycleService
    ) {
        this.guestAccountProfileService = guestAccountProfileService;
        this.guestHostRoleRequestService = guestHostRoleRequestService;
        this.sessionLifecycleService = sessionLifecycleService;
    }

    @GetMapping("/me")
    @RequireRoles(UserRole.GUEST)
    public ApiResponse<GuestAccountProfileResponse> getProfile(@CurrentSessionUser SessionUser sessionUser) {
        return ApiResponse.success(
                GuestAccountProfileResponse.from(guestAccountProfileService.getProfile(sessionUser.userId()))
        );
    }

    @PatchMapping("/me")
    @RequireRoles(UserRole.GUEST)
    public ApiResponse<GuestAccountProfileResponse> updateProfile(
            @CurrentSessionUser SessionUser sessionUser,
            @Valid @RequestBody UpdateGuestAccountProfileRequest request,
            HttpServletRequest httpServletRequest
    ) {
        GuestAccountProfileResponse response = GuestAccountProfileResponse.from(
                guestAccountProfileService.updateProfile(sessionUser.userId(), request)
        );
        HttpSession session = httpServletRequest.getSession(false);
        if (session != null) {
            session.setAttribute(
                    SessionAuthConstants.SESSION_USER_ATTRIBUTE,
                    new SessionUser(sessionUser.userId(), sessionUser.loginId(), response.name(), sessionUser.role())
            );
        }
        return ApiResponse.success(response);
    }

    @PostMapping("/password")
    @RequireRoles(UserRole.GUEST)
    public ApiResponse<GuestAccountPasswordChangeResponse> changePassword(
            @CurrentSessionUser SessionUser sessionUser,
            @Valid @RequestBody ChangeGuestPasswordRequest request,
            HttpServletRequest httpServletRequest
    ) {
        GuestAccountPasswordChangeResponse response = guestAccountProfileService.changePassword(sessionUser.userId(), request);
        sessionLifecycleService.invalidateSession(httpServletRequest);
        return ApiResponse.success(response);
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
