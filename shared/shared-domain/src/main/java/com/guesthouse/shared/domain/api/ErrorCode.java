package com.guesthouse.shared.domain.api;

public enum ErrorCode {
    INVALID_REQUEST("INVALID_REQUEST", "Invalid request."),
    NOT_FOUND("NOT_FOUND", "Resource not found."),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", "Invalid credentials."),
    ACCOUNT_LOCKED("ACCOUNT_LOCKED", "Account is temporarily locked."),
    TOO_MANY_REQUESTS("TOO_MANY_REQUESTS", "Too many requests."),
    DUPLICATE_LOGIN_ID("DUPLICATE_LOGIN_ID", "Login ID is already in use."),
    DUPLICATE_EMAIL("DUPLICATE_EMAIL", "Email is already in use."),
    DUPLICATE_PHONE("DUPLICATE_PHONE", "Phone number is already in use."),
    HOST_ROLE_REQUEST_NOT_ALLOWED("HOST_ROLE_REQUEST_NOT_ALLOWED", "Host role request is not allowed."),
    HOST_ROLE_REQUEST_ALREADY_PENDING("HOST_ROLE_REQUEST_ALREADY_PENDING", "A host role request is already pending."),
    HOST_ROLE_REQUEST_ALREADY_REVIEWED("HOST_ROLE_REQUEST_ALREADY_REVIEWED", "Host role request has already been reviewed."),
    INVENTORY_UNAVAILABLE("INVENTORY_UNAVAILABLE", "No inventory is available for the selected stay dates."),
    UNAUTHORIZED("UNAUTHORIZED", "Authentication is required."),
    FORBIDDEN("FORBIDDEN", "Access is forbidden."),
    INTERNAL_ERROR("INTERNAL_ERROR", "Unexpected server error.");

    private final String code;
    private final String defaultMessage;

    ErrorCode(String code, String defaultMessage) {
        this.code = code;
        this.defaultMessage = defaultMessage;
    }

    public String getCode() {
        return code;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
