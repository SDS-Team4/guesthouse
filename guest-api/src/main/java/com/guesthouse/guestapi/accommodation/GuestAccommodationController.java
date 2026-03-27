package com.guesthouse.guestapi.accommodation;

import com.guesthouse.guestapi.accommodation.api.AccommodationDetailResponse;
import com.guesthouse.guestapi.accommodation.api.AccommodationSearchResponse;
import com.guesthouse.guestapi.accommodation.api.RoomTypeCalendarResponse;
import com.guesthouse.guestapi.accommodation.config.GuestPublicReadProperties;
import com.guesthouse.guestapi.accommodation.service.GuestAccommodationReadService;
import com.guesthouse.guestapi.accommodation.service.GuestPublicReadRateLimitService;
import com.guesthouse.shared.domain.api.ApiResponse;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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
    private final GuestPublicReadRateLimitService guestPublicReadRateLimitService;
    private final GuestPublicReadProperties guestPublicReadProperties;

    public GuestAccommodationController(
            GuestAccommodationReadService guestAccommodationReadService,
            GuestPublicReadRateLimitService guestPublicReadRateLimitService,
            GuestPublicReadProperties guestPublicReadProperties
    ) {
        this.guestAccommodationReadService = guestAccommodationReadService;
        this.guestPublicReadRateLimitService = guestPublicReadRateLimitService;
        this.guestPublicReadProperties = guestPublicReadProperties;
    }

    @GetMapping("/search")
    public ApiResponse<List<AccommodationSearchResponse>> searchAccommodations(
            HttpServletRequest request,
            @RequestParam(required = false) String region,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOutDate,
            @RequestParam int guestCount,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size
    ) {
        guestPublicReadRateLimitService.assertSearchAllowed(extractClientIp(request));
        int resolvedPageSize = resolvePageSize(size);
        validatePage(page);
        return ApiResponse.success(
                slicePage(
                        guestAccommodationReadService.searchAccommodations(
                                region,
                                checkInDate,
                                checkOutDate,
                                guestCount
                        ),
                        page,
                        resolvedPageSize
                )
        );
    }

    @GetMapping("/{accommodationId}")
    public ApiResponse<AccommodationDetailResponse> getAccommodationDetail(
            HttpServletRequest request,
            @PathVariable Long accommodationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOutDate,
            @RequestParam int guestCount
    ) {
        guestPublicReadRateLimitService.assertDetailAllowed(extractClientIp(request));
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
            HttpServletRequest request,
            @PathVariable Long accommodationId,
            @PathVariable Long roomTypeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        guestPublicReadRateLimitService.assertCalendarAllowed(extractClientIp(request));
        return ApiResponse.success(
                guestAccommodationReadService.getRoomTypeCalendar(
                        accommodationId,
                        roomTypeId,
                        startDate,
                        endDate
                )
        );
    }

    private int resolvePageSize(Integer requestedSize) {
        int pageSize = requestedSize == null ? guestPublicReadProperties.getDefaultPageSize() : requestedSize;
        if (pageSize <= 0 || pageSize > guestPublicReadProperties.getMaxPageSize()) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Page size must be between 1 and " + guestPublicReadProperties.getMaxPageSize() + "."
            );
        }
        return pageSize;
    }

    private void validatePage(int page) {
        if (page < 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Page must not be negative.");
        }
    }

    private <T> List<T> slicePage(List<T> items, int page, int pageSize) {
        int fromIndex = Math.min(page * pageSize, items.size());
        int toIndex = Math.min(fromIndex + pageSize, items.size());
        return items.subList(fromIndex, toIndex);
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            int commaIndex = forwardedFor.indexOf(',');
            return commaIndex >= 0
                    ? forwardedFor.substring(0, commaIndex).trim()
                    : forwardedFor.trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }
}
