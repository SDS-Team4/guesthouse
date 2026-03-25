package com.guesthouse.opsapi.reservation.api;

import com.guesthouse.opsapi.reservation.service.OpsReservationDetailView;
import com.guesthouse.shared.db.reservation.model.OpsReservationDetailRecord;
import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

public record OpsReservationDetailResponse(
        Long reservationId,
        String reservationNo,
        OpsReservationGuestSummaryResponse guest,
        OpsReservationAccommodationSummaryResponse accommodation,
        OpsReservationRoomTypeSummaryResponse roomType,
        Integer guestCount,
        ReservationStatus status,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        LocalTime checkInTime,
        LocalTime checkOutTime,
        OffsetDateTime requestedAt,
        OffsetDateTime confirmedAt,
        OffsetDateTime cancelledAt,
        boolean reassignmentPossible,
        boolean hasRelevantBlocks,
        boolean hasRelevantPricing,
        List<OpsReservationNightResponse> nights,
        List<OpsReservationStatusHistoryResponse> statusHistory,
        List<OpsReservationBlockContextResponse> blockContexts,
        List<OpsReservationPricePolicyResponse> pricingPolicies
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static OpsReservationDetailResponse from(OpsReservationDetailView view) {
        OpsReservationDetailRecord reservation = view.reservation();
        return new OpsReservationDetailResponse(
                reservation.getReservationId(),
                reservation.getReservationNo(),
                new OpsReservationGuestSummaryResponse(
                        reservation.getGuestUserId(),
                        reservation.getGuestLoginId(),
                        reservation.getGuestName()
                ),
                new OpsReservationAccommodationSummaryResponse(
                        reservation.getAccommodationId(),
                        reservation.getAccommodationName(),
                        reservation.getAccommodationRegion(),
                        reservation.getAccommodationAddress()
                ),
                new OpsReservationRoomTypeSummaryResponse(
                        reservation.getRoomTypeId(),
                        reservation.getRoomTypeName()
                ),
                reservation.getGuestCount(),
                reservation.getStatus(),
                reservation.getCheckInDate(),
                reservation.getCheckOutDate(),
                reservation.getAccommodationCheckInTime(),
                reservation.getAccommodationCheckOutTime(),
                reservation.getRequestedAt() == null ? null : reservation.getRequestedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                reservation.getConfirmedAt() == null ? null : reservation.getConfirmedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                reservation.getCancelledAt() == null ? null : reservation.getCancelledAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                view.reassignmentPossible(),
                !view.blockContexts().isEmpty(),
                !view.pricingPolicies().isEmpty(),
                view.nights().stream().map(OpsReservationNightResponse::from).toList(),
                view.statusHistory().stream().map(OpsReservationStatusHistoryResponse::from).toList(),
                view.blockContexts().stream().map(OpsReservationBlockContextResponse::from).toList(),
                view.pricingPolicies().stream().map(OpsReservationPricePolicyResponse::from).toList()
        );
    }
}
