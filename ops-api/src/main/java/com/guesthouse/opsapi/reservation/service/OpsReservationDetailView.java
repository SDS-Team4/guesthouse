package com.guesthouse.opsapi.reservation.service;

import com.guesthouse.shared.db.reservation.model.ActivePricePolicyRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationBlockContextRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationDetailRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationStatusHistoryRecord;

import java.util.List;

public record OpsReservationDetailView(
        OpsReservationDetailRecord reservation,
        List<OpsReservationNightView> nights,
        List<OpsReservationStatusHistoryRecord> statusHistory,
        List<OpsReservationBlockContextRecord> blockContexts,
        List<ActivePricePolicyRecord> pricingPolicies,
        boolean reassignmentPossible
) {
}
