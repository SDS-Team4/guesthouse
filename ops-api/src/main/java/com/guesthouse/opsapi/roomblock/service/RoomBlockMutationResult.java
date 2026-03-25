package com.guesthouse.opsapi.roomblock.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record RoomBlockMutationResult(
        Long blockId,
        Long accommodationId,
        String accommodationName,
        Long roomId,
        String roomCode,
        String status,
        String reasonType,
        String reasonText,
        LocalDate startDate,
        LocalDate endDate,
        OffsetDateTime changedAt
) {
}
