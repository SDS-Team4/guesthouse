package com.guesthouse.opsapi.roomblock.api;

import com.guesthouse.opsapi.roomblock.service.RoomBlockMutationResult;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record RoomBlockMutationResponse(
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

    public static RoomBlockMutationResponse from(RoomBlockMutationResult result) {
        return new RoomBlockMutationResponse(
                result.blockId(),
                result.accommodationId(),
                result.accommodationName(),
                result.roomId(),
                result.roomCode(),
                result.status(),
                result.reasonType(),
                result.reasonText(),
                result.startDate(),
                result.endDate(),
                result.changedAt()
        );
    }
}
