package com.guesthouse.shared.auth.session;

import com.guesthouse.shared.auth.config.AuthSessionProperties;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Set;

public class CsrfProtectionInterceptor implements HandlerInterceptor {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");
    private static final Set<String> EXCLUDED_PATHS = Set.of("/api/v1/auth/csrf-token");

    private final AuthSessionProperties authSessionProperties;

    public CsrfProtectionInterceptor(AuthSessionProperties authSessionProperties) {
        this.authSessionProperties = authSessionProperties;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!authSessionProperties.isCsrfEnabled()) {
            return true;
        }

        if (SAFE_METHODS.contains(request.getMethod().toUpperCase())) {
            return true;
        }

        if (EXCLUDED_PATHS.contains(request.getRequestURI())) {
            return true;
        }

        HttpSession session = request.getSession(false);
        if (session == null) {
            throw invalidCsrf();
        }

        Object expectedToken = session.getAttribute(SessionAuthConstants.CSRF_TOKEN_ATTRIBUTE);
        String requestToken = request.getHeader(authSessionProperties.getCsrfHeaderName());
        if (!(expectedToken instanceof String sessionToken) || sessionToken.isBlank() || requestToken == null || requestToken.isBlank()) {
            throw invalidCsrf();
        }

        if (!MessageDigest.isEqual(
                sessionToken.getBytes(StandardCharsets.UTF_8),
                requestToken.getBytes(StandardCharsets.UTF_8)
        )) {
            throw invalidCsrf();
        }

        return true;
    }

    private AppException invalidCsrf() {
        return new AppException(
                ErrorCode.INVALID_CSRF_TOKEN,
                HttpStatus.FORBIDDEN,
                ErrorCode.INVALID_CSRF_TOKEN.getDefaultMessage()
        );
    }
}
