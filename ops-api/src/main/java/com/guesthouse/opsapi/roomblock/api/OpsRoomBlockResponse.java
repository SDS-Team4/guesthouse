package com.guesthouse.opsapi.roomblock.api;

import com.guesthouse.shared.db.roomblock.model.OpsRoomBlockRecord;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

public record OpsRoomBlockResponse(
        Long blockId,
        Long accommodationId,
        String accommodationName,
        Long roomId,
        String roomCode,
        Long roomTypeId,
        String roomTypeName,
        LocalDate startDate,
        LocalDate endDate,
        String reasonType,
        String reasonText,
        String status,
        Long createdByUserId,
        String createdByLoginId,
        String createdByName,
        OffsetDateTime createdAt
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static OpsRoomBlockResponse from(OpsRoomBlockRecord record) {
        return new OpsRoomBlockResponse(
                record.getBlockId(),
                record.getAccommodationId(),
                record.getAccommodationName(),
                record.getRoomId(),
                record.getRoomCode(),
                record.getRoomTypeId(),
                record.getRoomTypeName(),
                record.getStartDate(),
                record.getEndDate(),
                record.getReasonType(),
                record.getReasonText(),
                record.getStatus(),
                record.getCreatedByUserId(),
                record.getCreatedByLoginId(),
                record.getCreatedByName(),
                record.getCreatedAt() == null ? null : record.getCreatedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }
}
