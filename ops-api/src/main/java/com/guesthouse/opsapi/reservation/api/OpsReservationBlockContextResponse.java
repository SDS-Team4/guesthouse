package com.guesthouse.opsapi.reservation.api;

import com.guesthouse.shared.db.reservation.model.OpsReservationBlockContextRecord;

import java.time.LocalDate;

public record OpsReservationBlockContextResponse(
        Long blockId,
        Long roomId,
        String roomCode,
        Long roomTypeId,
        String roomTypeName,
        LocalDate startDate,
        LocalDate endDate,
        String reasonType,
        String reasonText
) {

    public static OpsReservationBlockContextResponse from(OpsReservationBlockContextRecord record) {
        return new OpsReservationBlockContextResponse(
                record.getBlockId(),
                record.getRoomId(),
                record.getRoomCode(),
                record.getRoomTypeId(),
                record.getRoomTypeName(),
                record.getStartDate(),
                record.getEndDate(),
                record.getReasonType(),
                record.getReasonText()
        );
    }
}
