package com.guesthouse.opsapi.reservation.api;

import java.util.List;

public record ReassignReservationRequest(
        List<ReassignReservationNightChangeRequest> changes
) {
}
