package com.guesthouse.guestapi.reservation.service;

import com.guesthouse.shared.db.reservation.model.GuestReservationDetailRecord;
import com.guesthouse.shared.db.reservation.model.GuestReservationNightRecord;
import com.guesthouse.shared.db.reservation.model.GuestReservationStatusHistoryRecord;

import java.time.OffsetDateTime;
import java.util.List;

public record GuestReservationDetailView(
        GuestReservationDetailRecord reservation,
        List<GuestReservationNightRecord> nights,
        List<GuestReservationStatusHistoryRecord> statusHistory,
        OffsetDateTime cancellationCutoffAt,
        boolean cancellationAllowed,
        String cancellationBlockedReason
) {
}
