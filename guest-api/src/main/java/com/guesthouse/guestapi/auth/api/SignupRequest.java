package com.guesthouse.guestapi.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SignupRequest(
        @NotBlank
        @Size(min = 4, max = 50)
        String loginId,
        @NotBlank
        @Size(min = 8, max = 100)
        String password,
        @NotBlank
        @Size(min = 8, max = 100)
        String passwordConfirm,
        @NotBlank
        @Size(max = 50)
        String name,
        @NotBlank
        @Email
        @Size(max = 100)
        String email,
        @NotBlank
        @Size(max = 20)
        String phone,
        @NotEmpty
        List<Long> agreedTermIds
) {
}
