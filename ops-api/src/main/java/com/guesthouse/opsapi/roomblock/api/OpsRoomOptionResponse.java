package com.guesthouse.opsapi.roomblock.api;

import com.guesthouse.shared.db.roomblock.model.OpsRoomOptionRecord;

public record OpsRoomOptionResponse(
        Long roomId,
        Long accommodationId,
        Long roomTypeId,
        String roomTypeName,
        String roomCode
) {

    public static OpsRoomOptionResponse from(OpsRoomOptionRecord record) {
        return new OpsRoomOptionResponse(
                record.getRoomId(),
                record.getAccommodationId(),
                record.getRoomTypeId(),
                record.getRoomTypeName(),
                record.getRoomCode()
        );
    }
}
