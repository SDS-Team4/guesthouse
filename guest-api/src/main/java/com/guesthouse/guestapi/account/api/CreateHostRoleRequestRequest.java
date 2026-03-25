package com.guesthouse.guestapi.account.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateHostRoleRequestRequest(
        @NotBlank
        @Size(max = 500)
        String requestReason
) {
}
