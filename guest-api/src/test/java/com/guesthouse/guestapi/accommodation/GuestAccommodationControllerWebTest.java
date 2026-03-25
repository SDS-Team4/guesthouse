package com.guesthouse.guestapi.accommodation;

import com.guesthouse.guestapi.accommodation.api.AccommodationAvailabilityCategory;
import com.guesthouse.guestapi.accommodation.api.AccommodationDetailResponse;
import com.guesthouse.guestapi.accommodation.api.AccommodationSearchResponse;
import com.guesthouse.guestapi.accommodation.api.RoomTypeAvailabilityResponse;
import com.guesthouse.guestapi.accommodation.api.RoomTypeCalendarDayResponse;
import com.guesthouse.guestapi.accommodation.api.RoomTypeCalendarResponse;
import com.guesthouse.guestapi.accommodation.service.GuestAccommodationReadService;
import com.guesthouse.shared.auth.config.AuthWebMvcConfigurer;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.audit.mapper.AuditLogMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestCommandMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestQueryMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyCommandMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyQueryMapper;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockCommandMapper;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockQueryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationInventoryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.term.mapper.TermQueryMapper;
import com.guesthouse.shared.db.term.mapper.UserTermAgreementCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountQueryMapper;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.web.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = GuestAccommodationController.class)
@Import({GlobalExceptionHandler.class, AuthWebMvcConfigurer.class})
class GuestAccommodationControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GuestAccommodationReadService guestAccommodationReadService;

    @MockBean
    private UserQueryMapper userQueryMapper;

    @MockBean
    private UserLoginSecurityMapper userLoginSecurityMapper;

    @MockBean
    private ReservationInventoryMapper reservationInventoryMapper;

    @MockBean
    private ReservationCommandMapper reservationCommandMapper;

    @MockBean
    private ReservationQueryMapper reservationQueryMapper;

    @MockBean
    private AuditLogMapper auditLogMapper;

    @MockBean
    private RoomBlockQueryMapper roomBlockQueryMapper;

    @MockBean
    private RoomBlockCommandMapper roomBlockCommandMapper;

    @MockBean
    private PricePolicyQueryMapper pricePolicyQueryMapper;

    @MockBean
    private PricePolicyCommandMapper pricePolicyCommandMapper;

    @MockBean
    private UserAccountQueryMapper userAccountQueryMapper;

    @MockBean
    private UserAccountCommandMapper userAccountCommandMapper;

    @MockBean
    private TermQueryMapper termQueryMapper;

    @MockBean
    private UserTermAgreementCommandMapper userTermAgreementCommandMapper;

    @MockBean
    private HostRoleRequestQueryMapper hostRoleRequestQueryMapper;

    @MockBean
    private HostRoleRequestCommandMapper hostRoleRequestCommandMapper;

    @Test
    void searchAccommodationsReturnsClassifiedResultsWithoutLogin() throws Exception {
        when(guestAccommodationReadService.searchAccommodations(
                "SEOUL",
                LocalDate.of(2026, 4, 16),
                LocalDate.of(2026, 4, 18),
                2
        )).thenReturn(List.of(
                new AccommodationSearchResponse(
                        501L,
                        "Seoul Bridge Guesthouse",
                        "SEOUL",
                        AccommodationAvailabilityCategory.AVAILABLE,
                        2,
                        1,
                        BigDecimal.valueOf(80000),
                        BigDecimal.valueOf(80000)
                )
        ));

        mockMvc.perform(
                        get("/api/v1/accommodations/search")
                                .param("region", "SEOUL")
                                .param("checkInDate", "2026-04-16")
                                .param("checkOutDate", "2026-04-18")
                                .param("guestCount", "2")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].accommodationId").value(501))
                .andExpect(jsonPath("$.data[0].availabilityCategory").value("AVAILABLE"));
    }

    @Test
    void accommodationDetailReturnsRoomTypeAvailability() throws Exception {
        when(guestAccommodationReadService.getAccommodationDetail(
                501L,
                LocalDate.of(2026, 4, 16),
                LocalDate.of(2026, 4, 18),
                2
        )).thenReturn(new AccommodationDetailResponse(
                501L,
                "Seoul Bridge Guesthouse",
                "SEOUL",
                "101 Hangang-daero, Seoul",
                "Han river stay",
                LocalTime.of(15, 0),
                LocalTime.of(11, 0),
                AccommodationAvailabilityCategory.AVAILABLE,
                List.of(
                        new RoomTypeAvailabilityResponse(
                                1001L,
                                "Standard Double",
                                2,
                                2,
                                BigDecimal.valueOf(80000),
                                BigDecimal.valueOf(80000),
                                2,
                                1,
                                true,
                                AccommodationAvailabilityCategory.AVAILABLE
                        )
                )
        ));

        mockMvc.perform(
                        get("/api/v1/accommodations/501")
                                .param("checkInDate", "2026-04-16")
                                .param("checkOutDate", "2026-04-18")
                                .param("guestCount", "2")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accommodationName").value("Seoul Bridge Guesthouse"))
                .andExpect(jsonPath("$.data.roomTypes[0].availableRoomCount").value(1));
    }

    @Test
    void roomTypeCalendarAllowsAnonymousBrowse() throws Exception {
        when(guestAccommodationReadService.getRoomTypeCalendar(
                501L,
                1001L,
                LocalDate.of(2026, 4, 16),
                LocalDate.of(2026, 4, 18)
        )).thenReturn(new RoomTypeCalendarResponse(
                501L,
                1001L,
                "Standard Double",
                LocalDate.of(2026, 4, 16),
                LocalDate.of(2026, 4, 18),
                List.of(
                        new RoomTypeCalendarDayResponse(LocalDate.of(2026, 4, 16), 1, false),
                        new RoomTypeCalendarDayResponse(LocalDate.of(2026, 4, 17), 0, true)
                )
        ));

        mockMvc.perform(
                        get("/api/v1/accommodations/501/room-types/1001/calendar")
                                .param("startDate", "2026-04-16")
                                .param("endDate", "2026-04-18")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.days[0].availableRoomCount").value(1));
    }

    @Test
    void roomTypeCalendarReturnsDailyAvailability() throws Exception {
        when(guestAccommodationReadService.getRoomTypeCalendar(
                501L,
                1001L,
                LocalDate.of(2026, 4, 16),
                LocalDate.of(2026, 4, 18)
        )).thenReturn(new RoomTypeCalendarResponse(
                501L,
                1001L,
                "Standard Double",
                LocalDate.of(2026, 4, 16),
                LocalDate.of(2026, 4, 18),
                List.of(
                        new RoomTypeCalendarDayResponse(LocalDate.of(2026, 4, 16), 1, false),
                        new RoomTypeCalendarDayResponse(LocalDate.of(2026, 4, 17), 0, true)
                )
        ));

        mockMvc.perform(
                        get("/api/v1/accommodations/501/room-types/1001/calendar")
                                .param("startDate", "2026-04-16")
                                .param("endDate", "2026-04-18")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.days[0].availableRoomCount").value(1))
                .andExpect(jsonPath("$.data.days[1].soldOut").value(true));
    }
}
