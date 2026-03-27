package com.guesthouse.opsapi.hostasset.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record HostRoomTypeFormRequest(
        @NotBlank
        @Size(max = 100)
        String name,
        @NotNull
        @Min(1)
        Integer baseCapacity,
        @NotNull
        @Min(1)
        Integer maxCapacity,
        @NotNull
        @DecimalMin(value = "0.00")
        BigDecimal basePrice
) {
}
