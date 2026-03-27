package com.guesthouse.guestapi.accommodation.service;

import com.guesthouse.guestapi.accommodation.config.GuestPublicReadProperties;
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
class GuestPublicReadRateLimitServiceTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private final Map<String, Long> counters = new HashMap<>();

    private GuestPublicReadRateLimitService guestPublicReadRateLimitService;

    @BeforeEach
    void setUp() {
        GuestPublicReadProperties properties = new GuestPublicReadProperties();
        properties.getSearch().setPerIpLimit(2);
        properties.getSearch().setPerIpWindowSeconds(60);
        properties.getSearch().setGlobalLimit(3);
        properties.getSearch().setGlobalWindowSeconds(60);

        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            long nextValue = counters.getOrDefault(key, 0L) + 1L;
            counters.put(key, nextValue);
            return nextValue;
        }).when(valueOperations).increment(anyString());
        when(stringRedisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Boolean.TRUE);

        guestPublicReadRateLimitService = new GuestPublicReadRateLimitService(stringRedisTemplate, properties);
    }

    @Test
    void searchLimitBlocksThirdRequestFromSameIp() {
        guestPublicReadRateLimitService.assertSearchAllowed("203.0.113.10");
        guestPublicReadRateLimitService.assertSearchAllowed("203.0.113.10");

        AppException exception = assertThrows(
                AppException.class,
                () -> guestPublicReadRateLimitService.assertSearchAllowed("203.0.113.10")
        );

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatus());
        assertEquals(ErrorCode.TOO_MANY_REQUESTS, exception.getErrorCode());
        verify(stringRedisTemplate).expire(
                "guest:public-read:rate-limit:search:global:all",
                Duration.ofSeconds(60)
        );
    }
}
