package com.guesthouse.shared.auth.session;

import com.guesthouse.shared.auth.service.AuthRateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

public class AuthRateLimitInterceptor implements HandlerInterceptor {

    private static final String LOGIN_PATH = "/api/v1/auth/login";
    private static final String SIGNUP_PATH = "/api/v1/auth/signup";

    private final AuthRateLimitService authRateLimitService;

    public AuthRateLimitInterceptor(AuthRateLimitService authRateLimitService) {
        this.authRateLimitService = authRateLimitService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String requestUri = request.getRequestURI();
        String clientIp = extractClientIp(request);
        if (LOGIN_PATH.equals(requestUri)) {
            authRateLimitService.assertLoginAllowed(clientIp);
        } else if (SIGNUP_PATH.equals(requestUri)) {
            authRateLimitService.assertSignupAllowed(clientIp);
        }

        return true;
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            int commaIndex = forwardedFor.indexOf(',');
            return commaIndex >= 0
                    ? forwardedFor.substring(0, commaIndex).trim()
                    : forwardedFor.trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }
}
