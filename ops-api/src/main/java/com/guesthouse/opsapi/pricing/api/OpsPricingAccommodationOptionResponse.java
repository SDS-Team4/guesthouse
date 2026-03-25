package com.guesthouse.opsapi.pricing.api;

import com.guesthouse.shared.db.pricing.model.OpsPricingAccommodationOptionRecord;

public record OpsPricingAccommodationOptionResponse(
        Long accommodationId,
        String accommodationName,
        String region
) {

    public static OpsPricingAccommodationOptionResponse from(OpsPricingAccommodationOptionRecord record) {
        return new OpsPricingAccommodationOptionResponse(
                record.getAccommodationId(),
                record.getAccommodationName(),
                record.getRegion()
        );
    }
}
