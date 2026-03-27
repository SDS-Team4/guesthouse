package com.guesthouse.opsapi.hostasset.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record HostRoomUpdateRequest(
        @NotBlank
        @Size(max = 20)
        String roomCode,
        @Size(max = 20)
        String status,
        @Size(max = 5000)
        String memo
) {
}
