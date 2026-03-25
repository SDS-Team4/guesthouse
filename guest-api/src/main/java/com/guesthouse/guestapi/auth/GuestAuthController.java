package com.guesthouse.guestapi.auth;

import com.guesthouse.shared.auth.api.AuthenticatedUserResponse;
import com.guesthouse.shared.auth.api.LoginRequest;
import com.guesthouse.shared.auth.api.LogoutResponse;
import com.guesthouse.shared.auth.service.LoginCommand;
import com.guesthouse.shared.auth.service.SessionAuthenticationService;
import com.guesthouse.guestapi.auth.api.GuestSignupResponse;
import com.guesthouse.guestapi.auth.api.SignupRequest;
import com.guesthouse.guestapi.auth.service.GuestSignupService;
import com.guesthouse.shared.auth.session.CurrentSessionUser;
import com.guesthouse.shared.auth.session.RequireRoles;
import com.guesthouse.shared.auth.session.SessionAuthConstants;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.domain.api.ApiResponse;
import com.guesthouse.shared.domain.user.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.EnumSet;

@RestController
@RequestMapping("/api/v1/auth")
public class GuestAuthController {

    private final SessionAuthenticationService sessionAuthenticationService;
    private final GuestSignupService guestSignupService;

    public GuestAuthController(
            SessionAuthenticationService sessionAuthenticationService,
            GuestSignupService guestSignupService
    ) {
        this.sessionAuthenticationService = sessionAuthenticationService;
        this.guestSignupService = guestSignupService;
    }

    @PostMapping("/login")
    public ApiResponse<AuthenticatedUserResponse> login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request
    ) {
        SessionUser sessionUser = sessionAuthenticationService.authenticate(
                new LoginCommand(loginRequest.loginId(), loginRequest.password()),
                EnumSet.of(UserRole.GUEST)
        );

        HttpSession session = request.getSession(true);
        session.setAttribute(SessionAuthConstants.SESSION_USER_ATTRIBUTE, sessionUser);
        return ApiResponse.success(AuthenticatedUserResponse.from(sessionUser));
    }

    @PostMapping("/signup")
    public ApiResponse<GuestSignupResponse> signup(@Valid @RequestBody SignupRequest signupRequest) {
        return ApiResponse.success(
                GuestSignupResponse.from(guestSignupService.signup(signupRequest))
        );
    }

    @PostMapping("/logout")
    @RequireRoles(UserRole.GUEST)
    public ApiResponse<LogoutResponse> logout(
            @CurrentSessionUser SessionUser sessionUser,
            HttpServletRequest request
    ) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ApiResponse.success(new LogoutResponse(true));
    }

    @GetMapping("/me")
    @RequireRoles(UserRole.GUEST)
    public ApiResponse<AuthenticatedUserResponse> currentUser(@CurrentSessionUser SessionUser sessionUser) {
        return ApiResponse.success(AuthenticatedUserResponse.from(sessionUser));
    }
}
