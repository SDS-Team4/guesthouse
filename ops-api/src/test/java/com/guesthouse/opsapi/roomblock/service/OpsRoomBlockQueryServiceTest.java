package com.guesthouse.opsapi.roomblock.service;

import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockQueryMapper;
import com.guesthouse.shared.db.roomblock.model.OpsAccommodationOptionRecord;
import com.guesthouse.shared.db.roomblock.model.OpsRoomBlockRecord;
import com.guesthouse.shared.db.roomblock.model.OpsRoomOptionRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OpsRoomBlockQueryServiceTest {

    @Mock
    private RoomBlockQueryMapper roomBlockQueryMapper;

    private OpsRoomBlockQueryService opsRoomBlockQueryService;

    @BeforeEach
    void setUp() {
        opsRoomBlockQueryService = new OpsRoomBlockQueryService(roomBlockQueryMapper);
    }

    @Test
    void managementViewDefaultsToFirstAccessibleAccommodation() {
        OpsAccommodationOptionRecord accommodation = accommodation();
        OpsRoomOptionRecord room = room();
        OpsRoomBlockRecord block = block();
        when(roomBlockQueryMapper.findAccessibleAccommodations(102L, false)).thenReturn(List.of(accommodation));
        when(roomBlockQueryMapper.findActiveRoomsByAccommodationId(501L)).thenReturn(List.of(room));
        when(roomBlockQueryMapper.findRoomBlocks(102L, false, 501L, null)).thenReturn(List.of(block));

        OpsRoomBlockManagementView view = opsRoomBlockQueryService.getRoomBlockManagementView(
                new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST),
                null,
                null
        );

        assertEquals(501L, view.selectedAccommodationId());
        assertEquals(1, view.blocks().size());
        assertEquals(801L, view.blocks().get(0).getBlockId());
    }

    @Test
    void managementViewRejectsInaccessibleAccommodation() {
        when(roomBlockQueryMapper.findAccessibleAccommodations(102L, false)).thenReturn(List.of(accommodation()));

        AppException exception = assertThrows(
                AppException.class,
                () -> opsRoomBlockQueryService.getRoomBlockManagementView(
                        new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST),
                        999L,
                        null
                )
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    private OpsAccommodationOptionRecord accommodation() {
        OpsAccommodationOptionRecord record = new OpsAccommodationOptionRecord();
        record.setAccommodationId(501L);
        record.setAccommodationName("Seoul Bridge Guesthouse");
        record.setRegion("SEOUL");
        return record;
    }

    private OpsRoomOptionRecord room() {
        OpsRoomOptionRecord record = new OpsRoomOptionRecord();
        record.setRoomId(2002L);
        record.setAccommodationId(501L);
        record.setRoomTypeId(1001L);
        record.setRoomTypeName("Standard Double");
        record.setRoomCode("S102");
        return record;
    }

    private OpsRoomBlockRecord block() {
        OpsRoomBlockRecord record = new OpsRoomBlockRecord();
        record.setBlockId(801L);
        record.setAccommodationId(501L);
        record.setAccommodationName("Seoul Bridge Guesthouse");
        record.setRoomId(2002L);
        record.setRoomCode("S102");
        record.setRoomTypeId(1001L);
        record.setRoomTypeName("Standard Double");
        record.setStartDate(LocalDate.of(2026, 4, 16));
        record.setEndDate(LocalDate.of(2026, 4, 17));
        record.setReasonType("MAINTENANCE");
        record.setStatus("ACTIVE");
        return record;
    }
}
