package com.guesthouse.shared.auth.config;

import com.guesthouse.shared.domain.config.AppRuntimeProperties;
import org.springframework.core.env.Environment;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.ConfigureRedisAction;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

import java.util.Locale;

@Configuration
public class RedisSessionBaselineConfig {

    @Bean
    public CookieSerializer cookieSerializer(
            AppRuntimeProperties appRuntimeProperties,
            AuthSessionProperties authSessionProperties,
            Environment environment
    ) {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName(buildCookieName(appRuntimeProperties.getRuntimeName()));
        serializer.setUseHttpOnlyCookie(true);
        serializer.setUseSecureCookie(authSessionProperties.isCookieSecure() || isProductionProfile(environment));
        serializer.setSameSite("Lax");
        serializer.setCookiePath("/");
        return serializer;
    }

    @Bean
    public ConfigureRedisAction configureRedisAction() {
        return ConfigureRedisAction.NO_OP;
    }

    private String buildCookieName(String runtimeName) {
        return runtimeName
                .toUpperCase(Locale.ROOT)
                .replace('-', '_')
                + "_SESSION";
    }

    private boolean isProductionProfile(Environment environment) {
        for (String activeProfile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(activeProfile) || "production".equalsIgnoreCase(activeProfile)) {
                return true;
            }
        }
        return false;
    }
}
