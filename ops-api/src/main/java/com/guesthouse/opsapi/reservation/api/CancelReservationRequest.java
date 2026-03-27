package com.guesthouse.opsapi.reservation.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelReservationRequest(
        @NotBlank
        @Size(max = 500)
        String reasonText
) {
}
