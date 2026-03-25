package com.guesthouse.shared.domain.web;

import com.guesthouse.shared.domain.api.ApiResponse;
import com.guesthouse.shared.domain.config.AppRuntimeProperties;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final AppRuntimeProperties appRuntimeProperties;
    private final Environment environment;

    public HealthController(AppRuntimeProperties appRuntimeProperties, Environment environment) {
        this.appRuntimeProperties = appRuntimeProperties;
        this.environment = environment;
    }

    @GetMapping
    public ApiResponse<HealthPayload> health() {
        String activeProfiles = environment.getActiveProfiles().length == 0
                ? "default"
                : String.join(",", Arrays.asList(environment.getActiveProfiles()));

        return ApiResponse.success(new HealthPayload(
                appRuntimeProperties.getRuntimeName(),
                activeProfiles,
                "UP"
        ));
    }

    public record HealthPayload(
            String service,
            String activeProfiles,
            String status
    ) {
    }
}
