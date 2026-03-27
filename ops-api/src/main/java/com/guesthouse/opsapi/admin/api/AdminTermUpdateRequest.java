package com.guesthouse.opsapi.admin.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record AdminTermUpdateRequest(
        @NotBlank
        @Size(max = 200)
        String title,
        @NotBlank
        @Size(max = 65535)
        String content,
        @NotBlank
        @Size(max = 50)
        String version,
        boolean required,
        @NotNull
        LocalDateTime effectiveAt
) {
}
