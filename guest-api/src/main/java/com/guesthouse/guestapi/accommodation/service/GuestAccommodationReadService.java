package com.guesthouse.guestapi.accommodation.service;

import com.guesthouse.guestapi.accommodation.api.AccommodationAvailabilityCategory;
import com.guesthouse.guestapi.accommodation.api.AccommodationDetailResponse;
import com.guesthouse.guestapi.accommodation.api.AccommodationSearchResponse;
import com.guesthouse.guestapi.accommodation.api.RoomTypeAvailabilityResponse;
import com.guesthouse.guestapi.accommodation.api.RoomTypeCalendarDayResponse;
import com.guesthouse.guestapi.accommodation.api.RoomTypeCalendarResponse;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.AccommodationOccupiedRoomNightRecord;
import com.guesthouse.shared.db.reservation.model.AccommodationRoomBlockRecord;
import com.guesthouse.shared.db.reservation.model.AccommodationRoomInventoryRecord;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyQueryMapper;
import com.guesthouse.shared.db.reservation.model.ActivePricePolicyRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class GuestAccommodationReadService {

    private final ReservationQueryMapper reservationQueryMapper;
    private final PricePolicyQueryMapper pricePolicyQueryMapper;
    private final Clock clock;

    public GuestAccommodationReadService(
            ReservationQueryMapper reservationQueryMapper,
            PricePolicyQueryMapper pricePolicyQueryMapper,
            Clock clock
    ) {
        this.reservationQueryMapper = reservationQueryMapper;
        this.pricePolicyQueryMapper = pricePolicyQueryMapper;
        this.clock = clock;
    }

    public List<AccommodationSearchResponse> searchAccommodations(
            String region,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            int guestCount
    ) {
        validateStayQuery(checkInDate, checkOutDate, guestCount);

        List<AccommodationRoomInventoryRecord> inventoryRecords =
                reservationQueryMapper.findAccommodationRoomInventoryByRegion(normalizeRegion(region));
        if (inventoryRecords.isEmpty()) {
            return List.of();
        }

        Map<Long, AccommodationContext> accommodationsById = buildAccommodationContexts(inventoryRecords);
        List<Long> accommodationIds = new ArrayList<>(accommodationsById.keySet());
        Map<Long, Map<LocalDate, Set<Long>>> blockedRoomsByAccommodationDate =
                buildBlockedRoomsByAccommodationDate(
                        reservationQueryMapper.findActiveRoomBlocksByAccommodationIdsForDateRange(
                                accommodationIds,
                                checkInDate,
                                checkOutDate
                        ),
                        checkInDate,
                        checkOutDate
                );
        Map<Long, Map<LocalDate, Set<Long>>> occupiedRoomsByAccommodationDate =
                buildOccupiedRoomsByAccommodationDate(
                        reservationQueryMapper.findOccupiedRoomNightsByAccommodationIdsForDateRange(
                                accommodationIds,
                                checkInDate,
                                checkOutDate
                        )
                );
        Map<Long, List<ActivePricePolicyRecord>> pricePoliciesByRoomTypeId =
                buildPricePoliciesByRoomTypeId(
                        pricePolicyQueryMapper.findActivePricePoliciesByAccommodationIdsForDateRange(
                                accommodationIds,
                                checkInDate,
                                checkOutDate
                        )
                );

        return accommodationsById.values()
                .stream()
                .map(accommodation -> toSearchResponse(
                        accommodation,
                        blockedRoomsByAccommodationDate.getOrDefault(accommodation.accommodationId(), Map.of()),
                        occupiedRoomsByAccommodationDate.getOrDefault(accommodation.accommodationId(), Map.of()),
                        pricePoliciesByRoomTypeId,
                        guestCount,
                        checkInDate,
                        checkOutDate
                ))
                .sorted(Comparator
                        .comparingInt((AccommodationSearchResponse response) -> classificationRank(response.availabilityCategory()))
                        .thenComparing(AccommodationSearchResponse::accommodationName))
                .toList();
    }

    public AccommodationDetailResponse getAccommodationDetail(
            Long accommodationId,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            int guestCount
    ) {
        validateStayQuery(checkInDate, checkOutDate, guestCount);

        AccommodationContext accommodation = loadAccommodationContext(accommodationId);
        List<Long> accommodationIds = List.of(accommodationId);
        Map<LocalDate, Set<Long>> blockedRoomsByDate =
                buildBlockedRoomsByAccommodationDate(
                        reservationQueryMapper.findActiveRoomBlocksByAccommodationIdsForDateRange(
                                accommodationIds,
                                checkInDate,
                                checkOutDate
                        ),
                        checkInDate,
                        checkOutDate
                ).getOrDefault(accommodationId, Map.of());
        Map<LocalDate, Set<Long>> occupiedRoomsByDate =
                buildOccupiedRoomsByAccommodationDate(
                        reservationQueryMapper.findOccupiedRoomNightsByAccommodationIdsForDateRange(
                                accommodationIds,
                                checkInDate,
                                checkOutDate
                        )
                ).getOrDefault(accommodationId, Map.of());
        Map<Long, List<ActivePricePolicyRecord>> pricePoliciesByRoomTypeId =
                buildPricePoliciesByRoomTypeId(
                        pricePolicyQueryMapper.findActivePricePoliciesByAccommodationIdsForDateRange(
                                accommodationIds,
                                checkInDate,
                                checkOutDate
                        )
                );

        List<ComputedRoomTypeAvailability> computedRoomTypes = computeRoomTypeAvailabilities(
                accommodation,
                blockedRoomsByDate,
                occupiedRoomsByDate,
                pricePoliciesByRoomTypeId,
                guestCount,
                checkInDate,
                checkOutDate
        );

        return new AccommodationDetailResponse(
                accommodation.accommodationId(),
                accommodation.accommodationName(),
                accommodation.region(),
                accommodation.address(),
                accommodation.infoText(),
                accommodation.checkInTime(),
                accommodation.checkOutTime(),
                classifyAccommodation(computedRoomTypes),
                computedRoomTypes.stream()
                        .sorted(Comparator
                                .comparingInt((ComputedRoomTypeAvailability item) -> classificationRank(item.availabilityCategory()))
                                .thenComparing(item -> item.roomType().roomTypeName()))
                        .map(item -> new RoomTypeAvailabilityResponse(
                                item.roomType().roomTypeId(),
                                item.roomType().roomTypeName(),
                                item.roomType().baseCapacity(),
                                item.roomType().maxCapacity(),
                                item.roomType().basePrice(),
                                item.previewPrice(),
                                item.roomType().roomIds().size(),
                                item.availableRoomCount(),
                                item.matchesGuestCount(),
                                item.availabilityCategory()
                        ))
                        .toList()
        );
    }

    public RoomTypeCalendarResponse getRoomTypeCalendar(
            Long accommodationId,
            Long roomTypeId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        validateCalendarRange(startDate, endDate);

        AccommodationContext accommodation = loadAccommodationContext(accommodationId);
        RoomTypeContext roomType = accommodation.roomTypes().get(roomTypeId);
        if (roomType == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Room type not found.");
        }

        List<Long> accommodationIds = List.of(accommodationId);
        Map<LocalDate, Set<Long>> blockedRoomsByDate =
                buildBlockedRoomsByAccommodationDate(
                        reservationQueryMapper.findActiveRoomBlocksByAccommodationIdsForDateRange(
                                accommodationIds,
                                startDate,
                                endDate
                        ),
                        startDate,
                        endDate
                ).getOrDefault(accommodationId, Map.of());
        Map<LocalDate, Set<Long>> occupiedRoomsByDate =
                buildOccupiedRoomsByAccommodationDate(
                        reservationQueryMapper.findOccupiedRoomNightsByAccommodationIdsForDateRange(
                                accommodationIds,
                                startDate,
                                endDate
                        )
                ).getOrDefault(accommodationId, Map.of());

        List<RoomTypeCalendarDayResponse> days = new ArrayList<>();
        LocalDate cursor = startDate;
        while (cursor.isBefore(endDate)) {
            int availableRoomCount = calculateAvailableRoomCountForDate(
                    roomType.roomIds(),
                    blockedRoomsByDate.getOrDefault(cursor, Set.of()),
                    occupiedRoomsByDate.getOrDefault(cursor, Set.of())
            );
            days.add(new RoomTypeCalendarDayResponse(cursor, availableRoomCount, availableRoomCount == 0));
            cursor = cursor.plusDays(1);
        }

        return new RoomTypeCalendarResponse(
                accommodationId,
                roomTypeId,
                roomType.roomTypeName(),
                startDate,
                endDate,
                days
        );
    }

    private AccommodationContext loadAccommodationContext(Long accommodationId) {
        List<AccommodationRoomInventoryRecord> inventoryRecords =
                reservationQueryMapper.findAccommodationRoomInventoryByAccommodationId(accommodationId);
        if (inventoryRecords.isEmpty()) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Accommodation not found.");
        }

        return buildAccommodationContexts(inventoryRecords)
                .values()
                .stream()
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Accommodation not found."));
    }

    private void validateStayQuery(LocalDate checkInDate, LocalDate checkOutDate, int guestCount) {
        validateCalendarRange(checkInDate, checkOutDate);
        if (guestCount <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Guest count must be positive.");
        }
    }

    private void validateCalendarRange(LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now(clock);
        LocalDate maxDate = today.plusYears(1);
        if (!startDate.isBefore(endDate)) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "End date must be after start date."
            );
        }
        if (startDate.isBefore(today)) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Start date must not be in the past."
            );
        }
        if (startDate.isAfter(maxDate) || endDate.isAfter(maxDate.plusDays(1))) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Date range must stay within one year."
            );
        }
    }

    private String normalizeRegion(String region) {
        if (region == null || region.isBlank()) {
            return null;
        }
        return region.trim().toUpperCase(Locale.ROOT);
    }

    private Map<Long, AccommodationContext> buildAccommodationContexts(List<AccommodationRoomInventoryRecord> inventoryRecords) {
        Map<Long, AccommodationContext> accommodationsById = new LinkedHashMap<>();
        for (AccommodationRoomInventoryRecord record : inventoryRecords) {
            AccommodationContext accommodation = accommodationsById.computeIfAbsent(
                    record.getAccommodationId(),
                    ignored -> new AccommodationContext(
                            record.getAccommodationId(),
                            record.getAccommodationName(),
                            record.getRegion(),
                            record.getAddress(),
                            record.getInfoText(),
                            record.getCheckInTime(),
                            record.getCheckOutTime(),
                            new LinkedHashMap<>()
                    )
            );

            RoomTypeContext roomType = accommodation.roomTypes().computeIfAbsent(
                    record.getRoomTypeId(),
                    ignored -> new RoomTypeContext(
                            record.getRoomTypeId(),
                            record.getRoomTypeName(),
                            record.getBaseCapacity(),
                            record.getMaxCapacity(),
                            record.getBasePrice(),
                            new LinkedHashSet<>()
                    )
            );
            roomType.roomIds().add(record.getRoomId());
        }
        return accommodationsById;
    }

    private Map<Long, Map<LocalDate, Set<Long>>> buildBlockedRoomsByAccommodationDate(
            List<AccommodationRoomBlockRecord> blockRecords,
            LocalDate startDate,
            LocalDate endDate
    ) {
        Map<Long, Map<LocalDate, Set<Long>>> blockedRoomsByAccommodationDate = new HashMap<>();
        for (AccommodationRoomBlockRecord blockRecord : blockRecords) {
            LocalDate cursor = blockRecord.getStartDate().isBefore(startDate)
                    ? startDate
                    : blockRecord.getStartDate();
            while (cursor.isBefore(endDate) && !cursor.isAfter(blockRecord.getEndDate())) {
                blockedRoomsByAccommodationDate
                        .computeIfAbsent(blockRecord.getAccommodationId(), ignored -> new HashMap<>())
                        .computeIfAbsent(cursor, ignored -> new LinkedHashSet<>())
                        .add(blockRecord.getRoomId());
                cursor = cursor.plusDays(1);
            }
        }
        return blockedRoomsByAccommodationDate;
    }

    private Map<Long, Map<LocalDate, Set<Long>>> buildOccupiedRoomsByAccommodationDate(
            List<AccommodationOccupiedRoomNightRecord> occupiedRoomNightRecords
    ) {
        Map<Long, Map<LocalDate, Set<Long>>> occupiedRoomsByAccommodationDate = new HashMap<>();
        for (AccommodationOccupiedRoomNightRecord occupiedRoomNightRecord : occupiedRoomNightRecords) {
            occupiedRoomsByAccommodationDate
                    .computeIfAbsent(occupiedRoomNightRecord.getAccommodationId(), ignored -> new HashMap<>())
                    .computeIfAbsent(occupiedRoomNightRecord.getStayDate(), ignored -> new LinkedHashSet<>())
                    .add(occupiedRoomNightRecord.getRoomId());
        }
        return occupiedRoomsByAccommodationDate;
    }

    private AccommodationSearchResponse toSearchResponse(
            AccommodationContext accommodation,
            Map<LocalDate, Set<Long>> blockedRoomsByDate,
            Map<LocalDate, Set<Long>> occupiedRoomsByDate,
            Map<Long, List<ActivePricePolicyRecord>> pricePoliciesByRoomTypeId,
            int guestCount,
            LocalDate checkInDate,
            LocalDate checkOutDate
    ) {
        List<ComputedRoomTypeAvailability> computedRoomTypes = computeRoomTypeAvailabilities(
                accommodation,
                blockedRoomsByDate,
                occupiedRoomsByDate,
                pricePoliciesByRoomTypeId,
                guestCount,
                checkInDate,
                checkOutDate
        );
        BigDecimal lowestBasePrice = computedRoomTypes.stream()
                .map(item -> item.roomType().basePrice())
                .min(BigDecimal::compareTo)
                .orElse(null);
        BigDecimal lowestPreviewPrice = computedRoomTypes.stream()
                .map(ComputedRoomTypeAvailability::previewPrice)
                .min(BigDecimal::compareTo)
                .orElse(null);

        return new AccommodationSearchResponse(
                accommodation.accommodationId(),
                accommodation.accommodationName(),
                accommodation.region(),
                classifyAccommodation(computedRoomTypes),
                (int) computedRoomTypes.stream().filter(ComputedRoomTypeAvailability::matchesGuestCount).count(),
                (int) computedRoomTypes.stream()
                        .filter(item -> item.availabilityCategory() == AccommodationAvailabilityCategory.AVAILABLE)
                        .count(),
                lowestBasePrice,
                lowestPreviewPrice
        );
    }

    private List<ComputedRoomTypeAvailability> computeRoomTypeAvailabilities(
            AccommodationContext accommodation,
            Map<LocalDate, Set<Long>> blockedRoomsByDate,
            Map<LocalDate, Set<Long>> occupiedRoomsByDate,
            Map<Long, List<ActivePricePolicyRecord>> pricePoliciesByRoomTypeId,
            int guestCount,
            LocalDate startDate,
            LocalDate endDate
    ) {
        List<ComputedRoomTypeAvailability> computedRoomTypes = new ArrayList<>();
        for (RoomTypeContext roomType : accommodation.roomTypes().values()) {
            boolean matchesGuestCount = guestCount <= roomType.maxCapacity();
            int availableRoomCount = matchesGuestCount
                    ? calculateAvailableRoomCountForStay(roomType.roomIds(), blockedRoomsByDate, occupiedRoomsByDate, startDate, endDate)
                    : 0;
            BigDecimal previewPrice = calculatePreviewPrice(
                    roomType.basePrice(),
                    pricePoliciesByRoomTypeId.getOrDefault(roomType.roomTypeId(), List.of()),
                    startDate
            );

            AccommodationAvailabilityCategory availabilityCategory;
            if (!matchesGuestCount) {
                availabilityCategory = AccommodationAvailabilityCategory.CONDITION_MISMATCH;
            } else if (availableRoomCount > 0) {
                availabilityCategory = AccommodationAvailabilityCategory.AVAILABLE;
            } else {
                availabilityCategory = AccommodationAvailabilityCategory.SOLD_OUT;
            }

            computedRoomTypes.add(new ComputedRoomTypeAvailability(
                    roomType,
                    previewPrice,
                    matchesGuestCount,
                    availableRoomCount,
                    availabilityCategory
            ));
        }
        return computedRoomTypes;
    }

    private Map<Long, List<ActivePricePolicyRecord>> buildPricePoliciesByRoomTypeId(
            List<ActivePricePolicyRecord> activePricePolicies
    ) {
        Map<Long, List<ActivePricePolicyRecord>> policiesByRoomTypeId = new HashMap<>();
        for (ActivePricePolicyRecord activePricePolicy : activePricePolicies) {
            policiesByRoomTypeId
                    .computeIfAbsent(activePricePolicy.getRoomTypeId(), ignored -> new ArrayList<>())
                    .add(activePricePolicy);
        }
        return policiesByRoomTypeId;
    }

    private BigDecimal calculatePreviewPrice(
            BigDecimal basePrice,
            List<ActivePricePolicyRecord> activePricePolicies,
            LocalDate priceDate
    ) {
        BigDecimal deltaTotal = BigDecimal.ZERO;
        for (ActivePricePolicyRecord activePricePolicy : activePricePolicies) {
            if (!priceDate.isBefore(activePricePolicy.getStartDate())
                    && !priceDate.isAfter(activePricePolicy.getEndDate())
                    && appliesOnDayOfWeek(activePricePolicy.getDayOfWeekMask(), priceDate.getDayOfWeek())) {
                deltaTotal = deltaTotal.add(activePricePolicy.getDeltaAmount());
            }
        }
        return basePrice.add(deltaTotal);
    }

    private boolean appliesOnDayOfWeek(Integer dayOfWeekMask, DayOfWeek dayOfWeek) {
        if (dayOfWeekMask == null) {
            return true;
        }
        int bitIndex = switch (dayOfWeek) {
            case MONDAY -> 0;
            case TUESDAY -> 1;
            case WEDNESDAY -> 2;
            case THURSDAY -> 3;
            case FRIDAY -> 4;
            case SATURDAY -> 5;
            case SUNDAY -> 6;
        };
        return (dayOfWeekMask & (1 << bitIndex)) != 0;
    }

    private int calculateAvailableRoomCountForStay(
            Set<Long> roomIds,
            Map<LocalDate, Set<Long>> blockedRoomsByDate,
            Map<LocalDate, Set<Long>> occupiedRoomsByDate,
            LocalDate startDate,
            LocalDate endDate
    ) {
        int availableRoomCount = 0;
        for (Long roomId : roomIds) {
            boolean availableForEntireStay = true;
            LocalDate cursor = startDate;
            while (cursor.isBefore(endDate)) {
                if (blockedRoomsByDate.getOrDefault(cursor, Set.of()).contains(roomId)
                        || occupiedRoomsByDate.getOrDefault(cursor, Set.of()).contains(roomId)) {
                    availableForEntireStay = false;
                    break;
                }
                cursor = cursor.plusDays(1);
            }
            if (availableForEntireStay) {
                availableRoomCount++;
            }
        }
        return availableRoomCount;
    }

    private int calculateAvailableRoomCountForDate(
            Set<Long> roomIds,
            Set<Long> blockedRooms,
            Set<Long> occupiedRooms
    ) {
        int availableRoomCount = 0;
        for (Long roomId : roomIds) {
            if (!blockedRooms.contains(roomId) && !occupiedRooms.contains(roomId)) {
                availableRoomCount++;
            }
        }
        return availableRoomCount;
    }

    private AccommodationAvailabilityCategory classifyAccommodation(
            List<ComputedRoomTypeAvailability> computedRoomTypes
    ) {
        boolean hasAvailable = computedRoomTypes.stream()
                .anyMatch(item -> item.availabilityCategory() == AccommodationAvailabilityCategory.AVAILABLE);
        if (hasAvailable) {
            return AccommodationAvailabilityCategory.AVAILABLE;
        }

        boolean hasMatchingRoomType = computedRoomTypes.stream().anyMatch(ComputedRoomTypeAvailability::matchesGuestCount);
        return hasMatchingRoomType
                ? AccommodationAvailabilityCategory.SOLD_OUT
                : AccommodationAvailabilityCategory.CONDITION_MISMATCH;
    }

    private int classificationRank(AccommodationAvailabilityCategory availabilityCategory) {
        return switch (availabilityCategory) {
            case AVAILABLE -> 0;
            case CONDITION_MISMATCH -> 1;
            case SOLD_OUT -> 2;
        };
    }

    private record AccommodationContext(
            Long accommodationId,
            String accommodationName,
            String region,
            String address,
            String infoText,
            LocalTime checkInTime,
            LocalTime checkOutTime,
            Map<Long, RoomTypeContext> roomTypes
    ) {
    }

    private record RoomTypeContext(
            Long roomTypeId,
            String roomTypeName,
            int baseCapacity,
            int maxCapacity,
            BigDecimal basePrice,
            Set<Long> roomIds
    ) {
    }

    private record ComputedRoomTypeAvailability(
            RoomTypeContext roomType,
            BigDecimal previewPrice,
            boolean matchesGuestCount,
            int availableRoomCount,
            AccommodationAvailabilityCategory availabilityCategory
    ) {
    }
}
