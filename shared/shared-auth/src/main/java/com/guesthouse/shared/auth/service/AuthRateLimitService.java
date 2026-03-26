package com.guesthouse.shared.auth.service;

import com.guesthouse.shared.auth.config.AuthRateLimitProperties;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class AuthRateLimitService {

    private static final Logger log = LoggerFactory.getLogger(AuthRateLimitService.class);

    private final StringRedisTemplate stringRedisTemplate;
    private final AuthRateLimitProperties authRateLimitProperties;

    public AuthRateLimitService(
            StringRedisTemplate stringRedisTemplate,
            AuthRateLimitProperties authRateLimitProperties
    ) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.authRateLimitProperties = authRateLimitProperties;
    }

    public void assertLoginAllowed(String clientIp) {
        if (!authRateLimitProperties.isEnabled()) {
            return;
        }

        AuthRateLimitProperties.Rule rule = authRateLimitProperties.getLogin();
        enforceLimit("login", "ip", normalizeIdentifier(clientIp), rule.getPerIpLimit(), rule.getPerIpWindowSeconds());
        enforceLimit("login", "global", "all", rule.getGlobalLimit(), rule.getGlobalWindowSeconds());
    }

    public void assertSignupAllowed(String clientIp) {
        if (!authRateLimitProperties.isEnabled()) {
            return;
        }

        AuthRateLimitProperties.Rule rule = authRateLimitProperties.getSignup();
        enforceLimit("signup", "ip", normalizeIdentifier(clientIp), rule.getPerIpLimit(), rule.getPerIpWindowSeconds());
        enforceLimit("signup", "global", "all", rule.getGlobalLimit(), rule.getGlobalWindowSeconds());
    }

    private void enforceLimit(
            String action,
            String scope,
            String identifier,
            int limit,
            long windowSeconds
    ) {
        if (limit <= 0 || windowSeconds <= 0) {
            return;
        }

        String key = "auth:rate-limit:" + action + ":" + scope + ":" + identifier;

        try {
            ValueOperations<String, String> valueOperations = stringRedisTemplate.opsForValue();
            Long currentCount = valueOperations.increment(key);
            if (currentCount == null) {
                return;
            }
            if (currentCount == 1L) {
                stringRedisTemplate.expire(key, Duration.ofSeconds(windowSeconds));
            }
            if (currentCount > limit) {
                throw new AppException(
                        ErrorCode.TOO_MANY_REQUESTS,
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Too many authentication requests. Please try again later."
                );
            }
        } catch (AppException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.warn("Auth rate limit check failed open for action={} scope={}", action, scope, exception);
        }
    }

    private String normalizeIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return "unknown";
        }
        return identifier.replace(':', '_').replace(' ', '_');
    }
}
