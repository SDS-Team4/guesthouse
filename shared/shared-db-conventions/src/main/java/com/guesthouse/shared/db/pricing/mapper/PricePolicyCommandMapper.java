package com.guesthouse.shared.db.pricing.mapper;

import com.guesthouse.shared.db.pricing.model.PricePolicyInsertParam;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface PricePolicyCommandMapper {

    void insertPricePolicy(PricePolicyInsertParam pricePolicyInsertParam);

    int markPricePolicyInactive(
            @Param("policyId") Long policyId,
            @Param("updatedAt") LocalDateTime updatedAt
    );
}
