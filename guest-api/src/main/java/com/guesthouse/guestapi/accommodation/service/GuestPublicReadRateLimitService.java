package com.guesthouse.guestapi.accommodation.service;

import com.guesthouse.guestapi.accommodation.config.GuestPublicReadProperties;
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
public class GuestPublicReadRateLimitService {

    private static final Logger log = LoggerFactory.getLogger(GuestPublicReadRateLimitService.class);

    private final StringRedisTemplate stringRedisTemplate;
    private final GuestPublicReadProperties guestPublicReadProperties;

    public GuestPublicReadRateLimitService(
            StringRedisTemplate stringRedisTemplate,
            GuestPublicReadProperties guestPublicReadProperties
    ) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.guestPublicReadProperties = guestPublicReadProperties;
    }

    public void assertSearchAllowed(String clientIp) {
        enforce("search", clientIp, guestPublicReadProperties.getSearch());
    }

    public void assertDetailAllowed(String clientIp) {
        enforce("detail", clientIp, guestPublicReadProperties.getDetail());
    }

    public void assertCalendarAllowed(String clientIp) {
        enforce("calendar", clientIp, guestPublicReadProperties.getCalendar());
    }

    private void enforce(String action, String clientIp, GuestPublicReadProperties.RateLimitRule rule) {
        enforceLimit(action, "ip", normalizeIdentifier(clientIp), rule.getPerIpLimit(), rule.getPerIpWindowSeconds());
        enforceLimit(action, "global", "all", rule.getGlobalLimit(), rule.getGlobalWindowSeconds());
    }

    private void enforceLimit(String action, String scope, String identifier, int limit, long windowSeconds) {
        if (limit <= 0 || windowSeconds <= 0) {
            return;
        }

        String key = "guest:public-read:rate-limit:" + action + ":" + scope + ":" + identifier;
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
                        "Too many public search requests. Please try again later."
                );
            }
        } catch (AppException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.warn("Guest public-read rate limit failed open for action={} scope={}", action, scope, exception);
        }
    }

    private String normalizeIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return "unknown";
        }
        return identifier.replace(':', '_').replace(' ', '_');
    }
}
