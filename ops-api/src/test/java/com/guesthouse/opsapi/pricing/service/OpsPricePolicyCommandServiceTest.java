package com.guesthouse.opsapi.pricing.service;

import com.guesthouse.opsapi.pricing.api.CreatePricePolicyRequest;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyCommandMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyQueryMapper;
import com.guesthouse.shared.db.pricing.model.OpsPricePolicyMutationTargetRecord;
import com.guesthouse.shared.db.pricing.model.OpsPricingRoomTypeTargetRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OpsPricePolicyCommandServiceTest {

    @Mock
    private PricePolicyQueryMapper pricePolicyQueryMapper;

    @Mock
    private PricePolicyCommandMapper pricePolicyCommandMapper;

    @Mock
    private OpsPricePolicyAuditService opsPricePolicyAuditService;

    private OpsPricePolicyCommandService opsPricePolicyCommandService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(Instant.parse("2026-03-25T01:00:00Z"), ZoneId.of("Asia/Seoul"));
        opsPricePolicyCommandService = new OpsPricePolicyCommandService(
                pricePolicyQueryMapper,
                pricePolicyCommandMapper,
                opsPricePolicyAuditService,
                fixedClock
        );
    }

    @Test
    void createPricePolicyAllowsValidHostPolicy() {
        when(pricePolicyQueryMapper.lockRoomTypeTarget(1001L)).thenReturn(activeRoomTypeTarget());
        doAnswer(invocation -> {
            com.guesthouse.shared.db.pricing.model.PricePolicyInsertParam param = invocation.getArgument(0);
            param.setPolicyId(901L);
            return null;
        }).when(pricePolicyCommandMapper).insertPricePolicy(any());

        PricePolicyMutationResult result = opsPricePolicyCommandService.createPricePolicy(
                new CreatePricePolicyRequest(
                        1001L,
                        "Weekend uplift",
                        LocalDate.of(2026, 4, 1),
                        LocalDate.of(2026, 4, 30),
                        BigDecimal.valueOf(15000),
                        96
                ),
                hostActor()
        );

        assertEquals(901L, result.policyId());
        assertEquals("ACTIVE", result.status());
        verify(pricePolicyCommandMapper).insertPricePolicy(any());
        verify(opsPricePolicyAuditService).writePricePolicyAudit(
                any(SessionUser.class),
                eq(901L),
                eq("PRICE_POLICY_CREATED"),
                eq("Additive delta price policy created by operations."),
                eq(null),
                any(),
                eq(LocalDateTime.of(2026, 3, 25, 10, 0))
        );
    }

    @Test
    void createPricePolicyRejectsInvalidMask() {
        AppException exception = assertThrows(
                AppException.class,
                () -> opsPricePolicyCommandService.createPricePolicy(
                        new CreatePricePolicyRequest(
                                1001L,
                                "Invalid mask",
                                LocalDate.of(2026, 4, 1),
                                LocalDate.of(2026, 4, 30),
                                BigDecimal.valueOf(15000),
                                128
                        ),
                        hostActor()
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals(ErrorCode.INVALID_REQUEST, exception.getErrorCode());
        verify(pricePolicyCommandMapper, never()).insertPricePolicy(any());
    }

    @Test
    void deactivatePricePolicyMarksInactive() {
        when(pricePolicyQueryMapper.lockPricePolicyTarget(901L)).thenReturn(activePolicyTarget());
        when(pricePolicyCommandMapper.markPricePolicyInactive(901L, LocalDateTime.of(2026, 3, 25, 10, 0)))
                .thenReturn(1);

        PricePolicyMutationResult result = opsPricePolicyCommandService.deactivatePricePolicy(901L, adminActor());

        assertEquals("INACTIVE", result.status());
        verify(opsPricePolicyAuditService).writePricePolicyAudit(
                any(SessionUser.class),
                eq(901L),
                eq("PRICE_POLICY_DEACTIVATED"),
                eq("Additive delta price policy deactivated by operations."),
                any(),
                any(),
                eq(LocalDateTime.of(2026, 3, 25, 10, 0))
        );
    }

    private OpsPricingRoomTypeTargetRecord activeRoomTypeTarget() {
        OpsPricingRoomTypeTargetRecord target = new OpsPricingRoomTypeTargetRecord();
        target.setRoomTypeId(1001L);
        target.setAccommodationId(501L);
        target.setAccommodationName("Seoul Bridge Guesthouse");
        target.setRoomTypeName("Standard Double");
        target.setBasePrice(BigDecimal.valueOf(80000));
        target.setRoomTypeStatus("ACTIVE");
        target.setHostUserId(102L);
        return target;
    }

    private OpsPricePolicyMutationTargetRecord activePolicyTarget() {
        OpsPricePolicyMutationTargetRecord target = new OpsPricePolicyMutationTargetRecord();
        target.setPolicyId(901L);
        target.setAccommodationId(501L);
        target.setAccommodationName("Seoul Bridge Guesthouse");
        target.setRoomTypeId(1001L);
        target.setRoomTypeName("Standard Double");
        target.setHostUserId(102L);
        target.setPolicyName("Weekend uplift");
        target.setStartDate(LocalDate.of(2026, 4, 1));
        target.setEndDate(LocalDate.of(2026, 4, 30));
        target.setDeltaAmount(BigDecimal.valueOf(15000));
        target.setDayOfWeekMask(96);
        target.setStatus("ACTIVE");
        return target;
    }

    private SessionUser hostActor() {
        return new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST);
    }

    private SessionUser adminActor() {
        return new SessionUser(103L, "admin.demo", "Admin Demo", UserRole.ADMIN);
    }
}
