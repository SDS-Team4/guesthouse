package com.guesthouse.opsapi.reservation.service;

import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record OpsReservationCalendarView(
        Long selectedAccommodationId,
        LocalDate startDate,
        LocalDate endDateExclusive,
        List<LocalDate> visibleDates,
        List<AccommodationOption> accommodations,
        List<RoomTypeRow> roomTypes,
        List<ReservationRow> reservations,
        List<AssignmentCell> assignmentCells,
        List<BlockCell> blockCells
) {

    public record AccommodationOption(
            Long accommodationId,
            String accommodationName,
            String region
    ) {
    }

    public record RoomTypeRow(
            Long roomTypeId,
            String roomTypeName,
            List<RoomRow> rooms
    ) {
    }

    public record RoomRow(
            Long roomId,
            String roomCode
    ) {
    }

    public record ReservationRow(
            Long reservationId,
            String reservationNo,
            String guestLoginId,
            String guestName,
            Integer guestCount,
            Long roomTypeId,
            String roomTypeName,
            ReservationStatus status,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            OffsetDateTime requestedAt,
            boolean reassignmentPossible
    ) {
    }

    public record AssignmentCell(
            Long reservationId,
            Long reservationNightId,
            LocalDate stayDate,
            Long assignedRoomId,
            String assignedRoomCode,
            Long assignedRoomTypeId,
            String assignedRoomTypeName,
            boolean reassignmentAllowed
    ) {
    }

    public record BlockCell(
            Long blockId,
            Long roomId,
            LocalDate stayDate,
            String reasonType,
            String reasonText
    ) {
    }
}
