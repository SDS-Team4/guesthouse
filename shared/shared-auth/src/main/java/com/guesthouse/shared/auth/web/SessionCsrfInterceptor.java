package com.guesthouse.shared.auth.web;

import com.guesthouse.shared.auth.config.AuthSessionProperties;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.config.AppRuntimeProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import java.util.Locale;
import java.util.UUID;

@Component
public class SessionCsrfInterceptor implements HandlerInterceptor {

    private static final String CSRF_SESSION_ATTRIBUTE = "SESSION_CSRF_TOKEN";

    private final AuthSessionProperties authSessionProperties;
    private final String csrfCookieName;

    public SessionCsrfInterceptor(
            AuthSessionProperties authSessionProperties,
            AppRuntimeProperties appRuntimeProperties
    ) {
        this.authSessionProperties = authSessionProperties;
        this.csrfCookieName = buildCsrfCookieName(appRuntimeProperties.getRuntimeName());
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!authSessionProperties.isCsrfEnabled()) {
            return true;
        }
        if (!isUnsafeMethod(request.getMethod())) {
            return true;
        }
        if (isExemptPath(request.getRequestURI())) {
            return true;
        }

        HttpSession session = request.getSession(false);
        if (session == null) {
            return true;
        }

        String expectedToken = (String) session.getAttribute(CSRF_SESSION_ATTRIBUTE);
        String actualToken = request.getHeader(authSessionProperties.getCsrfHeaderName());
        if (expectedToken == null || actualToken == null || !expectedToken.equals(actualToken)) {
            throw new AppException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "CSRF token validation failed."
            );
        }
        return true;
    }

    @Override
    public void postHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            ModelAndView modelAndView
    ) {
        if (!authSessionProperties.isCsrfEnabled()) {
            return;
        }

        HttpSession session = request.getSession(false);
        if (session == null) {
            if ("/api/v1/auth/logout".equals(request.getRequestURI())) {
                expireCsrfCookie(response);
            }
            return;
        }

        String csrfToken = (String) session.getAttribute(CSRF_SESSION_ATTRIBUTE);
        if (csrfToken == null || csrfToken.isBlank()) {
            csrfToken = UUID.randomUUID().toString();
            session.setAttribute(CSRF_SESSION_ATTRIBUTE, csrfToken);
        }
        writeCsrfCookie(response, csrfToken);
    }

    private boolean isUnsafeMethod(String method) {
        return "POST".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method);
    }

    private boolean isExemptPath(String requestUri) {
        return "/api/v1/auth/login".equals(requestUri)
                || "/api/v1/auth/signup".equals(requestUri);
    }

    private void writeCsrfCookie(HttpServletResponse response, String csrfToken) {
        ResponseCookie cookie = ResponseCookie.from(csrfCookieName, csrfToken)
                .httpOnly(false)
                .secure(authSessionProperties.isCookieSecure())
                .sameSite("Lax")
                .path("/")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void expireCsrfCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(csrfCookieName, "")
                .httpOnly(false)
                .secure(authSessionProperties.isCookieSecure())
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String buildCsrfCookieName(String runtimeName) {
        return runtimeName
                .toUpperCase(Locale.ROOT)
                .replace('-', '_')
                + "_CSRF";
    }
}
