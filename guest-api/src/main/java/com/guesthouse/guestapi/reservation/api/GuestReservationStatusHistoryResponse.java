package com.guesthouse.guestapi.reservation.api;

import com.guesthouse.shared.db.reservation.model.GuestReservationStatusHistoryRecord;
import com.guesthouse.shared.domain.reservation.ReservationActionType;
import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.OffsetDateTime;
import java.time.ZoneId;

public record GuestReservationStatusHistoryResponse(
        ReservationStatus fromStatus,
        ReservationStatus toStatus,
        ReservationActionType actionType,
        String reasonType,
        String reasonText,
        OffsetDateTime changedAt
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static GuestReservationStatusHistoryResponse from(GuestReservationStatusHistoryRecord record) {
        return new GuestReservationStatusHistoryResponse(
                record.getFromStatus(),
                record.getToStatus(),
                record.getActionType(),
                record.getReasonType(),
                record.getReasonText(),
                record.getChangedAt() == null ? null : record.getChangedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }
}
