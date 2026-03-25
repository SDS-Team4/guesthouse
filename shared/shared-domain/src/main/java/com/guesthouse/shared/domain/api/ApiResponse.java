package com.guesthouse.shared.domain.api;

import java.time.OffsetDateTime;
import java.time.ZoneId;

public record ApiResponse<T>(
        boolean success,
        T data,
        ApiError error,
        OffsetDateTime timestamp
) {

    private static final ZoneId DEFAULT_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, OffsetDateTime.now(DEFAULT_ZONE_ID));
    }

    public static ApiResponse<Void> failure(ErrorCode errorCode, String message) {
        return new ApiResponse<>(
                false,
                null,
                new ApiError(errorCode.getCode(), message),
                OffsetDateTime.now(DEFAULT_ZONE_ID)
        );
    }
}
