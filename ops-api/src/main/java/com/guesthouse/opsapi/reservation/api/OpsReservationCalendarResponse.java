package com.guesthouse.opsapi.reservation.api;

import com.guesthouse.opsapi.reservation.service.OpsReservationCalendarView;
import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record OpsReservationCalendarResponse(
        Long selectedAccommodationId,
        LocalDate startDate,
        LocalDate endDateExclusive,
        List<LocalDate> visibleDates,
        List<AccommodationOptionResponse> accommodations,
        List<RoomTypeRowResponse> roomTypes,
        List<ReservationRowResponse> reservations,
        List<AssignmentCellResponse> assignmentCells,
        List<BlockCellResponse> blockCells
) {

    public static OpsReservationCalendarResponse from(OpsReservationCalendarView view) {
        return new OpsReservationCalendarResponse(
                view.selectedAccommodationId(),
                view.startDate(),
                view.endDateExclusive(),
                view.visibleDates(),
                view.accommodations().stream()
                        .map(item -> new AccommodationOptionResponse(
                                item.accommodationId(),
                                item.accommodationName(),
                                item.region()
                        ))
                        .toList(),
                view.roomTypes().stream()
                        .map(item -> new RoomTypeRowResponse(
                                item.roomTypeId(),
                                item.roomTypeName(),
                                item.rooms().stream()
                                        .map(room -> new RoomRowResponse(room.roomId(), room.roomCode()))
                                        .toList()
                        ))
                        .toList(),
                view.reservations().stream()
                        .map(item -> new ReservationRowResponse(
                                item.reservationId(),
                                item.reservationNo(),
                                item.guestLoginId(),
                                item.guestName(),
                                item.guestCount(),
                                item.roomTypeId(),
                                item.roomTypeName(),
                                item.status(),
                                item.checkInDate(),
                                item.checkOutDate(),
                                item.requestedAt(),
                                item.reassignmentPossible()
                        ))
                        .toList(),
                view.assignmentCells().stream()
                        .map(item -> new AssignmentCellResponse(
                                item.reservationId(),
                                item.reservationNightId(),
                                item.stayDate(),
                                item.assignedRoomId(),
                                item.assignedRoomCode(),
                                item.assignedRoomTypeId(),
                                item.assignedRoomTypeName(),
                                item.reassignmentAllowed()
                        ))
                        .toList(),
                view.blockCells().stream()
                        .map(item -> new BlockCellResponse(
                                item.blockId(),
                                item.roomId(),
                                item.stayDate(),
                                item.reasonType(),
                                item.reasonText()
                        ))
                        .toList()
        );
    }

    public record AccommodationOptionResponse(
            Long accommodationId,
            String accommodationName,
            String region
    ) {
    }

    public record RoomTypeRowResponse(
            Long roomTypeId,
            String roomTypeName,
            List<RoomRowResponse> rooms
    ) {
    }

    public record RoomRowResponse(
            Long roomId,
            String roomCode
    ) {
    }

    public record ReservationRowResponse(
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

    public record AssignmentCellResponse(
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

    public record BlockCellResponse(
            Long blockId,
            Long roomId,
            LocalDate stayDate,
            String reasonType,
            String reasonText
    ) {
    }
}
