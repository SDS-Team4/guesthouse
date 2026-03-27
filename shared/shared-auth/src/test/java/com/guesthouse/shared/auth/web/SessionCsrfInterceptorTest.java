package com.guesthouse.shared.auth.web;

import com.guesthouse.shared.auth.config.AuthSessionProperties;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.config.AppRuntimeProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SessionCsrfInterceptorTest {

    private SessionCsrfInterceptor sessionCsrfInterceptor;

    @BeforeEach
    void setUp() {
        AuthSessionProperties authSessionProperties = new AuthSessionProperties();
        authSessionProperties.setCsrfEnabled(true);
        authSessionProperties.setCsrfHeaderName("X-CSRF-Token");
        authSessionProperties.setCookieSecure(false);

        AppRuntimeProperties appRuntimeProperties = new AppRuntimeProperties();
        appRuntimeProperties.setRuntimeName("guest-api");

        sessionCsrfInterceptor = new SessionCsrfInterceptor(authSessionProperties, appRuntimeProperties);
    }

    @Test
    void preHandleRejectsAuthenticatedUnsafeRequestWithoutMatchingHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/account/me");
        request.getSession(true).setAttribute("SESSION_CSRF_TOKEN", "csrf-token");

        AppException exception = assertThrows(
                AppException.class,
                () -> sessionCsrfInterceptor.preHandle(request, new MockHttpServletResponse(), new Object())
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals("FORBIDDEN", exception.getErrorCode().getCode());
    }

    @Test
    void preHandleAllowsAuthenticatedUnsafeRequestWithMatchingHeader() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/account/me");
        request.getSession(true).setAttribute("SESSION_CSRF_TOKEN", "csrf-token");
        request.addHeader("X-CSRF-Token", "csrf-token");

        boolean allowed = sessionCsrfInterceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        assertEquals(true, allowed);
    }

    @Test
    void postHandleIssuesCsrfCookieWhenSessionExists() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.getSession(true);
        MockHttpServletResponse response = new MockHttpServletResponse();

        sessionCsrfInterceptor.postHandle(request, response, new Object(), null);

        String setCookie = response.getHeader(HttpHeaders.SET_COOKIE);
        assertNotNull(setCookie);
        assertEquals(true, setCookie.startsWith("GUEST_API_CSRF="));
    }
}
