package com.guesthouse.shared.auth.config;

import com.guesthouse.shared.auth.session.CsrfProtectionInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AuthSecurityConfiguration {

    @Bean
    public CsrfProtectionInterceptor csrfProtectionInterceptor(AuthSessionProperties authSessionProperties) {
        return new CsrfProtectionInterceptor(authSessionProperties);
    }
}
