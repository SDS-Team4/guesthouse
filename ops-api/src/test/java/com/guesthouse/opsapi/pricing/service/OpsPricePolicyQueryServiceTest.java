package com.guesthouse.opsapi.pricing.service;

import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyQueryMapper;
import com.guesthouse.shared.db.pricing.model.OpsPricePolicyRecord;
import com.guesthouse.shared.db.pricing.model.OpsPricingAccommodationOptionRecord;
import com.guesthouse.shared.db.pricing.model.OpsPricingRoomTypeOptionRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OpsPricePolicyQueryServiceTest {

    @Mock
    private PricePolicyQueryMapper pricePolicyQueryMapper;

    private OpsPricePolicyQueryService opsPricePolicyQueryService;

    @BeforeEach
    void setUp() {
        opsPricePolicyQueryService = new OpsPricePolicyQueryService(pricePolicyQueryMapper);
    }

    @Test
    void managementViewDefaultsToFirstAccessibleAccommodation() {
        when(pricePolicyQueryMapper.findAccessibleAccommodations(102L, false)).thenReturn(List.of(accommodation()));
        when(pricePolicyQueryMapper.findActiveRoomTypesByAccommodationId(501L)).thenReturn(List.of(roomType()));
        when(pricePolicyQueryMapper.findPricePolicies(102L, false, 501L, null)).thenReturn(List.of(policy()));

        OpsPricePolicyManagementView view = opsPricePolicyQueryService.getPricePolicyManagementView(
                new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST),
                null,
                null
        );

        assertEquals(501L, view.selectedAccommodationId());
        assertEquals(1, view.policies().size());
        assertEquals(901L, view.policies().get(0).getPolicyId());
    }

    @Test
    void managementViewRejectsInaccessibleAccommodation() {
        when(pricePolicyQueryMapper.findAccessibleAccommodations(102L, false)).thenReturn(List.of(accommodation()));

        AppException exception = assertThrows(
                AppException.class,
                () -> opsPricePolicyQueryService.getPricePolicyManagementView(
                        new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST),
                        999L,
                        null
                )
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    private OpsPricingAccommodationOptionRecord accommodation() {
        OpsPricingAccommodationOptionRecord record = new OpsPricingAccommodationOptionRecord();
        record.setAccommodationId(501L);
        record.setAccommodationName("Seoul Bridge Guesthouse");
        record.setRegion("SEOUL");
        return record;
    }

    private OpsPricingRoomTypeOptionRecord roomType() {
        OpsPricingRoomTypeOptionRecord record = new OpsPricingRoomTypeOptionRecord();
        record.setRoomTypeId(1001L);
        record.setAccommodationId(501L);
        record.setRoomTypeName("Standard Double");
        record.setBasePrice(BigDecimal.valueOf(80000));
        return record;
    }

    private OpsPricePolicyRecord policy() {
        OpsPricePolicyRecord record = new OpsPricePolicyRecord();
        record.setPolicyId(901L);
        record.setAccommodationId(501L);
        record.setAccommodationName("Seoul Bridge Guesthouse");
        record.setRoomTypeId(1001L);
        record.setRoomTypeName("Standard Double");
        record.setPolicyName("Weekend uplift");
        record.setStartDate(LocalDate.of(2026, 4, 1));
        record.setEndDate(LocalDate.of(2026, 4, 30));
        record.setDeltaAmount(BigDecimal.valueOf(15000));
        record.setStatus("ACTIVE");
        return record;
    }
}
