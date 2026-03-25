package com.guesthouse.shared.auth.config;

import com.guesthouse.shared.domain.config.AppRuntimeProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.ConfigureRedisAction;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

import java.util.Locale;

@Configuration
public class RedisSessionBaselineConfig {

    @Bean
    public CookieSerializer cookieSerializer(AppRuntimeProperties appRuntimeProperties) {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName(buildCookieName(appRuntimeProperties.getRuntimeName()));
        serializer.setUseHttpOnlyCookie(true);
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
}
