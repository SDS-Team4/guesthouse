package com.guesthouse.shared.auth.api;

public record FindIdVerifyResponse(
        boolean verified,
        String loginId
) {
}
