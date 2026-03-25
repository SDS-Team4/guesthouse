package com.guesthouse.guestapi.accommodation.api;

import java.time.LocalDate;
import java.util.List;

public record RoomTypeCalendarResponse(
        Long accommodationId,
        Long roomTypeId,
        String roomTypeName,
        LocalDate startDate,
        LocalDate endDate,
        List<RoomTypeCalendarDayResponse> days
) {
}
