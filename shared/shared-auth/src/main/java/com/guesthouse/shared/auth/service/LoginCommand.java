package com.guesthouse.shared.auth.service;

public record LoginCommand(
        String loginId,
        String password
) {
}
