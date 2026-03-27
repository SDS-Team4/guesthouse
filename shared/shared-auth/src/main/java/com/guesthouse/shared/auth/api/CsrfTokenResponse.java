package com.guesthouse.shared.auth.api;

public record CsrfTokenResponse(
        String headerName,
        String token
) {
}
