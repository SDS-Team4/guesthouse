package com.guesthouse.guestapi.accommodation.service;

import com.guesthouse.guestapi.accommodation.api.AccommodationAvailabilityCategory;
import com.guesthouse.guestapi.accommodation.api.AccommodationDetailResponse;
import com.guesthouse.guestapi.accommodation.api.AccommodationSearchResponse;
import com.guesthouse.guestapi.accommodation.api.RoomTypeCalendarResponse;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyQueryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.ActivePricePolicyRecord;
import com.guesthouse.shared.db.reservation.model.AccommodationOccupiedRoomNightRecord;
import com.guesthouse.shared.db.reservation.model.AccommodationRoomBlockRecord;
import com.guesthouse.shared.db.reservation.model.AccommodationRoomInventoryRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
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
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuestAccommodationReadServiceTest {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    @Mock
    private ReservationQueryMapper reservationQueryMapper;

    @Mock
    private PricePolicyQueryMapper pricePolicyQueryMapper;

    private GuestAccommodationReadService guestAccommodationReadService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(Instant.parse("2026-04-01T00:00:00Z"), BUSINESS_ZONE_ID);
        guestAccommodationReadService = new GuestAccommodationReadService(
                reservationQueryMapper,
                pricePolicyQueryMapper,
                fixedClock
        );
    }

    @Test
    void searchAccommodationsClassifiesAndOrdersByAvailability() {
        LocalDate checkInDate = LocalDate.of(2026, 4, 16);
        LocalDate checkOutDate = LocalDate.of(2026, 4, 18);

        when(reservationQueryMapper.findAccommodationRoomInventoryByRegions(List.of("SEOUL")))
                .thenReturn(List.of(
                        inventory(501L, "Alpha Stay", "SEOUL", 1001L, "Standard Double", 2, 2, BigDecimal.valueOf(80000), 2001L),
                        inventory(501L, "Alpha Stay", "SEOUL", 1001L, "Standard Double", 2, 2, BigDecimal.valueOf(80000), 2002L),
                        inventory(502L, "Bravo House", "SEOUL", 1002L, "Single Compact", 1, 1, BigDecimal.valueOf(120000), 2101L),
                        inventory(503L, "Charlie Inn", "SEOUL", 1003L, "Standard Double", 2, 2, BigDecimal.valueOf(90000), 2201L)
                ));
        when(reservationQueryMapper.findActiveRoomBlocksByAccommodationIdsForDateRange(
                List.of(501L, 502L, 503L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of());
        when(reservationQueryMapper.findOccupiedRoomNightsByAccommodationIdsForDateRange(
                List.of(501L, 502L, 503L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of(
                occupied(503L, 2201L, LocalDate.of(2026, 4, 16)),
                occupied(503L, 2201L, LocalDate.of(2026, 4, 17))
        ));
        when(pricePolicyQueryMapper.findActivePricePoliciesByAccommodationIdsForDateRange(
                List.of(501L, 502L, 503L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of(
                pricePolicy(1001L, "Weekend uplift", LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30), null, 15000),
                pricePolicy(1003L, "Festival uplift", LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30), null, 5000)
        ));

        List<AccommodationSearchResponse> results =
                guestAccommodationReadService.searchAccommodations(List.of("SEOUL"), checkInDate, checkOutDate, 2);

        assertEquals(3, results.size());
        assertEquals("Alpha Stay", results.get(0).accommodationName());
        assertEquals(AccommodationAvailabilityCategory.AVAILABLE, results.get(0).availabilityCategory());
        assertEquals(BigDecimal.valueOf(95000), results.get(0).lowestPreviewPrice());
        assertEquals("Bravo House", results.get(1).accommodationName());
        assertEquals(AccommodationAvailabilityCategory.CONDITION_MISMATCH, results.get(1).availabilityCategory());
        assertEquals("Charlie Inn", results.get(2).accommodationName());
        assertEquals(AccommodationAvailabilityCategory.SOLD_OUT, results.get(2).availabilityCategory());
    }

    @Test
    void searchAccommodationsSupportsMultipleRegionsAsOrFilter() {
        LocalDate checkInDate = LocalDate.of(2026, 4, 16);
        LocalDate checkOutDate = LocalDate.of(2026, 4, 18);

        when(reservationQueryMapper.findAccommodationRoomInventoryByRegions(List.of("SEOUL", "BUSAN")))
                .thenReturn(List.of(
                        inventory(501L, "Alpha Stay", "SEOUL", 1001L, "Standard Double", 2, 2, BigDecimal.valueOf(80000), 2001L),
                        inventory(601L, "Busan Port Stay", "BUSAN", 1101L, "Ocean Twin", 2, 2, BigDecimal.valueOf(90000), 3001L)
                ));
        when(reservationQueryMapper.findActiveRoomBlocksByAccommodationIdsForDateRange(
                List.of(501L, 601L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of());
        when(reservationQueryMapper.findOccupiedRoomNightsByAccommodationIdsForDateRange(
                List.of(501L, 601L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of());
        when(pricePolicyQueryMapper.findActivePricePoliciesByAccommodationIdsForDateRange(
                List.of(501L, 601L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of());

        List<AccommodationSearchResponse> results =
                guestAccommodationReadService.searchAccommodations(List.of("SEOUL", "BUSAN"), checkInDate, checkOutDate, 2);

        assertEquals(2, results.size());
        assertEquals("Alpha Stay", results.get(0).accommodationName());
        assertEquals("Busan Port Stay", results.get(1).accommodationName());
    }

    @Test
    void searchAccommodationsAlsoNormalizesCommaSeparatedRegionInput() {
        LocalDate checkInDate = LocalDate.of(2026, 4, 16);
        LocalDate checkOutDate = LocalDate.of(2026, 4, 18);

        when(reservationQueryMapper.findAccommodationRoomInventoryByRegions(List.of("SEOUL", "BUSAN")))
                .thenReturn(List.of(
                        inventory(501L, "Alpha Stay", "SEOUL", 1001L, "Standard Double", 2, 2, BigDecimal.valueOf(80000), 2001L)
                ));
        when(reservationQueryMapper.findActiveRoomBlocksByAccommodationIdsForDateRange(
                List.of(501L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of());
        when(reservationQueryMapper.findOccupiedRoomNightsByAccommodationIdsForDateRange(
                List.of(501L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of());
        when(pricePolicyQueryMapper.findActivePricePoliciesByAccommodationIdsForDateRange(
                List.of(501L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of());

        List<AccommodationSearchResponse> results =
                guestAccommodationReadService.searchAccommodations(List.of("SEOUL,BUSAN"), checkInDate, checkOutDate, 2);

        assertEquals(1, results.size());
        assertEquals("Alpha Stay", results.get(0).accommodationName());
    }

    @Test
    void searchAccommodationsPrefersConditionMismatchOverSoldOutWhenBothExist() {
        LocalDate checkInDate = LocalDate.of(2026, 4, 16);
        LocalDate checkOutDate = LocalDate.of(2026, 4, 18);

        when(reservationQueryMapper.findAccommodationRoomInventoryByRegions(List.of("SEOUL")))
                .thenReturn(List.of(
                        inventory(701L, "Delta Mix Stay", "SEOUL", 1201L, "Single Compact", 1, 1, BigDecimal.valueOf(70000), 4001L),
                        inventory(701L, "Delta Mix Stay", "SEOUL", 1202L, "Standard Double", 2, 2, BigDecimal.valueOf(95000), 4002L)
                ));
        when(reservationQueryMapper.findActiveRoomBlocksByAccommodationIdsForDateRange(
                List.of(701L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of());
        when(reservationQueryMapper.findOccupiedRoomNightsByAccommodationIdsForDateRange(
                List.of(701L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of(
                occupied(701L, 4002L, LocalDate.of(2026, 4, 16)),
                occupied(701L, 4002L, LocalDate.of(2026, 4, 17))
        ));
        when(pricePolicyQueryMapper.findActivePricePoliciesByAccommodationIdsForDateRange(
                List.of(701L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of());

        List<AccommodationSearchResponse> results =
                guestAccommodationReadService.searchAccommodations(List.of("SEOUL"), checkInDate, checkOutDate, 2);

        assertEquals(1, results.size());
        assertEquals("Delta Mix Stay", results.get(0).accommodationName());
        assertEquals(AccommodationAvailabilityCategory.CONDITION_MISMATCH, results.get(0).availabilityCategory());
        assertEquals(1, results.get(0).matchingRoomTypeCount());
        assertEquals(0, results.get(0).availableRoomTypeCount());
    }

    @Test
    void accommodationDetailAndCalendarReflectBlocksAndOccupiedRooms() {
        LocalDate checkInDate = LocalDate.of(2026, 4, 16);
        LocalDate checkOutDate = LocalDate.of(2026, 4, 18);

        when(reservationQueryMapper.findAccommodationRoomInventoryByAccommodationId(501L))
                .thenReturn(List.of(
                        inventory(501L, "Alpha Stay", "SEOUL", 1001L, "Standard Double", 2, 2, BigDecimal.valueOf(80000), 2001L),
                        inventory(501L, "Alpha Stay", "SEOUL", 1001L, "Standard Double", 2, 2, BigDecimal.valueOf(80000), 2002L)
                ));
        when(reservationQueryMapper.findActiveRoomBlocksByAccommodationIdsForDateRange(
                List.of(501L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of(
                block(501L, 2001L, LocalDate.of(2026, 4, 16), LocalDate.of(2026, 4, 16))
        ));
        when(reservationQueryMapper.findOccupiedRoomNightsByAccommodationIdsForDateRange(
                List.of(501L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of(
                occupied(501L, 2002L, LocalDate.of(2026, 4, 17))
        ));
        when(pricePolicyQueryMapper.findActivePricePoliciesByAccommodationIdsForDateRange(
                List.of(501L),
                checkInDate,
                checkOutDate
        )).thenReturn(List.of(
                pricePolicy(1001L, "Weekend uplift", LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30), null, 15000)
        ));

        AccommodationDetailResponse detail = guestAccommodationReadService.getAccommodationDetail(
                501L,
                checkInDate,
                checkOutDate,
                2
        );

        assertEquals(AccommodationAvailabilityCategory.SOLD_OUT, detail.availabilityCategory());
        assertEquals(0, detail.roomTypes().get(0).availableRoomCount());
        assertEquals(BigDecimal.valueOf(95000), detail.roomTypes().get(0).previewPrice());

        RoomTypeCalendarResponse calendar = guestAccommodationReadService.getRoomTypeCalendar(
                501L,
                1001L,
                checkInDate,
                checkOutDate
        );

        assertEquals(2, calendar.days().size());
        assertEquals(1, calendar.days().get(0).availableRoomCount());
        assertEquals(1, calendar.days().get(1).availableRoomCount());
    }

    @Test
    void searchAccommodationsRejectsPastStayRange() {
        AppException exception = assertThrows(
                AppException.class,
                () -> guestAccommodationReadService.searchAccommodations(
                        List.of("SEOUL"),
                        LocalDate.of(2026, 3, 31),
                        LocalDate.of(2026, 4, 2),
                        2
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals(ErrorCode.INVALID_REQUEST, exception.getErrorCode());
    }

    private AccommodationRoomInventoryRecord inventory(
            Long accommodationId,
            String accommodationName,
            String region,
            Long roomTypeId,
            String roomTypeName,
            int baseCapacity,
            int maxCapacity,
            BigDecimal basePrice,
            Long roomId
    ) {
        AccommodationRoomInventoryRecord record = new AccommodationRoomInventoryRecord();
        record.setAccommodationId(accommodationId);
        record.setAccommodationName(accommodationName);
        record.setRegion(region);
        record.setAddress("101 Hangang-daero, Seoul");
        record.setInfoText("Han river stay");
        record.setCheckInTime(LocalTime.of(15, 0));
        record.setCheckOutTime(LocalTime.of(11, 0));
        record.setRoomTypeId(roomTypeId);
        record.setRoomTypeName(roomTypeName);
        record.setBaseCapacity(baseCapacity);
        record.setMaxCapacity(maxCapacity);
        record.setBasePrice(basePrice);
        record.setRoomId(roomId);
        return record;
    }

    private AccommodationRoomBlockRecord block(
            Long accommodationId,
            Long roomId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        AccommodationRoomBlockRecord record = new AccommodationRoomBlockRecord();
        record.setAccommodationId(accommodationId);
        record.setRoomId(roomId);
        record.setStartDate(startDate);
        record.setEndDate(endDate);
        return record;
    }

    private AccommodationOccupiedRoomNightRecord occupied(
            Long accommodationId,
            Long roomId,
            LocalDate stayDate
    ) {
        AccommodationOccupiedRoomNightRecord record = new AccommodationOccupiedRoomNightRecord();
        record.setAccommodationId(accommodationId);
        record.setRoomId(roomId);
        record.setStayDate(stayDate);
        return record;
    }

    private ActivePricePolicyRecord pricePolicy(
            Long roomTypeId,
            String policyName,
            LocalDate startDate,
            LocalDate endDate,
            Integer dayOfWeekMask,
            int deltaAmount
    ) {
        ActivePricePolicyRecord record = new ActivePricePolicyRecord();
        record.setPolicyId(900L + roomTypeId);
        record.setRoomTypeId(roomTypeId);
        record.setRoomTypeName("Policy Room Type");
        record.setPolicyName(policyName);
        record.setStartDate(startDate);
        record.setEndDate(endDate);
        record.setDeltaAmount(BigDecimal.valueOf(deltaAmount));
        record.setDayOfWeekMask(dayOfWeekMask);
        return record;
    }
}
