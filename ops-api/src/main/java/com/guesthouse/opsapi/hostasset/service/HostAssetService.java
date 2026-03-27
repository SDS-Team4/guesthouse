package com.guesthouse.opsapi.hostasset.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.opsapi.hostasset.api.HostAccommodationFormRequest;
import com.guesthouse.opsapi.hostasset.api.HostRoomCreateRequest;
import com.guesthouse.opsapi.hostasset.api.HostRoomTypeFormRequest;
import com.guesthouse.opsapi.hostasset.api.HostRoomUpdateRequest;
import com.guesthouse.opsapi.hostasset.mapper.HostAssetCommandMapper;
import com.guesthouse.opsapi.hostasset.mapper.HostAssetQueryMapper;
import com.guesthouse.opsapi.hostasset.model.HostAccommodationDetailRecord;
import com.guesthouse.opsapi.hostasset.model.HostAccommodationInsertParam;
import com.guesthouse.opsapi.hostasset.model.HostAccommodationSummaryRecord;
import com.guesthouse.opsapi.hostasset.model.HostAccommodationTargetRecord;
import com.guesthouse.opsapi.hostasset.model.HostRoomInsertParam;
import com.guesthouse.opsapi.hostasset.model.HostRoomRecord;
import com.guesthouse.opsapi.hostasset.model.HostRoomTargetRecord;
import com.guesthouse.opsapi.hostasset.model.HostRoomTypeInsertParam;
import com.guesthouse.opsapi.hostasset.model.HostRoomTypeOptionRecord;
import com.guesthouse.opsapi.hostasset.model.HostRoomTypeRecord;
import com.guesthouse.opsapi.hostasset.model.HostRoomTypeTargetRecord;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.audit.mapper.AuditLogMapper;
import com.guesthouse.shared.db.audit.model.AuditLogInsertParam;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class HostAssetService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");
    private static final List<String> ROOM_STATUSES = List.of("ACTIVE", "MAINTENANCE", "INACTIVE");

    private final HostAssetQueryMapper hostAssetQueryMapper;
    private final HostAssetCommandMapper hostAssetCommandMapper;
    private final AuditLogMapper auditLogMapper;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public HostAssetService(
            HostAssetQueryMapper hostAssetQueryMapper,
            HostAssetCommandMapper hostAssetCommandMapper,
            AuditLogMapper auditLogMapper,
            ObjectMapper objectMapper,
            Clock clock
    ) {
        this.hostAssetQueryMapper = hostAssetQueryMapper;
        this.hostAssetCommandMapper = hostAssetCommandMapper;
        this.auditLogMapper = auditLogMapper;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    public List<HostAccommodationSummaryRecord> findAccommodations(SessionUser actor) {
        return hostAssetQueryMapper.findAccommodationSummaries(actor.userId());
    }

    public HostAccommodationDetailBundle getAccommodationDetail(Long accommodationId, SessionUser actor) {
        HostAccommodationDetailRecord detail = hostAssetQueryMapper.findAccommodationDetail(accommodationId, actor.userId());
        if (detail == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Accommodation not found.");
        }
        return new HostAccommodationDetailBundle(
                detail,
                hostAssetQueryMapper.findRoomTypesByAccommodationId(accommodationId, actor.userId()),
                hostAssetQueryMapper.findRoomsByAccommodationId(accommodationId, actor.userId())
        );
    }

    @Transactional
    public HostAssetMutationResult createAccommodation(HostAccommodationFormRequest request, SessionUser actor) {
        LocalDateTime now = LocalDateTime.now(clock);
        HostAccommodationInsertParam insertParam = new HostAccommodationInsertParam();
        insertParam.setHostUserId(actor.userId());
        insertParam.setName(normalizeRequiredText(request.name(), "Accommodation name is required."));
        insertParam.setAddress(normalizeRequiredText(request.address(), "Address is required."));
        insertParam.setRegion(normalizeRequiredText(request.region(), "Region is required."));
        insertParam.setInfoText(normalizeOptionalText(request.infoText()));
        insertParam.setCheckInTime(requireTime(request.checkInTime(), "Check-in time is required."));
        insertParam.setCheckOutTime(requireTime(request.checkOutTime(), "Check-out time is required."));
        insertParam.setStatus("ACTIVE");
        insertParam.setCreatedAt(now);
        insertParam.setUpdatedAt(now);
        hostAssetCommandMapper.insertAccommodation(insertParam);

        writeAudit(
                actor,
                "ACCOMMODATION",
                insertParam.getAccommodationId(),
                "ACCOMMODATION_CREATED",
                "ACTIVE",
                "Accommodation created by host.",
                null,
                buildAccommodationState(insertParam.getName(), insertParam.getAddress(), insertParam.getRegion(),
                        insertParam.getInfoText(), insertParam.getCheckInTime(), insertParam.getCheckOutTime(), "ACTIVE"),
                now
        );

        return new HostAssetMutationResult(
                insertParam.getAccommodationId(),
                insertParam.getName(),
                "ACTIVE",
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    @Transactional
    public HostAssetMutationResult updateAccommodation(Long accommodationId, HostAccommodationFormRequest request, SessionUser actor) {
        HostAccommodationTargetRecord target = requireAccommodationTarget(accommodationId, actor.userId());
        LocalDateTime now = LocalDateTime.now(clock);
        String name = normalizeRequiredText(request.name(), "Accommodation name is required.");
        String address = normalizeRequiredText(request.address(), "Address is required.");
        String region = normalizeRequiredText(request.region(), "Region is required.");
        String infoText = normalizeOptionalText(request.infoText());
        LocalTime checkInTime = requireTime(request.checkInTime(), "Check-in time is required.");
        LocalTime checkOutTime = requireTime(request.checkOutTime(), "Check-out time is required.");

        hostAssetCommandMapper.updateAccommodation(
                accommodationId,
                name,
                address,
                region,
                infoText,
                checkInTime,
                checkOutTime,
                now
        );

        writeAudit(
                actor,
                "ACCOMMODATION",
                accommodationId,
                "ACCOMMODATION_UPDATED",
                target.getStatus(),
                "Accommodation updated by host.",
                buildAccommodationState(target.getName(), target.getAddress(), target.getRegion(), target.getInfoText(),
                        target.getCheckInTime(), target.getCheckOutTime(), target.getStatus()),
                buildAccommodationState(name, address, region, infoText, checkInTime, checkOutTime, target.getStatus()),
                now
        );

        return new HostAssetMutationResult(accommodationId, name, target.getStatus(), now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime());
    }

    @Transactional
    public HostAssetMutationResult deactivateAccommodation(Long accommodationId, SessionUser actor) {
        HostAccommodationTargetRecord target = requireAccommodationTarget(accommodationId, actor.userId());
        if (!"ACTIVE".equals(target.getStatus())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.CONFLICT, "Accommodation is already inactive.");
        }
        if (safeCount(hostAssetQueryMapper.countActiveReservationsByAccommodation(accommodationId, LocalDate.now(clock))) > 0) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Accommodation with active reservations cannot be deactivated."
            );
        }

        LocalDateTime now = LocalDateTime.now(clock);
        hostAssetCommandMapper.markAccommodationInactive(accommodationId, now);
        writeAudit(
                actor,
                "ACCOMMODATION",
                accommodationId,
                "ACCOMMODATION_DEACTIVATED",
                "INACTIVE",
                "Accommodation deactivated by host.",
                buildAccommodationState(target.getName(), target.getAddress(), target.getRegion(), target.getInfoText(),
                        target.getCheckInTime(), target.getCheckOutTime(), target.getStatus()),
                buildAccommodationState(target.getName(), target.getAddress(), target.getRegion(), target.getInfoText(),
                        target.getCheckInTime(), target.getCheckOutTime(), "INACTIVE"),
                now
        );
        return new HostAssetMutationResult(accommodationId, target.getName(), "INACTIVE", now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime());
    }

    @Transactional
    public HostAssetMutationResult createRoomType(Long accommodationId, HostRoomTypeFormRequest request, SessionUser actor) {
        HostAccommodationTargetRecord accommodationTarget = requireAccommodationTarget(accommodationId, actor.userId());
        if (!"ACTIVE".equals(accommodationTarget.getStatus())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.CONFLICT, "Inactive accommodation cannot receive room types.");
        }
        validateCapacity(request.baseCapacity(), request.maxCapacity());
        LocalDateTime now = LocalDateTime.now(clock);
        HostRoomTypeInsertParam insertParam = new HostRoomTypeInsertParam();
        insertParam.setAccommodationId(accommodationId);
        insertParam.setName(normalizeRequiredText(request.name(), "Room type name is required."));
        insertParam.setBaseCapacity(request.baseCapacity());
        insertParam.setMaxCapacity(request.maxCapacity());
        insertParam.setBasePrice(requirePrice(request.basePrice()));
        insertParam.setStatus("ACTIVE");
        insertParam.setCreatedAt(now);
        insertParam.setUpdatedAt(now);
        hostAssetCommandMapper.insertRoomType(insertParam);

        writeAudit(
                actor,
                "ROOM_TYPE",
                insertParam.getRoomTypeId(),
                "ROOM_TYPE_CREATED",
                "ACTIVE",
                "Room type created by host.",
                null,
                buildRoomTypeState(insertParam.getAccommodationId(), insertParam.getName(), insertParam.getBaseCapacity(),
                        insertParam.getMaxCapacity(), insertParam.getBasePrice(), "ACTIVE"),
                now
        );

        return new HostAssetMutationResult(insertParam.getRoomTypeId(), insertParam.getName(), "ACTIVE", now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime());
    }

    @Transactional
    public HostAssetMutationResult updateRoomType(Long roomTypeId, HostRoomTypeFormRequest request, SessionUser actor) {
        HostRoomTypeTargetRecord target = requireRoomTypeTarget(roomTypeId, actor.userId());
        validateCapacity(request.baseCapacity(), request.maxCapacity());
        LocalDateTime now = LocalDateTime.now(clock);
        String name = normalizeRequiredText(request.name(), "Room type name is required.");
        BigDecimal basePrice = requirePrice(request.basePrice());
        hostAssetCommandMapper.updateRoomType(roomTypeId, name, request.baseCapacity(), request.maxCapacity(), basePrice, now);

        writeAudit(
                actor,
                "ROOM_TYPE",
                roomTypeId,
                "ROOM_TYPE_UPDATED",
                target.getStatus(),
                "Room type updated by host.",
                buildRoomTypeState(target.getAccommodationId(), target.getName(), target.getBaseCapacity(), target.getMaxCapacity(), target.getBasePrice(), target.getStatus()),
                buildRoomTypeState(target.getAccommodationId(), name, request.baseCapacity(), request.maxCapacity(), basePrice, target.getStatus()),
                now
        );

        return new HostAssetMutationResult(roomTypeId, name, target.getStatus(), now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime());
    }

    @Transactional
    public HostAssetMutationResult deactivateRoomType(Long roomTypeId, SessionUser actor) {
        HostRoomTypeTargetRecord target = requireRoomTypeTarget(roomTypeId, actor.userId());
        if (!"ACTIVE".equals(target.getStatus())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.CONFLICT, "Room type is already inactive.");
        }
        if (safeCount(hostAssetQueryMapper.countActiveReservationsByRoomType(roomTypeId, LocalDate.now(clock))) > 0) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Room type with active reservations cannot be deactivated."
            );
        }

        LocalDateTime now = LocalDateTime.now(clock);
        hostAssetCommandMapper.markRoomTypeInactive(roomTypeId, now);
        writeAudit(
                actor,
                "ROOM_TYPE",
                roomTypeId,
                "ROOM_TYPE_DEACTIVATED",
                "INACTIVE",
                "Room type deactivated by host.",
                buildRoomTypeState(target.getAccommodationId(), target.getName(), target.getBaseCapacity(), target.getMaxCapacity(), target.getBasePrice(), target.getStatus()),
                buildRoomTypeState(target.getAccommodationId(), target.getName(), target.getBaseCapacity(), target.getMaxCapacity(), target.getBasePrice(), "INACTIVE"),
                now
        );
        return new HostAssetMutationResult(roomTypeId, target.getName(), "INACTIVE", now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime());
    }

    @Transactional
    public HostAssetMutationResult createRoom(Long accommodationId, HostRoomCreateRequest request, SessionUser actor) {
        HostAccommodationTargetRecord accommodationTarget = requireAccommodationTarget(accommodationId, actor.userId());
        if (!"ACTIVE".equals(accommodationTarget.getStatus())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.CONFLICT, "Inactive accommodation cannot receive rooms.");
        }
        HostRoomTypeOptionRecord roomTypeOption = hostAssetQueryMapper.findRoomTypeOption(request.roomTypeId());
        if (roomTypeOption == null || !accommodationId.equals(roomTypeOption.getAccommodationId()) || !actor.userId().equals(roomTypeOption.getHostUserId())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Selected room type does not belong to this accommodation.");
        }
        if (!"ACTIVE".equals(roomTypeOption.getRoomTypeStatus())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.CONFLICT, "Inactive room type cannot receive new rooms.");
        }

        String roomCode = normalizeRequiredText(request.roomCode(), "Room code is required.");
        String roomStatus = normalizeRoomStatus(request.status());
        String memo = normalizeOptionalText(request.memo());
        LocalDateTime now = LocalDateTime.now(clock);
        HostRoomInsertParam insertParam = new HostRoomInsertParam();
        insertParam.setAccommodationId(accommodationId);
        insertParam.setRoomTypeId(request.roomTypeId());
        insertParam.setRoomCode(roomCode);
        insertParam.setStatus(roomStatus);
        insertParam.setMemo(memo);
        insertParam.setCreatedAt(now);
        insertParam.setUpdatedAt(now);
        hostAssetCommandMapper.insertRoom(insertParam);

        writeAudit(
                actor,
                "ROOM",
                insertParam.getRoomId(),
                "ROOM_CREATED",
                roomStatus,
                "Room created by host.",
                null,
                buildRoomState(insertParam.getAccommodationId(), insertParam.getRoomTypeId(), insertParam.getRoomCode(), roomStatus, memo),
                now
        );

        return new HostAssetMutationResult(insertParam.getRoomId(), roomCode, roomStatus, now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime());
    }

    @Transactional
    public HostAssetMutationResult updateRoom(Long roomId, HostRoomUpdateRequest request, SessionUser actor) {
        HostRoomTargetRecord target = requireRoomTarget(roomId, actor.userId());
        String roomCode = normalizeRequiredText(request.roomCode(), "Room code is required.");
        String roomStatus = normalizeRoomStatus(request.status());
        String memo = normalizeOptionalText(request.memo());
        if (!"ACTIVE".equals(roomStatus) && safeCount(hostAssetQueryMapper.countActiveAssignmentsByRoom(roomId, LocalDate.now(clock))) > 0) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Room with future active assignments cannot leave ACTIVE status."
            );
        }

        LocalDateTime now = LocalDateTime.now(clock);
        hostAssetCommandMapper.updateRoom(roomId, roomCode, roomStatus, memo, now);
        writeAudit(
                actor,
                "ROOM",
                roomId,
                "ROOM_UPDATED",
                roomStatus,
                "Room updated by host.",
                buildRoomState(target.getAccommodationId(), target.getRoomTypeId(), target.getRoomCode(), target.getStatus(), target.getMemo()),
                buildRoomState(target.getAccommodationId(), target.getRoomTypeId(), roomCode, roomStatus, memo),
                now
        );

        return new HostAssetMutationResult(roomId, roomCode, roomStatus, now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime());
    }

    @Transactional
    public HostAssetMutationResult deactivateRoom(Long roomId, SessionUser actor) {
        HostRoomTargetRecord target = requireRoomTarget(roomId, actor.userId());
        if ("INACTIVE".equals(target.getStatus())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.CONFLICT, "Room is already inactive.");
        }
        if (safeCount(hostAssetQueryMapper.countActiveAssignmentsByRoom(roomId, LocalDate.now(clock))) > 0) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Room with future active assignments cannot be deactivated."
            );
        }

        LocalDateTime now = LocalDateTime.now(clock);
        hostAssetCommandMapper.markRoomInactive(roomId, now);
        writeAudit(
                actor,
                "ROOM",
                roomId,
                "ROOM_DEACTIVATED",
                "INACTIVE",
                "Room deactivated by host.",
                buildRoomState(target.getAccommodationId(), target.getRoomTypeId(), target.getRoomCode(), target.getStatus(), target.getMemo()),
                buildRoomState(target.getAccommodationId(), target.getRoomTypeId(), target.getRoomCode(), "INACTIVE", target.getMemo()),
                now
        );

        return new HostAssetMutationResult(roomId, target.getRoomCode(), "INACTIVE", now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime());
    }

    private HostAccommodationTargetRecord requireAccommodationTarget(Long accommodationId, Long hostUserId) {
        HostAccommodationTargetRecord target = hostAssetQueryMapper.lockAccommodationTarget(accommodationId);
        if (target == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Accommodation not found.");
        }
        if (!hostUserId.equals(target.getHostUserId())) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }
        return target;
    }

    private HostRoomTypeTargetRecord requireRoomTypeTarget(Long roomTypeId, Long hostUserId) {
        HostRoomTypeTargetRecord target = hostAssetQueryMapper.lockRoomTypeTarget(roomTypeId);
        if (target == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Room type not found.");
        }
        if (!hostUserId.equals(target.getHostUserId())) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }
        return target;
    }

    private HostRoomTargetRecord requireRoomTarget(Long roomId, Long hostUserId) {
        HostRoomTargetRecord target = hostAssetQueryMapper.lockRoomTarget(roomId);
        if (target == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Room not found.");
        }
        if (!hostUserId.equals(target.getHostUserId())) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }
        return target;
    }

    private void validateCapacity(Integer baseCapacity, Integer maxCapacity) {
        if (baseCapacity == null || maxCapacity == null || maxCapacity < baseCapacity) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Max capacity must be equal to or greater than base capacity."
            );
        }
    }

    private BigDecimal requirePrice(BigDecimal basePrice) {
        if (basePrice == null || basePrice.signum() < 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Base price must be zero or greater.");
        }
        return basePrice;
    }

    private LocalTime requireTime(LocalTime value, String message) {
        if (value == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, message);
        }
        return value;
    }

    private String normalizeRequiredText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeRoomStatus(String value) {
        if (value == null || value.isBlank()) {
            return "ACTIVE";
        }
        String normalized = value.trim();
        if (!ROOM_STATUSES.contains(normalized)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Room status is invalid.");
        }
        return normalized;
    }

    private long safeCount(Long value) {
        return value == null ? 0L : value;
    }

    private Map<String, Object> buildAccommodationState(
            String name,
            String address,
            String region,
            String infoText,
            LocalTime checkInTime,
            LocalTime checkOutTime,
            String status
    ) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("name", name);
        state.put("address", address);
        state.put("region", region);
        state.put("infoText", infoText);
        state.put("checkInTime", checkInTime);
        state.put("checkOutTime", checkOutTime);
        state.put("status", status);
        return state;
    }

    private Map<String, Object> buildRoomTypeState(
            Long accommodationId,
            String name,
            Integer baseCapacity,
            Integer maxCapacity,
            BigDecimal basePrice,
            String status
    ) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("accommodationId", accommodationId);
        state.put("name", name);
        state.put("baseCapacity", baseCapacity);
        state.put("maxCapacity", maxCapacity);
        state.put("basePrice", basePrice);
        state.put("status", status);
        return state;
    }

    private Map<String, Object> buildRoomState(
            Long accommodationId,
            Long roomTypeId,
            String roomCode,
            String status,
            String memo
    ) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("accommodationId", accommodationId);
        state.put("roomTypeId", roomTypeId);
        state.put("roomCode", roomCode);
        state.put("status", status);
        state.put("memo", memo);
        return state;
    }

    private void writeAudit(
            SessionUser actor,
            String targetType,
            Long targetId,
            String actionType,
            String reasonType,
            String reasonText,
            Object beforeState,
            Object afterState,
            LocalDateTime occurredAt
    ) {
        AuditLogInsertParam auditLogInsertParam = new AuditLogInsertParam();
        auditLogInsertParam.setActorUserId(actor.userId());
        auditLogInsertParam.setTargetType(targetType);
        auditLogInsertParam.setTargetId(targetId);
        auditLogInsertParam.setActionType(actionType);
        auditLogInsertParam.setReasonType(reasonType);
        auditLogInsertParam.setReasonText(reasonText);
        auditLogInsertParam.setBeforeStateJson(toJson(beforeState));
        auditLogInsertParam.setAfterStateJson(toJson(afterState));
        auditLogInsertParam.setOccurredAt(occurredAt);
        auditLogMapper.insertAuditLog(auditLogInsertParam);
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize host asset audit state.", exception);
        }
    }

    public record HostAccommodationDetailBundle(
            HostAccommodationDetailRecord detail,
            List<HostRoomTypeRecord> roomTypes,
            List<HostRoomRecord> rooms
    ) {
    }
}
