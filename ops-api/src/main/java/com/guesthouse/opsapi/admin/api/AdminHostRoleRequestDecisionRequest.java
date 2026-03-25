package com.guesthouse.opsapi.admin.api;

import jakarta.validation.constraints.Size;

public record AdminHostRoleRequestDecisionRequest(
        @Size(max = 500)
        String reviewReason
) {
}
