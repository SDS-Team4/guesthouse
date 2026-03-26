package com.guesthouse.shared.auth.config;

import com.guesthouse.shared.auth.session.AuthRateLimitInterceptor;
import com.guesthouse.shared.auth.session.RoleGuardInterceptor;
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

    public AuthWebMvcConfigurer(ObjectProvider<AuthRateLimitInterceptor> authRateLimitInterceptorProvider) {
        this.authRateLimitInterceptorProvider = authRateLimitInterceptorProvider;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new SessionUserArgumentResolver());
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        AuthRateLimitInterceptor authRateLimitInterceptor = authRateLimitInterceptorProvider.getIfAvailable();
        if (authRateLimitInterceptor != null) {
            registry.addInterceptor(authRateLimitInterceptor);
        }
        registry.addInterceptor(new RoleGuardInterceptor());
    }
}
