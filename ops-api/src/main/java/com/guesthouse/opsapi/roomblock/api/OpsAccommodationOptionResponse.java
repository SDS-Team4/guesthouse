package com.guesthouse.opsapi.roomblock.api;

import com.guesthouse.shared.db.roomblock.model.OpsAccommodationOptionRecord;

public record OpsAccommodationOptionResponse(
        Long accommodationId,
        String accommodationName,
        String region
) {

    public static OpsAccommodationOptionResponse from(OpsAccommodationOptionRecord record) {
        return new OpsAccommodationOptionResponse(
                record.getAccommodationId(),
                record.getAccommodationName(),
                record.getRegion()
        );
    }
}
