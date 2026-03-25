package com.guesthouse.opsapi.roomblock.api;

import java.time.LocalDate;

public record CreateRoomBlockRequest(
        Long roomId,
        LocalDate startDate,
        LocalDate endDate,
        String reasonType,
        String reasonText
) {
}
