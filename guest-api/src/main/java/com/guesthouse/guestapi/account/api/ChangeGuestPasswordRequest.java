package com.guesthouse.guestapi.account.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangeGuestPasswordRequest(
        @NotBlank
        @Size(min = 8, max = 100)
        String currentPassword,
        @NotBlank
        @Size(min = 8, max = 100)
        String newPassword,
        @NotBlank
        @Size(min = 8, max = 100)
        String newPasswordConfirm
) {
}
