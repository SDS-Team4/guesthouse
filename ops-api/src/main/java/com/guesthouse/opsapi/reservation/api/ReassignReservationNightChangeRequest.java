package com.guesthouse.opsapi.reservation.api;

public record ReassignReservationNightChangeRequest(
        Long reservationNightId,
        Long assignedRoomId
) {
}
