package com.guesthouse.guestapi.reservation.api;

import com.guesthouse.guestapi.reservation.service.GuestReservationDetailView;
import com.guesthouse.shared.db.reservation.model.GuestReservationDetailRecord;
import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

public record GuestReservationDetailResponse(
        Long reservationId,
        String reservationNo,
        GuestReservationAccommodationSummaryResponse accommodation,
        GuestReservationRoomTypeSummaryResponse roomType,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        ReservationStatus status,
        OffsetDateTime requestedAt,
        OffsetDateTime confirmedAt,
        OffsetDateTime cancelledAt,
        OffsetDateTime cancellationCutoffAt,
        boolean cancellationAllowed,
        String cancellationBlockedReason,
        List<GuestReservationNightResponse> nights,
        List<GuestReservationStatusHistoryResponse> statusHistory
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static GuestReservationDetailResponse from(GuestReservationDetailView detailView) {
        GuestReservationDetailRecord reservation = detailView.reservation();
        return new GuestReservationDetailResponse(
                reservation.getReservationId(),
                reservation.getReservationNo(),
                new GuestReservationAccommodationSummaryResponse(
                        reservation.getAccommodationId(),
                        reservation.getAccommodationName(),
                        reservation.getAccommodationRegion(),
                        reservation.getAccommodationAddress()
                ),
                new GuestReservationRoomTypeSummaryResponse(
                        reservation.getRoomTypeId(),
                        reservation.getRoomTypeName()
                ),
                reservation.getCheckInDate(),
                reservation.getCheckOutDate(),
                reservation.getStatus(),
                reservation.getRequestedAt() == null ? null : reservation.getRequestedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                reservation.getConfirmedAt() == null ? null : reservation.getConfirmedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                reservation.getCancelledAt() == null ? null : reservation.getCancelledAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                detailView.cancellationCutoffAt(),
                detailView.cancellationAllowed(),
                detailView.cancellationBlockedReason(),
                detailView.nights().stream()
                        .map(GuestReservationNightResponse::from)
                        .toList(),
                detailView.statusHistory().stream()
                        .map(GuestReservationStatusHistoryResponse::from)
                        .toList()
        );
    }
}
