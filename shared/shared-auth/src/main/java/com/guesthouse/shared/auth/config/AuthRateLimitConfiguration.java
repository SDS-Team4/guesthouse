package com.guesthouse.shared.auth.config;

import com.guesthouse.shared.auth.service.AuthRateLimitService;
import com.guesthouse.shared.auth.session.AuthRateLimitInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AuthRateLimitConfiguration {

    @Bean
    public AuthRateLimitInterceptor authRateLimitInterceptor(AuthRateLimitService authRateLimitService) {
        return new AuthRateLimitInterceptor(authRateLimitService);
    }
}
