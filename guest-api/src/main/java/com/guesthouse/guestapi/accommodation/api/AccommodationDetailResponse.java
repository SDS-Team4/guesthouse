package com.guesthouse.guestapi.accommodation.api;

import java.time.LocalTime;
import java.util.List;

public record AccommodationDetailResponse(
        Long accommodationId,
        String accommodationName,
        String region,
        String address,
        String infoText,
        LocalTime checkInTime,
        LocalTime checkOutTime,
        AccommodationAvailabilityCategory availabilityCategory,
        List<RoomTypeAvailabilityResponse> roomTypes
) {
}
