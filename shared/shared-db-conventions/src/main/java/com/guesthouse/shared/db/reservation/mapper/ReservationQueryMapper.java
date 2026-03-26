package com.guesthouse.shared.db.reservation.mapper;

import com.guesthouse.shared.db.reservation.model.ActiveRoomTypeOptionRecord;
import com.guesthouse.shared.db.reservation.model.AccommodationOccupiedRoomNightRecord;
import com.guesthouse.shared.db.reservation.model.AccommodationRoomBlockRecord;
import com.guesthouse.shared.db.reservation.model.AccommodationRoomInventoryRecord;
import com.guesthouse.shared.db.reservation.model.ActiveRoomInventoryRecord;
import com.guesthouse.shared.db.reservation.model.ActivePricePolicyRecord;
import com.guesthouse.shared.db.reservation.model.GuestReservationDetailRecord;
import com.guesthouse.shared.db.reservation.model.GuestReservationNightRecord;
import com.guesthouse.shared.db.reservation.model.GuestReservationCancellationTargetRecord;
import com.guesthouse.shared.db.reservation.model.GuestReservationStatusHistoryRecord;
import com.guesthouse.shared.db.reservation.model.GuestReservationSummaryRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationBlockContextRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationDetailRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationListRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationMutationTargetRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationNightRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationStatusHistoryRecord;
import com.guesthouse.shared.db.reservation.model.PendingReservationSummaryRecord;
import com.guesthouse.shared.db.reservation.model.ReservationDecisionTargetRecord;
import com.guesthouse.shared.domain.reservation.ReservationStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface ReservationQueryMapper {

    List<ActiveRoomTypeOptionRecord> findActiveRoomTypeOptions();

    List<AccommodationRoomInventoryRecord> findAccommodationRoomInventoryByRegions(@Param("regions") List<String> regions);

    List<AccommodationRoomInventoryRecord> findAccommodationRoomInventoryByAccommodationId(
            @Param("accommodationId") Long accommodationId
    );

    List<ActiveRoomInventoryRecord> findActiveRoomsByAccommodationId(
            @Param("accommodationId") Long accommodationId
    );

    List<AccommodationRoomBlockRecord> findActiveRoomBlocksByAccommodationIdsForDateRange(
            @Param("accommodationIds") List<Long> accommodationIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    List<AccommodationOccupiedRoomNightRecord> findOccupiedRoomNightsByAccommodationIdsForDateRange(
            @Param("accommodationIds") List<Long> accommodationIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    List<GuestReservationSummaryRecord> findReservationsByGuestUserId(@Param("guestUserId") Long guestUserId);

    GuestReservationDetailRecord findReservationDetailByReservationIdAndGuestUserId(
            @Param("reservationId") Long reservationId,
            @Param("guestUserId") Long guestUserId
    );

    GuestReservationCancellationTargetRecord lockReservationCancellationTargetByReservationIdAndGuestUserId(
            @Param("reservationId") Long reservationId,
            @Param("guestUserId") Long guestUserId
    );

    List<GuestReservationNightRecord> findReservationNightsByReservationId(@Param("reservationId") Long reservationId);

    List<GuestReservationStatusHistoryRecord> findReservationStatusHistoryByReservationId(
            @Param("reservationId") Long reservationId
    );

    List<PendingReservationSummaryRecord> findPendingReservationsByHostUserId(@Param("hostUserId") Long hostUserId);

    ReservationDecisionTargetRecord lockReservationDecisionTarget(@Param("reservationId") Long reservationId);

    List<OpsReservationListRecord> findOpsReservations(
            @Param("hostUserId") Long hostUserId,
            @Param("isAdmin") boolean isAdmin,
            @Param("status") ReservationStatus status,
            @Param("currentDate") LocalDate currentDate
    );

    OpsReservationDetailRecord findOpsReservationDetailByReservationId(@Param("reservationId") Long reservationId);

    List<OpsReservationNightRecord> findOpsReservationNightsByReservationIds(
            @Param("reservationIds") List<Long> reservationIds
    );

    List<OpsReservationStatusHistoryRecord> findOpsReservationStatusHistoryByReservationId(
            @Param("reservationId") Long reservationId
    );

    List<OpsReservationBlockContextRecord> findActiveRoomBlockContextsByAccommodationIdForDateRange(
            @Param("accommodationId") Long accommodationId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    List<ActivePricePolicyRecord> findActivePricePoliciesByRoomTypeIdForDateRange(
            @Param("accommodationId") Long accommodationId,
            @Param("roomTypeId") Long roomTypeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    OpsReservationMutationTargetRecord lockOpsReservationMutationTarget(@Param("reservationId") Long reservationId);
}
