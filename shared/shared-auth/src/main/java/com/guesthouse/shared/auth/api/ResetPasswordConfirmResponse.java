package com.guesthouse.shared.auth.api;

import java.time.OffsetDateTime;

public record ResetPasswordConfirmResponse(
        boolean passwordChanged,
        OffsetDateTime changedAt
) {
}
