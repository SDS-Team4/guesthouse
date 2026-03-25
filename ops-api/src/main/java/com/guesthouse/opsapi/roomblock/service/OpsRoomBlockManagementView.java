package com.guesthouse.opsapi.roomblock.service;

import com.guesthouse.shared.db.roomblock.model.OpsAccommodationOptionRecord;
import com.guesthouse.shared.db.roomblock.model.OpsRoomBlockRecord;
import com.guesthouse.shared.db.roomblock.model.OpsRoomOptionRecord;

import java.util.List;

public record OpsRoomBlockManagementView(
        Long selectedAccommodationId,
        Long selectedRoomId,
        List<OpsAccommodationOptionRecord> accommodations,
        List<OpsRoomOptionRecord> rooms,
        List<OpsRoomBlockRecord> blocks
) {
}
