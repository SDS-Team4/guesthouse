package com.guesthouse.shared.auth.config;

import com.guesthouse.shared.auth.session.RoleGuardInterceptor;
import com.guesthouse.shared.auth.session.SessionUserArgumentResolver;
import com.guesthouse.shared.auth.web.AuthRateLimitInterceptor;
import com.guesthouse.shared.auth.web.SessionCsrfInterceptor;
import com.guesthouse.shared.domain.config.AppRuntimeProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
@EnableConfigurationProperties({
        AuthRateLimitProperties.class,
        AuthSessionProperties.class,
        AppRuntimeProperties.class
})
public class AuthWebMvcConfigurer implements WebMvcConfigurer {

    private final AuthRateLimitInterceptor authRateLimitInterceptor;
    private final SessionCsrfInterceptor sessionCsrfInterceptor;

    public AuthWebMvcConfigurer(
            ObjectProvider<AuthRateLimitInterceptor> authRateLimitInterceptorProvider,
            ObjectProvider<SessionCsrfInterceptor> sessionCsrfInterceptorProvider
    ) {
        this.authRateLimitInterceptor = authRateLimitInterceptorProvider.getIfAvailable();
        this.sessionCsrfInterceptor = sessionCsrfInterceptorProvider.getIfAvailable();
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new SessionUserArgumentResolver());
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        if (authRateLimitInterceptor != null) {
            registry.addInterceptor(authRateLimitInterceptor);
        }
        if (sessionCsrfInterceptor != null) {
            registry.addInterceptor(sessionCsrfInterceptor);
        }
        registry.addInterceptor(new RoleGuardInterceptor());
    }
}
