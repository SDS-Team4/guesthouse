package com.guesthouse.shared.auth.web;

import com.guesthouse.shared.auth.config.AuthRateLimitProperties;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.config.AppRuntimeProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthRateLimitInterceptorTest {

    @Mock
    private ObjectProvider<StringRedisTemplate> stringRedisTemplateProvider;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private AuthRateLimitProperties authRateLimitProperties;
    private AppRuntimeProperties appRuntimeProperties;

    @BeforeEach
    void setUp() {
        authRateLimitProperties = new AuthRateLimitProperties();
        authRateLimitProperties.setEnabled(true);

        AuthRateLimitProperties.LimitPolicy loginPolicy = new AuthRateLimitProperties.LimitPolicy();
        loginPolicy.setPerIpLimit(30);
        loginPolicy.setPerIpWindowSeconds(300);
        loginPolicy.setGlobalLimit(300);
        loginPolicy.setGlobalWindowSeconds(60);
        authRateLimitProperties.setLogin(loginPolicy);

        AuthRateLimitProperties.LimitPolicy signupPolicy = new AuthRateLimitProperties.LimitPolicy();
        signupPolicy.setPerIpLimit(5);
        signupPolicy.setPerIpWindowSeconds(600);
        signupPolicy.setGlobalLimit(30);
        signupPolicy.setGlobalWindowSeconds(60);
        authRateLimitProperties.setSignup(signupPolicy);

        appRuntimeProperties = new AppRuntimeProperties();
        appRuntimeProperties.setRuntimeName("guest-api");
    }

    @Test
    void preHandleAllowsLoginWhenCountsAreWithinConfiguredLimits() throws Exception {
        when(stringRedisTemplateProvider.getIfAvailable()).thenReturn(stringRedisTemplate);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment("auth-rate-limit:guest-api:login:ip:127.0.0.1")).thenReturn(1L);
        when(valueOperations.increment("auth-rate-limit:guest-api:login:global")).thenReturn(1L);

        AuthRateLimitInterceptor interceptor = new AuthRateLimitInterceptor(
                authRateLimitProperties,
                stringRedisTemplateProvider,
                appRuntimeProperties
        );

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr("127.0.0.1");

        boolean allowed = interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        assertEquals(true, allowed);
        verify(stringRedisTemplate).expire("auth-rate-limit:guest-api:login:ip:127.0.0.1", Duration.ofSeconds(300));
        verify(stringRedisTemplate).expire("auth-rate-limit:guest-api:login:global", Duration.ofSeconds(60));
    }

    @Test
    void preHandleRejectsSignupWhenPerIpLimitIsExceeded() {
        when(stringRedisTemplateProvider.getIfAvailable()).thenReturn(stringRedisTemplate);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment("auth-rate-limit:guest-api:signup:ip:127.0.0.1")).thenReturn(6L);

        AuthRateLimitInterceptor interceptor = new AuthRateLimitInterceptor(
                authRateLimitProperties,
                stringRedisTemplateProvider,
                appRuntimeProperties
        );

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/signup");
        request.setRemoteAddr("127.0.0.1");

        AppException exception = assertThrows(
                AppException.class,
                () -> interceptor.preHandle(request, new MockHttpServletResponse(), new Object())
        );

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatus());
        assertEquals("RATE_LIMITED", exception.getErrorCode().getCode());
    }
}
