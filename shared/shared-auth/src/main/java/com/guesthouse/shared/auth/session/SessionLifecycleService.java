package com.guesthouse.shared.auth.session;

import com.guesthouse.shared.domain.config.AppRuntimeProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class SessionLifecycleService {

    private final AppRuntimeProperties appRuntimeProperties;
    private final CsrfTokenService csrfTokenService;
    private final Clock clock;

    public SessionLifecycleService(
            AppRuntimeProperties appRuntimeProperties,
            CsrfTokenService csrfTokenService,
            Clock clock
    ) {
        this.appRuntimeProperties = appRuntimeProperties;
        this.csrfTokenService = csrfTokenService;
        this.clock = clock;
    }

    public void establishAuthenticatedSession(
            HttpServletRequest request,
            HttpServletResponse response,
            SessionUser sessionUser
    ) {
        HttpSession existingSession = request.getSession(false);
        if (existingSession != null) {
            existingSession.invalidate();
        }

        HttpSession session = request.getSession(true);
        session.setAttribute(SessionAuthConstants.SESSION_USER_ATTRIBUTE, sessionUser);
        session.setAttribute(SessionAuthConstants.SESSION_RUNTIME_ATTRIBUTE, appRuntimeProperties.getRuntimeName());
        session.setAttribute(SessionAuthConstants.SESSION_AUTHENTICATED_AT_ATTRIBUTE, LocalDateTime.now(clock));
        String csrfToken = csrfTokenService.ensureToken(session);
        csrfTokenService.attachToken(response, csrfToken);
    }

    public void invalidateSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    public void attachCsrfTokenIfSessionPresent(HttpServletRequest request, HttpServletResponse response) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return;
        }
        String csrfToken = csrfTokenService.ensureToken(session);
        csrfTokenService.attachToken(response, csrfToken);
    }
}
