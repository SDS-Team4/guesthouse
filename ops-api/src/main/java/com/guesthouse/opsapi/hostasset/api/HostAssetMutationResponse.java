package com.guesthouse.opsapi.hostasset.api;

import com.guesthouse.opsapi.hostasset.service.HostAssetMutationResult;

import java.time.OffsetDateTime;

public record HostAssetMutationResponse(
        Long assetId,
        String assetName,
        String status,
        OffsetDateTime changedAt
) {
    public static HostAssetMutationResponse from(HostAssetMutationResult result) {
        return new HostAssetMutationResponse(
                result.assetId(),
                result.assetName(),
                result.status(),
                result.changedAt()
        );
    }
}
