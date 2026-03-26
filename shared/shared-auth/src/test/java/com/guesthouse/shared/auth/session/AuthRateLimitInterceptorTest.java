package com.guesthouse.shared.auth.session;

import com.guesthouse.shared.auth.service.AuthRateLimitService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class AuthRateLimitInterceptorTest {

    @Mock
    private AuthRateLimitService authRateLimitService;

    @Test
    void preHandleAppliesLoginLimitUsingForwardedIp() {
        AuthRateLimitInterceptor interceptor = new AuthRateLimitInterceptor(authRateLimitService);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.addHeader("X-Forwarded-For", "203.0.113.10, 10.0.0.1");

        interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        verify(authRateLimitService).assertLoginAllowed("203.0.113.10");
    }

    @Test
    void preHandleIgnoresUnprotectedAuthGetRequest() {
        AuthRateLimitInterceptor interceptor = new AuthRateLimitInterceptor(authRateLimitService);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/auth/me");

        interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        verifyNoInteractions(authRateLimitService);
    }
}
