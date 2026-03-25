package com.guesthouse.opsapi.pricing.service;

import com.guesthouse.shared.db.pricing.model.OpsPricePolicyRecord;
import com.guesthouse.shared.db.pricing.model.OpsPricingAccommodationOptionRecord;
import com.guesthouse.shared.db.pricing.model.OpsPricingRoomTypeOptionRecord;

import java.util.List;

public record OpsPricePolicyManagementView(
        Long selectedAccommodationId,
        Long selectedRoomTypeId,
        List<OpsPricingAccommodationOptionRecord> accommodations,
        List<OpsPricingRoomTypeOptionRecord> roomTypes,
        List<OpsPricePolicyRecord> policies
) {
}
