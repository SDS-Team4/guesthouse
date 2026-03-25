package com.guesthouse.opsapi.auth;

import com.guesthouse.shared.auth.api.AuthenticatedUserResponse;
import com.guesthouse.shared.auth.api.LoginRequest;
import com.guesthouse.shared.auth.api.LogoutResponse;
import com.guesthouse.shared.auth.service.LoginCommand;
import com.guesthouse.shared.auth.service.SessionAuthenticationService;
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
public class OpsAuthController {

    private final SessionAuthenticationService sessionAuthenticationService;

    public OpsAuthController(SessionAuthenticationService sessionAuthenticationService) {
        this.sessionAuthenticationService = sessionAuthenticationService;
    }

    @PostMapping("/login")
    public ApiResponse<AuthenticatedUserResponse> login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request
    ) {
        SessionUser sessionUser = sessionAuthenticationService.authenticate(
                new LoginCommand(loginRequest.loginId(), loginRequest.password()),
                EnumSet.of(UserRole.HOST, UserRole.ADMIN)
        );

        HttpSession session = request.getSession(true);
        session.setAttribute(SessionAuthConstants.SESSION_USER_ATTRIBUTE, sessionUser);
        return ApiResponse.success(AuthenticatedUserResponse.from(sessionUser));
    }

    @PostMapping("/logout")
    @RequireRoles({UserRole.HOST, UserRole.ADMIN})
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
    @RequireRoles({UserRole.HOST, UserRole.ADMIN})
    public ApiResponse<AuthenticatedUserResponse> currentUser(@CurrentSessionUser SessionUser sessionUser) {
        return ApiResponse.success(AuthenticatedUserResponse.from(sessionUser));
    }
}
