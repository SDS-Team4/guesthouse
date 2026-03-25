package com.guesthouse.guestapi.accommodation;

import com.guesthouse.guestapi.accommodation.api.AccommodationDetailResponse;
import com.guesthouse.guestapi.accommodation.api.AccommodationSearchResponse;
import com.guesthouse.guestapi.accommodation.api.RoomTypeCalendarResponse;
import com.guesthouse.guestapi.accommodation.service.GuestAccommodationReadService;
import com.guesthouse.shared.domain.api.ApiResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/accommodations")
public class GuestAccommodationController {

    private final GuestAccommodationReadService guestAccommodationReadService;

    public GuestAccommodationController(GuestAccommodationReadService guestAccommodationReadService) {
        this.guestAccommodationReadService = guestAccommodationReadService;
    }

    @GetMapping("/search")
    public ApiResponse<List<AccommodationSearchResponse>> searchAccommodations(
            @RequestParam(required = false) String region,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOutDate,
            @RequestParam int guestCount
    ) {
        return ApiResponse.success(
                guestAccommodationReadService.searchAccommodations(
                        region,
                        checkInDate,
                        checkOutDate,
                        guestCount
                )
        );
    }

    @GetMapping("/{accommodationId}")
    public ApiResponse<AccommodationDetailResponse> getAccommodationDetail(
            @PathVariable Long accommodationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOutDate,
            @RequestParam int guestCount
    ) {
        return ApiResponse.success(
                guestAccommodationReadService.getAccommodationDetail(
                        accommodationId,
                        checkInDate,
                        checkOutDate,
                        guestCount
                )
        );
    }

    @GetMapping("/{accommodationId}/room-types/{roomTypeId}/calendar")
    public ApiResponse<RoomTypeCalendarResponse> getRoomTypeCalendar(
            @PathVariable Long accommodationId,
            @PathVariable Long roomTypeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ApiResponse.success(
                guestAccommodationReadService.getRoomTypeCalendar(
                        accommodationId,
                        roomTypeId,
                        startDate,
                        endDate
                )
        );
    }
}
