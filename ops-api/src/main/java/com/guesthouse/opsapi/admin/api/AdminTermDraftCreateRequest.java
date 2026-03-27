package com.guesthouse.opsapi.admin.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminTermDraftCreateRequest(
        @NotBlank
        @Size(max = 50)
        String version
) {
}
