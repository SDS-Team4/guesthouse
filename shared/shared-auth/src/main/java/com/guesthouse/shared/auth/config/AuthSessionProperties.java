package com.guesthouse.shared.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "auth.session")
public class AuthSessionProperties {

    private boolean cookieSecure;
    private boolean csrfEnabled = true;
    private String csrfHeaderName = "X-CSRF-Token";

    public boolean isCookieSecure() {
        return cookieSecure;
    }

    public void setCookieSecure(boolean cookieSecure) {
        this.cookieSecure = cookieSecure;
    }

    public boolean isCsrfEnabled() {
        return csrfEnabled;
    }

    public void setCsrfEnabled(boolean csrfEnabled) {
        this.csrfEnabled = csrfEnabled;
    }

    public String getCsrfHeaderName() {
        return csrfHeaderName;
    }

    public void setCsrfHeaderName(String csrfHeaderName) {
        this.csrfHeaderName = csrfHeaderName;
    }
}
