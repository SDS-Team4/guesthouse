package com.guesthouse.guestapi.accommodation.api;

import java.math.BigDecimal;

public record RoomTypeAvailabilityResponse(
        Long roomTypeId,
        String roomTypeName,
        int baseCapacity,
        int maxCapacity,
        BigDecimal basePrice,
        BigDecimal previewPrice,
        int totalActiveRooms,
        int availableRoomCount,
        boolean matchesGuestCount,
        AccommodationAvailabilityCategory availabilityCategory
) {
}
