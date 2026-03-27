package com.guesthouse.opsapi.hostasset.api;

import com.guesthouse.opsapi.hostasset.model.HostAccommodationDetailRecord;
import com.guesthouse.opsapi.hostasset.model.HostRoomRecord;
import com.guesthouse.opsapi.hostasset.model.HostRoomTypeRecord;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

public record HostAccommodationDetailResponse(
        Long accommodationId,
        String name,
        String region,
        String address,
        String infoText,
        LocalTime checkInTime,
        LocalTime checkOutTime,
        String status,
        Integer roomTypeCount,
        Integer roomCount,
        Integer activeRoomCount,
        Integer pendingReservationCount,
        Integer activeBlockCount,
        Integer activePricePolicyCount,
        List<RoomTypeResponse> roomTypes,
        List<RoomResponse> rooms
) {
    public static HostAccommodationDetailResponse from(
            HostAccommodationDetailRecord detail,
            List<HostRoomTypeRecord> roomTypes,
            List<HostRoomRecord> rooms
    ) {
        return new HostAccommodationDetailResponse(
                detail.getAccommodationId(),
                detail.getName(),
                detail.getRegion(),
                detail.getAddress(),
                detail.getInfoText(),
                detail.getCheckInTime(),
                detail.getCheckOutTime(),
                detail.getStatus(),
                detail.getRoomTypeCount(),
                detail.getRoomCount(),
                detail.getActiveRoomCount(),
                detail.getPendingReservationCount(),
                detail.getActiveBlockCount(),
                detail.getActivePricePolicyCount(),
                roomTypes.stream().map(RoomTypeResponse::from).toList(),
                rooms.stream().map(RoomResponse::from).toList()
        );
    }

    public record RoomTypeResponse(
            Long roomTypeId,
            Long accommodationId,
            String name,
            Integer baseCapacity,
            Integer maxCapacity,
            BigDecimal basePrice,
            String status,
            Integer roomCount,
            Integer activeRoomCount
    ) {
        public static RoomTypeResponse from(HostRoomTypeRecord record) {
            return new RoomTypeResponse(
                    record.getRoomTypeId(),
                    record.getAccommodationId(),
                    record.getName(),
                    record.getBaseCapacity(),
                    record.getMaxCapacity(),
                    record.getBasePrice(),
                    record.getStatus(),
                    record.getRoomCount(),
                    record.getActiveRoomCount()
            );
        }
    }

    public record RoomResponse(
            Long roomId,
            Long accommodationId,
            Long roomTypeId,
            String roomTypeName,
            String roomCode,
            String status,
            String memo,
            boolean hasFutureAssignments
    ) {
        public static RoomResponse from(HostRoomRecord record) {
            return new RoomResponse(
                    record.getRoomId(),
                    record.getAccommodationId(),
                    record.getRoomTypeId(),
                    record.getRoomTypeName(),
                    record.getRoomCode(),
                    record.getStatus(),
                    record.getMemo(),
                    record.isHasFutureAssignments()
            );
        }
    }
}
