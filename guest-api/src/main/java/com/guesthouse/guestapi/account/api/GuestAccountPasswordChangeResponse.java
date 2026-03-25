package com.guesthouse.guestapi.account.api;

import java.time.OffsetDateTime;

public record GuestAccountPasswordChangeResponse(
        boolean changed,
        OffsetDateTime changedAt
) {
}
