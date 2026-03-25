package com.guesthouse.guestapi.accommodation.api;

import java.time.LocalDate;

public record RoomTypeCalendarDayResponse(
        LocalDate stayDate,
        int availableRoomCount,
        boolean soldOut
) {
}
