package com.guesthouse.guestapi.reservation.api;

import com.guesthouse.shared.db.reservation.model.ActiveRoomTypeOptionRecord;

import java.math.BigDecimal;

public record RoomTypeOptionResponse(
        Long accommodationId,
        String accommodationName,
        Long roomTypeId,
        String roomTypeName,
        BigDecimal basePrice
) {

    public static RoomTypeOptionResponse from(ActiveRoomTypeOptionRecord record) {
        return new RoomTypeOptionResponse(
                record.getAccommodationId(),
                record.getAccommodationName(),
                record.getRoomTypeId(),
                record.getRoomTypeName(),
                record.getBasePrice()
        );
    }
}
