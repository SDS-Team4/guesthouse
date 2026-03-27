package com.guesthouse.shared.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordConfirmRequest(
        @NotBlank
        @Size(min = 4, max = 50)
        String loginId,
        @NotBlank
        @Size(max = 50)
        String name,
        @Email
        @Size(max = 100)
        String email,
        @Size(max = 20)
        String phone,
        @NotBlank
        @Size(min = 6, max = 20)
        String verificationCode,
        @NotBlank
        @Size(min = 8, max = 100)
        String newPassword,
        @NotBlank
        @Size(min = 8, max = 100)
        String newPasswordConfirm
) {
}
