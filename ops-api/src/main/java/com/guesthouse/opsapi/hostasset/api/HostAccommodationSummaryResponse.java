package com.guesthouse.opsapi.hostasset.api;

import com.guesthouse.opsapi.hostasset.model.HostAccommodationSummaryRecord;

public record HostAccommodationSummaryResponse(
        Long accommodationId,
        String name,
        String region,
        String address,
        String status,
        Integer roomTypeCount,
        Integer roomCount,
        Integer activeRoomCount,
        Integer pendingReservationCount
) {
    public static HostAccommodationSummaryResponse from(HostAccommodationSummaryRecord record) {
        return new HostAccommodationSummaryResponse(
                record.getAccommodationId(),
                record.getName(),
                record.getRegion(),
                record.getAddress(),
                record.getStatus(),
                record.getRoomTypeCount(),
                record.getRoomCount(),
                record.getActiveRoomCount(),
                record.getPendingReservationCount()
        );
    }
}
