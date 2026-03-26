package com.guesthouse.shared.auth.service;

import com.guesthouse.shared.auth.config.AuthRateLimitProperties;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthRateLimitServiceTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private final Map<String, Long> counters = new HashMap<>();

    private AuthRateLimitService authRateLimitService;

    @BeforeEach
    void setUp() {
        AuthRateLimitProperties properties = new AuthRateLimitProperties();
        properties.getLogin().setPerIpLimit(2);
        properties.getLogin().setPerIpWindowSeconds(300);
        properties.getLogin().setGlobalLimit(3);
        properties.getLogin().setGlobalWindowSeconds(300);
        properties.getSignup().setPerIpLimit(2);
        properties.getSignup().setPerIpWindowSeconds(600);
        properties.getSignup().setGlobalLimit(3);
        properties.getSignup().setGlobalWindowSeconds(600);

        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            long nextValue = counters.getOrDefault(key, 0L) + 1L;
            counters.put(key, nextValue);
            return nextValue;
        }).when(valueOperations).increment(anyString());
        when(stringRedisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Boolean.TRUE);

        authRateLimitService = new AuthRateLimitService(stringRedisTemplate, properties);
    }

    @Test
    void signupLimitBlocksThirdRequestFromSameIp() {
        authRateLimitService.assertSignupAllowed("10.0.0.10");
        authRateLimitService.assertSignupAllowed("10.0.0.10");

        AppException exception = assertThrows(
                AppException.class,
                () -> authRateLimitService.assertSignupAllowed("10.0.0.10")
        );

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatus());
        assertEquals(ErrorCode.TOO_MANY_REQUESTS, exception.getErrorCode());
    }

    @Test
    void loginGlobalLimitBlocksBurstAcrossDifferentIps() {
        authRateLimitService.assertLoginAllowed("10.0.0.1");
        authRateLimitService.assertLoginAllowed("10.0.0.2");
        authRateLimitService.assertLoginAllowed("10.0.0.3");

        AppException exception = assertThrows(
                AppException.class,
                () -> authRateLimitService.assertLoginAllowed("10.0.0.4")
        );

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatus());
        assertEquals(ErrorCode.TOO_MANY_REQUESTS, exception.getErrorCode());
        verify(stringRedisTemplate).expire("auth:rate-limit:login:global:all", Duration.ofSeconds(300));
    }
}
