package com.guesthouse.shared.auth.session;

import com.guesthouse.shared.auth.config.AuthSessionProperties;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;

@Service
public class CsrfTokenService {

    private static final int TOKEN_BYTES = 32;

    private final SecureRandom secureRandom = new SecureRandom();
    private final AuthSessionProperties authSessionProperties;

    public CsrfTokenService(AuthSessionProperties authSessionProperties) {
        this.authSessionProperties = authSessionProperties;
    }

    public String ensureToken(HttpSession session) {
        Object existing = session.getAttribute(SessionAuthConstants.CSRF_TOKEN_ATTRIBUTE);
        if (existing instanceof String existingToken && !existingToken.isBlank()) {
            return existingToken;
        }

        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        session.setAttribute(SessionAuthConstants.CSRF_TOKEN_ATTRIBUTE, token);
        return token;
    }

    public void attachToken(HttpServletResponse response, String token) {
        response.setHeader(authSessionProperties.getCsrfHeaderName(), token);
    }

    public String getHeaderName() {
        return authSessionProperties.getCsrfHeaderName();
    }
}
