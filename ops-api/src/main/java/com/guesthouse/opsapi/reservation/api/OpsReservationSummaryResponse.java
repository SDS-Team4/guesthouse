package com.guesthouse.opsapi.reservation.api;

import com.guesthouse.shared.db.reservation.model.OpsReservationListRecord;
import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

public record OpsReservationSummaryResponse(
        Long reservationId,
        String reservationNo,
        Long guestUserId,
        String guestLoginId,
        String guestName,
        Long accommodationId,
        String accommodationName,
        Long roomTypeId,
        String roomTypeName,
        Integer guestCount,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        ReservationStatus status,
        OffsetDateTime requestedAt,
        OffsetDateTime confirmedAt,
        OffsetDateTime cancelledAt,
        boolean reassignmentPossible,
        boolean hasRelevantBlocks,
        boolean hasRelevantPricing
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static OpsReservationSummaryResponse from(OpsReservationListRecord record) {
        return new OpsReservationSummaryResponse(
                record.getReservationId(),
                record.getReservationNo(),
                record.getGuestUserId(),
                record.getGuestLoginId(),
                record.getGuestName(),
                record.getAccommodationId(),
                record.getAccommodationName(),
                record.getRoomTypeId(),
                record.getRoomTypeName(),
                record.getGuestCount(),
                record.getCheckInDate(),
                record.getCheckOutDate(),
                record.getStatus(),
                record.getRequestedAt() == null ? null : record.getRequestedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getConfirmedAt() == null ? null : record.getConfirmedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getCancelledAt() == null ? null : record.getCancelledAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.isReassignmentPossible(),
                record.isHasRelevantBlocks(),
                record.isHasRelevantPricing()
        );
    }
}
