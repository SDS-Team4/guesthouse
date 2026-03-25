package com.guesthouse.opsapi.roomblock.service;

import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockQueryMapper;
import com.guesthouse.shared.db.roomblock.model.OpsAccommodationOptionRecord;
import com.guesthouse.shared.db.roomblock.model.OpsRoomBlockRecord;
import com.guesthouse.shared.db.roomblock.model.OpsRoomOptionRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.user.UserRole;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OpsRoomBlockQueryService {

    private final RoomBlockQueryMapper roomBlockQueryMapper;

    public OpsRoomBlockQueryService(RoomBlockQueryMapper roomBlockQueryMapper) {
        this.roomBlockQueryMapper = roomBlockQueryMapper;
    }

    public OpsRoomBlockManagementView getRoomBlockManagementView(
            SessionUser actor,
            Long requestedAccommodationId,
            Long requestedRoomId
    ) {
        List<OpsAccommodationOptionRecord> accommodations = roomBlockQueryMapper.findAccessibleAccommodations(
                actor.userId(),
                actor.role() == UserRole.ADMIN
        );
        if (accommodations.isEmpty()) {
            return new OpsRoomBlockManagementView(null, null, List.of(), List.of(), List.of());
        }

        Long selectedAccommodationId = requestedAccommodationId == null
                ? accommodations.get(0).getAccommodationId()
                : requestedAccommodationId;
        boolean accommodationAccessible = accommodations.stream()
                .anyMatch(accommodation -> accommodation.getAccommodationId().equals(selectedAccommodationId));
        if (!accommodationAccessible) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        List<OpsRoomOptionRecord> rooms = roomBlockQueryMapper.findActiveRoomsByAccommodationId(selectedAccommodationId);
        if (requestedRoomId != null && rooms.stream().noneMatch(room -> room.getRoomId().equals(requestedRoomId))) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Selected room is not an active room in this accommodation."
            );
        }

        List<OpsRoomBlockRecord> blocks = roomBlockQueryMapper.findRoomBlocks(
                actor.userId(),
                actor.role() == UserRole.ADMIN,
                selectedAccommodationId,
                requestedRoomId
        );
        return new OpsRoomBlockManagementView(
                selectedAccommodationId,
                requestedRoomId,
                accommodations,
                rooms,
                blocks
        );
    }
}
