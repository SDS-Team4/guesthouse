package com.guesthouse.opsapi.roomblock.api;

import com.guesthouse.opsapi.roomblock.service.OpsRoomBlockManagementView;

import java.util.List;

public record OpsRoomBlockManagementResponse(
        Long selectedAccommodationId,
        Long selectedRoomId,
        List<OpsAccommodationOptionResponse> accommodations,
        List<OpsRoomOptionResponse> rooms,
        List<OpsRoomBlockResponse> blocks
) {

    public static OpsRoomBlockManagementResponse from(OpsRoomBlockManagementView view) {
        return new OpsRoomBlockManagementResponse(
                view.selectedAccommodationId(),
                view.selectedRoomId(),
                view.accommodations().stream().map(OpsAccommodationOptionResponse::from).toList(),
                view.rooms().stream().map(OpsRoomOptionResponse::from).toList(),
                view.blocks().stream().map(OpsRoomBlockResponse::from).toList()
        );
    }
}
