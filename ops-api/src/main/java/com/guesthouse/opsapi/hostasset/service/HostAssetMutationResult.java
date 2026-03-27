package com.guesthouse.opsapi.hostasset.service;

import java.time.OffsetDateTime;

public record HostAssetMutationResult(
        Long assetId,
        String assetName,
        String status,
        OffsetDateTime changedAt
) {
}
