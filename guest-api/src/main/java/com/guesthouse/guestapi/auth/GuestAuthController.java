package com.guesthouse.guestapi.auth;

import com.guesthouse.shared.auth.api.AuthenticatedUserResponse;
import com.guesthouse.shared.auth.api.LoginRequest;
import com.guesthouse.shared.auth.api.LogoutResponse;
import com.guesthouse.guestapi.auth.api.LoginIdAvailabilityResponse;
import com.guesthouse.guestapi.auth.api.SignupFieldAvailabilityResponse;
import com.guesthouse.shared.auth.service.LoginCommand;
import com.guesthouse.shared.auth.service.SessionAuthenticationService;
import com.guesthouse.guestapi.auth.api.GuestSignupResponse;
import com.guesthouse.guestapi.auth.api.SignupRequest;
import com.guesthouse.guestapi.auth.api.SignupTermResponse;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.EnumSet;
import java.util.List;

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
        guestSignupService.signup(signupRequest);
        return ApiResponse.success(GuestSignupResponse.fromRegistered());
    }

    @GetMapping("/signup-terms")
    public ApiResponse<List<SignupTermResponse>> getSignupTerms() {
        return ApiResponse.success(
                guestSignupService.findPublishedRequiredTerms()
                        .stream()
                        .map(SignupTermResponse::from)
                        .toList()
        );
    }

    @GetMapping("/signup-login-id-availability")
    public ApiResponse<LoginIdAvailabilityResponse> checkSignupLoginIdAvailability(
            @RequestParam String loginId
    ) {
        return ApiResponse.success(
                new LoginIdAvailabilityResponse(
                        loginId == null ? null : loginId.trim(),
                        guestSignupService.isLoginIdAvailable(loginId)
                )
        );
    }

    @GetMapping("/signup-field-availability")
    public ApiResponse<SignupFieldAvailabilityResponse> checkSignupFieldAvailability(
            @RequestParam(required = false) String loginId,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone
    ) {
        return ApiResponse.success(
                guestSignupService.checkSignupFieldAvailability(loginId, email, phone)
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
