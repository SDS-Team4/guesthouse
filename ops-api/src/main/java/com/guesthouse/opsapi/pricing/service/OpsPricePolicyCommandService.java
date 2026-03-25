package com.guesthouse.opsapi.pricing.service;

import com.guesthouse.opsapi.pricing.api.CreatePricePolicyRequest;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyCommandMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyQueryMapper;
import com.guesthouse.shared.db.pricing.model.OpsPricePolicyMutationTargetRecord;
import com.guesthouse.shared.db.pricing.model.OpsPricingRoomTypeTargetRecord;
import com.guesthouse.shared.db.pricing.model.PricePolicyInsertParam;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.user.UserRole;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class OpsPricePolicyCommandService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    private final PricePolicyQueryMapper pricePolicyQueryMapper;
    private final PricePolicyCommandMapper pricePolicyCommandMapper;
    private final OpsPricePolicyAuditService opsPricePolicyAuditService;
    private final Clock clock;

    public OpsPricePolicyCommandService(
            PricePolicyQueryMapper pricePolicyQueryMapper,
            PricePolicyCommandMapper pricePolicyCommandMapper,
            OpsPricePolicyAuditService opsPricePolicyAuditService,
            Clock clock
    ) {
        this.pricePolicyQueryMapper = pricePolicyQueryMapper;
        this.pricePolicyCommandMapper = pricePolicyCommandMapper;
        this.opsPricePolicyAuditService = opsPricePolicyAuditService;
        this.clock = clock;
    }

    @Transactional
    public PricePolicyMutationResult createPricePolicy(CreatePricePolicyRequest request, SessionUser actor) {
        if (request == null
                || request.roomTypeId() == null
                || request.startDate() == null
                || request.endDate() == null
                || request.deltaAmount() == null) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Room type, date range, and delta amount are required."
            );
        }
        if (request.startDate().isAfter(request.endDate())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Start date must be on or before end date."
            );
        }

        String policyName = normalizePolicyName(request.policyName());
        Integer dayOfWeekMask = normalizeDayOfWeekMask(request.dayOfWeekMask());

        OpsPricingRoomTypeTargetRecord roomTypeTarget = pricePolicyQueryMapper.lockRoomTypeTarget(request.roomTypeId());
        if (roomTypeTarget == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Room type not found.");
        }
        requireMutationAccess(actor, roomTypeTarget.getHostUserId());
        if (!"ACTIVE".equals(roomTypeTarget.getRoomTypeStatus())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Only active room types can receive pricing policies."
            );
        }

        LocalDateTime now = LocalDateTime.now(clock);
        PricePolicyInsertParam pricePolicyInsertParam = new PricePolicyInsertParam();
        pricePolicyInsertParam.setAccommodationId(roomTypeTarget.getAccommodationId());
        pricePolicyInsertParam.setRoomTypeId(roomTypeTarget.getRoomTypeId());
        pricePolicyInsertParam.setPolicyName(policyName);
        pricePolicyInsertParam.setStartDate(request.startDate());
        pricePolicyInsertParam.setEndDate(request.endDate());
        pricePolicyInsertParam.setDeltaAmount(request.deltaAmount());
        pricePolicyInsertParam.setDayOfWeekMask(dayOfWeekMask);
        pricePolicyInsertParam.setStatus("ACTIVE");
        pricePolicyInsertParam.setCreatedAt(now);
        pricePolicyInsertParam.setUpdatedAt(now);
        pricePolicyCommandMapper.insertPricePolicy(pricePolicyInsertParam);

        opsPricePolicyAuditService.writePricePolicyAudit(
                actor,
                pricePolicyInsertParam.getPolicyId(),
                "PRICE_POLICY_CREATED",
                "Additive delta price policy created by operations.",
                null,
                buildState(
                        roomTypeTarget.getAccommodationId(),
                        roomTypeTarget.getAccommodationName(),
                        roomTypeTarget.getRoomTypeId(),
                        roomTypeTarget.getRoomTypeName(),
                        policyName,
                        request.startDate(),
                        request.endDate(),
                        request.deltaAmount(),
                        dayOfWeekMask,
                        "ACTIVE"
                ),
                now
        );

        return new PricePolicyMutationResult(
                pricePolicyInsertParam.getPolicyId(),
                roomTypeTarget.getAccommodationId(),
                roomTypeTarget.getAccommodationName(),
                roomTypeTarget.getRoomTypeId(),
                roomTypeTarget.getRoomTypeName(),
                policyName,
                request.startDate(),
                request.endDate(),
                request.deltaAmount(),
                dayOfWeekMask,
                "ACTIVE",
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    @Transactional
    public PricePolicyMutationResult deactivatePricePolicy(Long policyId, SessionUser actor) {
        OpsPricePolicyMutationTargetRecord target = pricePolicyQueryMapper.lockPricePolicyTarget(policyId);
        if (target == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Price policy not found.");
        }
        requireMutationAccess(actor, target.getHostUserId());
        if (!"ACTIVE".equals(target.getStatus())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Price policy is already inactive."
            );
        }

        LocalDateTime now = LocalDateTime.now(clock);
        int updatedRows = pricePolicyCommandMapper.markPricePolicyInactive(policyId, now);
        if (updatedRows != 1) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Price policy is already inactive."
            );
        }

        opsPricePolicyAuditService.writePricePolicyAudit(
                actor,
                target.getPolicyId(),
                "PRICE_POLICY_DEACTIVATED",
                "Additive delta price policy deactivated by operations.",
                buildState(
                        target.getAccommodationId(),
                        target.getAccommodationName(),
                        target.getRoomTypeId(),
                        target.getRoomTypeName(),
                        target.getPolicyName(),
                        target.getStartDate(),
                        target.getEndDate(),
                        target.getDeltaAmount(),
                        target.getDayOfWeekMask(),
                        target.getStatus()
                ),
                buildState(
                        target.getAccommodationId(),
                        target.getAccommodationName(),
                        target.getRoomTypeId(),
                        target.getRoomTypeName(),
                        target.getPolicyName(),
                        target.getStartDate(),
                        target.getEndDate(),
                        target.getDeltaAmount(),
                        target.getDayOfWeekMask(),
                        "INACTIVE"
                ),
                now
        );

        return new PricePolicyMutationResult(
                target.getPolicyId(),
                target.getAccommodationId(),
                target.getAccommodationName(),
                target.getRoomTypeId(),
                target.getRoomTypeName(),
                target.getPolicyName(),
                target.getStartDate(),
                target.getEndDate(),
                target.getDeltaAmount(),
                target.getDayOfWeekMask(),
                "INACTIVE",
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    private String normalizePolicyName(String policyName) {
        if (policyName == null || policyName.isBlank()) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Policy name is required."
            );
        }
        return policyName.trim();
    }

    private Integer normalizeDayOfWeekMask(Integer dayOfWeekMask) {
        if (dayOfWeekMask == null) {
            return null;
        }
        if (dayOfWeekMask < 0 || dayOfWeekMask > 127) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Day-of-week mask must stay between 0 and 127."
            );
        }
        return dayOfWeekMask;
    }

    private void requireMutationAccess(SessionUser actor, Long hostUserId) {
        if (actor.role() == UserRole.ADMIN) {
            return;
        }
        if (!actor.userId().equals(hostUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }
    }

    private Map<String, Object> buildState(
            Long accommodationId,
            String accommodationName,
            Long roomTypeId,
            String roomTypeName,
            String policyName,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal deltaAmount,
            Integer dayOfWeekMask,
            String status
    ) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("accommodationId", accommodationId);
        state.put("accommodationName", accommodationName);
        state.put("roomTypeId", roomTypeId);
        state.put("roomTypeName", roomTypeName);
        state.put("policyName", policyName);
        state.put("startDate", startDate);
        state.put("endDate", endDate);
        state.put("deltaAmount", deltaAmount);
        state.put("dayOfWeekMask", dayOfWeekMask);
        state.put("status", status);
        return state;
    }
}
