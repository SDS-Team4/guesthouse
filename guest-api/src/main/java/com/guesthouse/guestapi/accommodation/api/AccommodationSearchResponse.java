package com.guesthouse.guestapi.accommodation.api;

import java.math.BigDecimal;

public record AccommodationSearchResponse(
        Long accommodationId,
        String accommodationName,
        String region,
        AccommodationAvailabilityCategory availabilityCategory,
        int matchingRoomTypeCount,
        int availableRoomTypeCount,
        BigDecimal lowestBasePrice,
        BigDecimal lowestPreviewPrice
) {
}
