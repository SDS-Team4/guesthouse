package com.guesthouse.opsapi.roomblock.service;

import com.guesthouse.opsapi.roomblock.api.CreateRoomBlockRequest;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockCommandMapper;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockQueryMapper;
import com.guesthouse.shared.db.roomblock.model.OpsRoomBlockMutationTargetRecord;
import com.guesthouse.shared.db.roomblock.model.OpsRoomTargetRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OpsRoomBlockCommandServiceTest {

    @Mock
    private RoomBlockQueryMapper roomBlockQueryMapper;

    @Mock
    private RoomBlockCommandMapper roomBlockCommandMapper;

    @Mock
    private OpsRoomBlockAuditService opsRoomBlockAuditService;

    private OpsRoomBlockCommandService opsRoomBlockCommandService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(Instant.parse("2026-03-25T01:00:00Z"), ZoneId.of("Asia/Seoul"));
        opsRoomBlockCommandService = new OpsRoomBlockCommandService(
                roomBlockQueryMapper,
                roomBlockCommandMapper,
                opsRoomBlockAuditService,
                fixedClock
        );
    }

    @Test
    void createRoomBlockAllowsValidHostBlock() {
        when(roomBlockQueryMapper.lockRoomTarget(2002L)).thenReturn(activeRoomTarget());
        when(roomBlockQueryMapper.findOverlappingActiveBlockId(
                2002L,
                LocalDate.of(2026, 4, 16),
                LocalDate.of(2026, 4, 17)
        )).thenReturn(null);
        doAnswer(invocation -> {
            com.guesthouse.shared.db.roomblock.model.RoomBlockInsertParam param = invocation.getArgument(0);
            param.setBlockId(801L);
            return null;
        }).when(roomBlockCommandMapper).insertRoomBlock(any());

        RoomBlockMutationResult result = opsRoomBlockCommandService.createRoomBlock(
                new CreateRoomBlockRequest(
                        2002L,
                        LocalDate.of(2026, 4, 16),
                        LocalDate.of(2026, 4, 17),
                        "MAINTENANCE",
                        "Boiler issue"
                ),
                hostActor()
        );

        assertEquals(801L, result.blockId());
        assertEquals("ACTIVE", result.status());
        verify(roomBlockCommandMapper).insertRoomBlock(any());
        verify(opsRoomBlockAuditService).writeRoomBlockAudit(
                any(SessionUser.class),
                eq(801L),
                eq("ROOM_BLOCK_CREATED"),
                eq("MAINTENANCE"),
                eq("Boiler issue"),
                eq(null),
                any(),
                eq(LocalDateTime.of(2026, 3, 25, 10, 0))
        );
    }

    @Test
    void createRoomBlockRejectsOverlap() {
        when(roomBlockQueryMapper.lockRoomTarget(2002L)).thenReturn(activeRoomTarget());
        when(roomBlockQueryMapper.findOverlappingActiveBlockId(
                2002L,
                LocalDate.of(2026, 4, 16),
                LocalDate.of(2026, 4, 17)
        )).thenReturn(700L);

        AppException exception = assertThrows(
                AppException.class,
                () -> opsRoomBlockCommandService.createRoomBlock(
                        new CreateRoomBlockRequest(
                                2002L,
                                LocalDate.of(2026, 4, 16),
                                LocalDate.of(2026, 4, 17),
                                "MAINTENANCE",
                                null
                        ),
                        hostActor()
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(ErrorCode.INVALID_REQUEST, exception.getErrorCode());
        verify(roomBlockCommandMapper, never()).insertRoomBlock(any());
    }

    @Test
    void createRoomBlockRejectsInactiveRoom() {
        OpsRoomTargetRecord target = activeRoomTarget();
        target.setRoomStatus("INACTIVE");
        when(roomBlockQueryMapper.lockRoomTarget(2002L)).thenReturn(target);

        AppException exception = assertThrows(
                AppException.class,
                () -> opsRoomBlockCommandService.createRoomBlock(
                        new CreateRoomBlockRequest(
                                2002L,
                                LocalDate.of(2026, 4, 16),
                                LocalDate.of(2026, 4, 17),
                                "MAINTENANCE",
                                null
                        ),
                        hostActor()
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(roomBlockCommandMapper, never()).insertRoomBlock(any());
    }

    @Test
    void deactivateRoomBlockMarksInactive() {
        when(roomBlockQueryMapper.lockRoomBlockTarget(801L)).thenReturn(activeBlockTarget());
        when(roomBlockCommandMapper.markRoomBlockInactive(801L, LocalDateTime.of(2026, 3, 25, 10, 0)))
                .thenReturn(1);

        RoomBlockMutationResult result = opsRoomBlockCommandService.deactivateRoomBlock(801L, adminActor());

        assertEquals("INACTIVE", result.status());
        verify(opsRoomBlockAuditService).writeRoomBlockAudit(
                any(SessionUser.class),
                eq(801L),
                eq("ROOM_BLOCK_DEACTIVATED"),
                eq("MAINTENANCE"),
                eq("Boiler issue"),
                any(),
                any(),
                eq(LocalDateTime.of(2026, 3, 25, 10, 0))
        );
    }

    private OpsRoomTargetRecord activeRoomTarget() {
        OpsRoomTargetRecord target = new OpsRoomTargetRecord();
        target.setRoomId(2002L);
        target.setAccommodationId(501L);
        target.setAccommodationName("Seoul Bridge Guesthouse");
        target.setRoomTypeId(1001L);
        target.setRoomTypeName("Standard Double");
        target.setRoomCode("S102");
        target.setRoomStatus("ACTIVE");
        target.setHostUserId(102L);
        return target;
    }

    private OpsRoomBlockMutationTargetRecord activeBlockTarget() {
        OpsRoomBlockMutationTargetRecord target = new OpsRoomBlockMutationTargetRecord();
        target.setBlockId(801L);
        target.setRoomId(2002L);
        target.setRoomCode("S102");
        target.setAccommodationId(501L);
        target.setAccommodationName("Seoul Bridge Guesthouse");
        target.setHostUserId(102L);
        target.setStatus("ACTIVE");
        target.setStartDate(LocalDate.of(2026, 4, 16));
        target.setEndDate(LocalDate.of(2026, 4, 17));
        target.setReasonType("MAINTENANCE");
        target.setReasonText("Boiler issue");
        return target;
    }

    private SessionUser hostActor() {
        return new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST);
    }

    private SessionUser adminActor() {
        return new SessionUser(103L, "admin.demo", "Admin Demo", UserRole.ADMIN);
    }
}
