package com.guesthouse.opsapi.reservation.api;

import com.guesthouse.shared.db.reservation.model.OpsReservationStatusHistoryRecord;
import com.guesthouse.shared.domain.reservation.ReservationActionType;
import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.OffsetDateTime;
import java.time.ZoneId;

public record OpsReservationStatusHistoryResponse(
        Long historyId,
        ReservationStatus fromStatus,
        ReservationStatus toStatus,
        ReservationActionType actionType,
        Long changedByUserId,
        String changedByLoginId,
        String changedByName,
        String reasonType,
        String reasonText,
        OffsetDateTime changedAt
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static OpsReservationStatusHistoryResponse from(OpsReservationStatusHistoryRecord record) {
        return new OpsReservationStatusHistoryResponse(
                record.getHistoryId(),
                record.getFromStatus(),
                record.getToStatus(),
                record.getActionType(),
                record.getChangedByUserId(),
                record.getChangedByLoginId(),
                record.getChangedByName(),
                record.getReasonType(),
                record.getReasonText(),
                record.getChangedAt() == null ? null : record.getChangedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }
}
