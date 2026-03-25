package com.guesthouse.opsapi.pricing.api;

import com.guesthouse.opsapi.pricing.service.OpsPricePolicyManagementView;

import java.util.List;

public record OpsPricePolicyManagementResponse(
        Long selectedAccommodationId,
        Long selectedRoomTypeId,
        List<OpsPricingAccommodationOptionResponse> accommodations,
        List<OpsPricingRoomTypeOptionResponse> roomTypes,
        List<OpsPricePolicyResponse> policies
) {

    public static OpsPricePolicyManagementResponse from(OpsPricePolicyManagementView view) {
        return new OpsPricePolicyManagementResponse(
                view.selectedAccommodationId(),
                view.selectedRoomTypeId(),
                view.accommodations().stream().map(OpsPricingAccommodationOptionResponse::from).toList(),
                view.roomTypes().stream().map(OpsPricingRoomTypeOptionResponse::from).toList(),
                view.policies().stream().map(OpsPricePolicyResponse::from).toList()
        );
    }
}
