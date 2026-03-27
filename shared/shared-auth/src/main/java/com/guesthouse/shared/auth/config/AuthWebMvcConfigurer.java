package com.guesthouse.shared.auth.config;

import com.guesthouse.shared.auth.session.AuthRateLimitInterceptor;
import com.guesthouse.shared.auth.session.CsrfProtectionInterceptor;
import com.guesthouse.shared.auth.session.RoleGuardInterceptor;
import com.guesthouse.shared.auth.session.SessionIntegrityService;
import com.guesthouse.shared.auth.session.SessionUserArgumentResolver;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class AuthWebMvcConfigurer implements WebMvcConfigurer {

    private final ObjectProvider<AuthRateLimitInterceptor> authRateLimitInterceptorProvider;
    private final ObjectProvider<CsrfProtectionInterceptor> csrfProtectionInterceptorProvider;
    private final ObjectProvider<SessionIntegrityService> sessionIntegrityServiceProvider;

    public AuthWebMvcConfigurer(
            ObjectProvider<AuthRateLimitInterceptor> authRateLimitInterceptorProvider,
            ObjectProvider<CsrfProtectionInterceptor> csrfProtectionInterceptorProvider,
            ObjectProvider<SessionIntegrityService> sessionIntegrityServiceProvider
    ) {
        this.authRateLimitInterceptorProvider = authRateLimitInterceptorProvider;
        this.csrfProtectionInterceptorProvider = csrfProtectionInterceptorProvider;
        this.sessionIntegrityServiceProvider = sessionIntegrityServiceProvider;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new SessionUserArgumentResolver(sessionIntegrityServiceProvider.getIfAvailable()));
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        AuthRateLimitInterceptor authRateLimitInterceptor = authRateLimitInterceptorProvider.getIfAvailable();
        if (authRateLimitInterceptor != null) {
            registry.addInterceptor(authRateLimitInterceptor);
        }
        registry.addInterceptor(new RoleGuardInterceptor(sessionIntegrityServiceProvider.getIfAvailable()));
        CsrfProtectionInterceptor csrfProtectionInterceptor = csrfProtectionInterceptorProvider.getIfAvailable();
        if (csrfProtectionInterceptor != null) {
            registry.addInterceptor(csrfProtectionInterceptor);
        }
    }
}
