package com.guesthouse.opsapi.roomblock.service;

import com.guesthouse.opsapi.roomblock.api.CreateRoomBlockRequest;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockCommandMapper;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockQueryMapper;
import com.guesthouse.shared.db.roomblock.model.OpsRoomBlockMutationTargetRecord;
import com.guesthouse.shared.db.roomblock.model.OpsRoomTargetRecord;
import com.guesthouse.shared.db.roomblock.model.RoomBlockInsertParam;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.user.UserRole;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Service
public class OpsRoomBlockCommandService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");
    private static final Set<String> HOST_REASON_TYPES = Set.of("MAINTENANCE", "HOST_BLOCK", "OTHER");
    private static final Set<String> ADMIN_REASON_TYPES = Set.of("MAINTENANCE", "ADMIN_BLOCK", "OTHER");

    private final RoomBlockQueryMapper roomBlockQueryMapper;
    private final RoomBlockCommandMapper roomBlockCommandMapper;
    private final OpsRoomBlockAuditService opsRoomBlockAuditService;
    private final Clock clock;

    public OpsRoomBlockCommandService(
            RoomBlockQueryMapper roomBlockQueryMapper,
            RoomBlockCommandMapper roomBlockCommandMapper,
            OpsRoomBlockAuditService opsRoomBlockAuditService,
            Clock clock
    ) {
        this.roomBlockQueryMapper = roomBlockQueryMapper;
        this.roomBlockCommandMapper = roomBlockCommandMapper;
        this.opsRoomBlockAuditService = opsRoomBlockAuditService;
        this.clock = clock;
    }

    @Transactional
    public RoomBlockMutationResult createRoomBlock(CreateRoomBlockRequest request, SessionUser actor) {
        if (request == null || request.roomId() == null || request.startDate() == null || request.endDate() == null) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Room, start date, and end date are required."
            );
        }
        if (request.startDate().isAfter(request.endDate())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Start date must be on or before end date."
            );
        }

        String reasonType = normalizeReasonType(request.reasonType(), actor.role());
        String reasonText = normalizeReasonText(request.reasonText());

        OpsRoomTargetRecord roomTarget = roomBlockQueryMapper.lockRoomTarget(request.roomId());
        if (roomTarget == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Room not found.");
        }
        requireMutationAccess(actor, roomTarget.getHostUserId());
        if (!"ACTIVE".equals(roomTarget.getRoomStatus())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Only active rooms can be blocked."
            );
        }

        Long overlappingBlockId = roomBlockQueryMapper.findOverlappingActiveBlockId(
                request.roomId(),
                request.startDate(),
                request.endDate()
        );
        if (overlappingBlockId != null) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "An active room block already overlaps this date range."
            );
        }

        LocalDateTime now = LocalDateTime.now(clock);
        RoomBlockInsertParam roomBlockInsertParam = new RoomBlockInsertParam();
        roomBlockInsertParam.setRoomId(request.roomId());
        roomBlockInsertParam.setStartDate(request.startDate());
        roomBlockInsertParam.setEndDate(request.endDate());
        roomBlockInsertParam.setReasonType(reasonType);
        roomBlockInsertParam.setReasonText(reasonText);
        roomBlockInsertParam.setStatus("ACTIVE");
        roomBlockInsertParam.setCreatedByUserId(actor.userId());
        roomBlockInsertParam.setCreatedAt(now);
        roomBlockInsertParam.setUpdatedAt(now);
        roomBlockCommandMapper.insertRoomBlock(roomBlockInsertParam);

        opsRoomBlockAuditService.writeRoomBlockAudit(
                actor,
                roomBlockInsertParam.getBlockId(),
                "ROOM_BLOCK_CREATED",
                reasonType,
                reasonText == null ? "Room block created by operations." : reasonText,
                null,
                buildAfterState(
                        roomTarget.getAccommodationId(),
                        roomTarget.getAccommodationName(),
                        roomTarget.getRoomId(),
                        roomTarget.getRoomCode(),
                        request.startDate(),
                        request.endDate(),
                        reasonType,
                        reasonText,
                        "ACTIVE"
                ),
                now
        );

        return new RoomBlockMutationResult(
                roomBlockInsertParam.getBlockId(),
                roomTarget.getAccommodationId(),
                roomTarget.getAccommodationName(),
                roomTarget.getRoomId(),
                roomTarget.getRoomCode(),
                "ACTIVE",
                reasonType,
                reasonText,
                request.startDate(),
                request.endDate(),
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    @Transactional
    public RoomBlockMutationResult deactivateRoomBlock(Long blockId, SessionUser actor) {
        OpsRoomBlockMutationTargetRecord target = roomBlockQueryMapper.lockRoomBlockTarget(blockId);
        if (target == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Room block not found.");
        }
        requireMutationAccess(actor, target.getHostUserId());
        if (!"ACTIVE".equals(target.getStatus())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Room block is already inactive."
            );
        }

        LocalDateTime now = LocalDateTime.now(clock);
        int updatedRows = roomBlockCommandMapper.markRoomBlockInactive(blockId, now);
        if (updatedRows != 1) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Room block is already inactive."
            );
        }

        opsRoomBlockAuditService.writeRoomBlockAudit(
                actor,
                target.getBlockId(),
                "ROOM_BLOCK_DEACTIVATED",
                target.getReasonType(),
                target.getReasonText() == null ? "Room block deactivated by operations." : target.getReasonText(),
                buildAfterState(
                        target.getAccommodationId(),
                        target.getAccommodationName(),
                        target.getRoomId(),
                        target.getRoomCode(),
                        target.getStartDate(),
                        target.getEndDate(),
                        target.getReasonType(),
                        target.getReasonText(),
                        target.getStatus()
                ),
                buildAfterState(
                        target.getAccommodationId(),
                        target.getAccommodationName(),
                        target.getRoomId(),
                        target.getRoomCode(),
                        target.getStartDate(),
                        target.getEndDate(),
                        target.getReasonType(),
                        target.getReasonText(),
                        "INACTIVE"
                ),
                now
        );

        return new RoomBlockMutationResult(
                target.getBlockId(),
                target.getAccommodationId(),
                target.getAccommodationName(),
                target.getRoomId(),
                target.getRoomCode(),
                "INACTIVE",
                target.getReasonType(),
                target.getReasonText(),
                target.getStartDate(),
                target.getEndDate(),
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    private String normalizeReasonType(String reasonType, UserRole role) {
        if (reasonType == null || reasonType.isBlank()) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Reason type is required."
            );
        }
        String normalized = reasonType.trim();
        Set<String> allowedReasonTypes = role == UserRole.ADMIN ? ADMIN_REASON_TYPES : HOST_REASON_TYPES;
        if (!allowedReasonTypes.contains(normalized)) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Reason type is not allowed for this actor."
            );
        }
        return normalized;
    }

    private String normalizeReasonText(String reasonText) {
        if (reasonText == null) {
            return null;
        }
        String normalized = reasonText.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private void requireMutationAccess(SessionUser actor, Long hostUserId) {
        if (actor.role() == UserRole.ADMIN) {
            return;
        }
        if (!actor.userId().equals(hostUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }
    }

    private Map<String, Object> buildAfterState(
            Long accommodationId,
            String accommodationName,
            Long roomId,
            String roomCode,
            java.time.LocalDate startDate,
            java.time.LocalDate endDate,
            String reasonType,
            String reasonText,
            String status
    ) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("accommodationId", accommodationId);
        state.put("accommodationName", accommodationName);
        state.put("roomId", roomId);
        state.put("roomCode", roomCode);
        state.put("startDate", startDate);
        state.put("endDate", endDate);
        state.put("reasonType", reasonType);
        state.put("reasonText", reasonText);
        state.put("status", status);
        return state;
    }
}
