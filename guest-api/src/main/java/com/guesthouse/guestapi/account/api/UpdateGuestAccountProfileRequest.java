package com.guesthouse.guestapi.account.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateGuestAccountProfileRequest(
        @NotBlank
        @Size(max = 50)
        String name,
        @Email
        @Size(max = 100)
        String email,
        @Size(max = 20)
        String phone
) {
}
