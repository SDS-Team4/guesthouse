package com.guesthouse.opsapi.pricing.service;

import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyQueryMapper;
import com.guesthouse.shared.db.pricing.model.OpsPricePolicyRecord;
import com.guesthouse.shared.db.pricing.model.OpsPricingAccommodationOptionRecord;
import com.guesthouse.shared.db.pricing.model.OpsPricingRoomTypeOptionRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.user.UserRole;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OpsPricePolicyQueryService {

    private final PricePolicyQueryMapper pricePolicyQueryMapper;

    public OpsPricePolicyQueryService(PricePolicyQueryMapper pricePolicyQueryMapper) {
        this.pricePolicyQueryMapper = pricePolicyQueryMapper;
    }

    public OpsPricePolicyManagementView getPricePolicyManagementView(
            SessionUser actor,
            Long requestedAccommodationId,
            Long requestedRoomTypeId
    ) {
        List<OpsPricingAccommodationOptionRecord> accommodations = pricePolicyQueryMapper.findAccessibleAccommodations(
                actor.userId(),
                actor.role() == UserRole.ADMIN
        );
        if (accommodations.isEmpty()) {
            return new OpsPricePolicyManagementView(null, null, List.of(), List.of(), List.of());
        }

        Long selectedAccommodationId = requestedAccommodationId == null
                ? accommodations.get(0).getAccommodationId()
                : requestedAccommodationId;
        boolean accommodationAccessible = accommodations.stream()
                .anyMatch(accommodation -> accommodation.getAccommodationId().equals(selectedAccommodationId));
        if (!accommodationAccessible) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        List<OpsPricingRoomTypeOptionRecord> roomTypes =
                pricePolicyQueryMapper.findActiveRoomTypesByAccommodationId(selectedAccommodationId);
        if (requestedRoomTypeId != null
                && roomTypes.stream().noneMatch(roomType -> roomType.getRoomTypeId().equals(requestedRoomTypeId))) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Selected room type is not an active room type in this accommodation."
            );
        }

        List<OpsPricePolicyRecord> policies = pricePolicyQueryMapper.findPricePolicies(
                actor.userId(),
                actor.role() == UserRole.ADMIN,
                selectedAccommodationId,
                requestedRoomTypeId
        );
        return new OpsPricePolicyManagementView(
                selectedAccommodationId,
                requestedRoomTypeId,
                accommodations,
                roomTypes,
                policies
        );
    }
}
