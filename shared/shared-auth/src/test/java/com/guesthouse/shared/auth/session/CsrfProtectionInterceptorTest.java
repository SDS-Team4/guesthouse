package com.guesthouse.shared.auth.session;

import com.guesthouse.shared.auth.config.AuthSessionProperties;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CsrfProtectionInterceptorTest {

    @Test
    void preHandleAllowsSafeGetRequest() {
        CsrfProtectionInterceptor interceptor = new CsrfProtectionInterceptor(new AuthSessionProperties());

        assertDoesNotThrow(() -> interceptor.preHandle(
                new MockHttpServletRequest("GET", "/api/v1/auth/me"),
                new MockHttpServletResponse(),
                new Object()
        ));
    }

    @Test
    void preHandleRejectsMissingTokenForStateChangingRequest() {
        CsrfProtectionInterceptor interceptor = new CsrfProtectionInterceptor(new AuthSessionProperties());
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/logout");
        request.setSession(new MockHttpSession());

        AppException exception = assertThrows(
                AppException.class,
                () -> interceptor.preHandle(request, new MockHttpServletResponse(), new Object())
        );

        assertEquals(ErrorCode.INVALID_CSRF_TOKEN, exception.getErrorCode());
    }

    @Test
    void preHandleAcceptsMatchingHeaderAndSessionToken() {
        AuthSessionProperties properties = new AuthSessionProperties();
        CsrfProtectionInterceptor interceptor = new CsrfProtectionInterceptor(properties);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionAuthConstants.CSRF_TOKEN_ATTRIBUTE, "token-123");

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/account/password");
        request.setSession(session);
        request.addHeader(properties.getCsrfHeaderName(), "token-123");

        assertDoesNotThrow(() -> interceptor.preHandle(request, new MockHttpServletResponse(), new Object()));
    }
}
