package com.guesthouse.opsapi.hostasset.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

public record HostAccommodationFormRequest(
        @NotBlank
        @Size(max = 100)
        String name,
        @NotBlank
        @Size(max = 255)
        String address,
        @NotBlank
        @Size(max = 50)
        String region,
        @Size(max = 5000)
        String infoText,
        @NotNull
        LocalTime checkInTime,
        @NotNull
        LocalTime checkOutTime
) {
}
