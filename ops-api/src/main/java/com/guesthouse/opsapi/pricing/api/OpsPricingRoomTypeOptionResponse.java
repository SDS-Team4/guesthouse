package com.guesthouse.opsapi.pricing.api;

import com.guesthouse.shared.db.pricing.model.OpsPricingRoomTypeOptionRecord;

import java.math.BigDecimal;

public record OpsPricingRoomTypeOptionResponse(
        Long roomTypeId,
        Long accommodationId,
        String roomTypeName,
        BigDecimal basePrice
) {

    public static OpsPricingRoomTypeOptionResponse from(OpsPricingRoomTypeOptionRecord record) {
        return new OpsPricingRoomTypeOptionResponse(
                record.getRoomTypeId(),
                record.getAccommodationId(),
                record.getRoomTypeName(),
                record.getBasePrice()
        );
    }
}
