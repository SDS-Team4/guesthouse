package com.guesthouse.guestapi.reservation.api;

import com.guesthouse.shared.db.reservation.model.GuestReservationSummaryRecord;
import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

public record GuestReservationSummaryResponse(
        Long reservationId,
        String reservationNo,
        Long accommodationId,
        String accommodationName,
        Long roomTypeId,
        String roomTypeName,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        ReservationStatus status,
        OffsetDateTime requestedAt,
        OffsetDateTime confirmedAt,
        OffsetDateTime cancelledAt
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static GuestReservationSummaryResponse from(GuestReservationSummaryRecord record) {
        return new GuestReservationSummaryResponse(
                record.getReservationId(),
                record.getReservationNo(),
                record.getAccommodationId(),
                record.getAccommodationName(),
                record.getRoomTypeId(),
                record.getRoomTypeName(),
                record.getCheckInDate(),
                record.getCheckOutDate(),
                record.getStatus(),
                record.getRequestedAt() == null ? null : record.getRequestedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getConfirmedAt() == null ? null : record.getConfirmedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getCancelledAt() == null ? null : record.getCancelledAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }
}
