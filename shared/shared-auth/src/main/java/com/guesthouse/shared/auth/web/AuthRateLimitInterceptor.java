package com.guesthouse.shared.auth.web;

import com.guesthouse.shared.auth.config.AuthRateLimitProperties;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.config.AppRuntimeProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Locale;

@Component
public class AuthRateLimitInterceptor implements HandlerInterceptor {

    private final AuthRateLimitProperties authRateLimitProperties;
    private final StringRedisTemplate stringRedisTemplate;
    private final String runtimeName;

    public AuthRateLimitInterceptor(
            AuthRateLimitProperties authRateLimitProperties,
            ObjectProvider<StringRedisTemplate> stringRedisTemplateProvider,
            AppRuntimeProperties appRuntimeProperties
    ) {
        this.authRateLimitProperties = authRateLimitProperties;
        this.stringRedisTemplate = stringRedisTemplateProvider.getIfAvailable();
        this.runtimeName = appRuntimeProperties.getRuntimeName();
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!authRateLimitProperties.isEnabled() || stringRedisTemplate == null) {
            return true;
        }
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String requestUri = request.getRequestURI();
        AuthRateLimitProperties.LimitPolicy limitPolicy = resolvePolicy(requestUri);
        if (limitPolicy == null) {
            return true;
        }

        String action = resolveAction(requestUri);
        if (action == null) {
            return true;
        }

        String clientIp = resolveClientIp(request);
        if (isExceeded(buildPerIpKey(action, clientIp), limitPolicy.getPerIpLimit(), limitPolicy.getPerIpWindowSeconds())) {
            throw new AppException(
                    ErrorCode.RATE_LIMITED,
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Too many requests from this IP. Please try again later."
            );
        }

        if (isExceeded(buildGlobalKey(action), limitPolicy.getGlobalLimit(), limitPolicy.getGlobalWindowSeconds())) {
            throw new AppException(
                    ErrorCode.RATE_LIMITED,
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Too many requests are being processed right now. Please try again later."
            );
        }

        return true;
    }

    private AuthRateLimitProperties.LimitPolicy resolvePolicy(String requestUri) {
        if ("/api/v1/auth/login".equals(requestUri)) {
            return authRateLimitProperties.getLogin();
        }
        if ("/api/v1/auth/signup".equals(requestUri)) {
            return authRateLimitProperties.getSignup();
        }
        if ("/api/v1/auth/recovery/request".equals(requestUri)) {
            return authRateLimitProperties.getRecoveryRequest();
        }
        if ("/api/v1/auth/recovery/verify".equals(requestUri)) {
            return authRateLimitProperties.getRecoveryVerify();
        }
        return null;
    }

    private String resolveAction(String requestUri) {
        if ("/api/v1/auth/login".equals(requestUri)) {
            return "login";
        }
        if ("/api/v1/auth/signup".equals(requestUri)) {
            return "signup";
        }
        if ("/api/v1/auth/recovery/request".equals(requestUri)) {
            return "recovery-request";
        }
        if ("/api/v1/auth/recovery/verify".equals(requestUri)) {
            return "recovery-verify";
        }
        return null;
    }

    private boolean isExceeded(String key, int limit, long windowSeconds) {
        if (limit <= 0 || windowSeconds <= 0) {
            return false;
        }
        Long count = stringRedisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            stringRedisTemplate.expire(key, Duration.ofSeconds(windowSeconds));
        }
        return count != null && count > limit;
    }

    private String buildPerIpKey(String action, String clientIp) {
        return "auth-rate-limit:"
                + runtimeName.toLowerCase(Locale.ROOT)
                + ":"
                + action
                + ":ip:"
                + clientIp;
    }

    private String buildGlobalKey(String action) {
        return "auth-rate-limit:"
                + runtimeName.toLowerCase(Locale.ROOT)
                + ":"
                + action
                + ":global";
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            int commaIndex = forwardedFor.indexOf(',');
            return (commaIndex >= 0 ? forwardedFor.substring(0, commaIndex) : forwardedFor).trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
