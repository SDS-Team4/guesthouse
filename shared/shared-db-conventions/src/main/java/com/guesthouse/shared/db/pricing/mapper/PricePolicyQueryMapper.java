package com.guesthouse.shared.db.pricing.mapper;

import com.guesthouse.shared.db.pricing.model.OpsPricingAccommodationOptionRecord;
import com.guesthouse.shared.db.pricing.model.OpsPricePolicyMutationTargetRecord;
import com.guesthouse.shared.db.pricing.model.OpsPricePolicyRecord;
import com.guesthouse.shared.db.pricing.model.OpsPricingRoomTypeOptionRecord;
import com.guesthouse.shared.db.pricing.model.OpsPricingRoomTypeTargetRecord;
import com.guesthouse.shared.db.reservation.model.ActivePricePolicyRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface PricePolicyQueryMapper {

    List<OpsPricingAccommodationOptionRecord> findAccessibleAccommodations(
            @Param("hostUserId") Long hostUserId,
            @Param("isAdmin") boolean isAdmin
    );

    List<OpsPricingRoomTypeOptionRecord> findActiveRoomTypesByAccommodationId(
            @Param("accommodationId") Long accommodationId
    );

    List<OpsPricePolicyRecord> findPricePolicies(
            @Param("hostUserId") Long hostUserId,
            @Param("isAdmin") boolean isAdmin,
            @Param("accommodationId") Long accommodationId,
            @Param("roomTypeId") Long roomTypeId
    );

    OpsPricingRoomTypeTargetRecord lockRoomTypeTarget(@Param("roomTypeId") Long roomTypeId);

    OpsPricePolicyMutationTargetRecord lockPricePolicyTarget(@Param("policyId") Long policyId);

    List<ActivePricePolicyRecord> findActivePricePoliciesByAccommodationIdsForDateRange(
            @Param("accommodationIds") List<Long> accommodationIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
