package com.guesthouse.opsapi.admin.service;

import com.guesthouse.opsapi.admin.api.AdminTermDraftCreateRequest;
import com.guesthouse.opsapi.admin.api.AdminTermUpdateRequest;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.term.mapper.TermCommandMapper;
import com.guesthouse.shared.db.term.mapper.TermQueryMapper;
import com.guesthouse.shared.db.term.model.AdminTermDetailRecord;
import com.guesthouse.shared.db.term.model.AdminTermListRecord;
import com.guesthouse.shared.db.term.model.TermInsertParam;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminTermCommandServiceTest {

    @Mock
    private TermQueryMapper termQueryMapper;

    @Mock
    private TermCommandMapper termCommandMapper;

    @Mock
    private AdminTermAuditService adminTermAuditService;

    private AdminTermCommandService adminTermCommandService;

    @BeforeEach
    void setUp() {
        adminTermCommandService = new AdminTermCommandService(
                termQueryMapper,
                termCommandMapper,
                adminTermAuditService,
                Clock.fixed(Instant.parse("2026-03-27T01:00:00Z"), ZoneId.of("Asia/Seoul"))
        );
    }

    @Test
    void createDraftCopiesSelectedTermIntoNewDraft() {
        when(termQueryMapper.lockAdminTermById(1301L)).thenReturn(publishedServiceTerm());
        doAnswer(invocation -> {
            TermInsertParam insertParam = invocation.getArgument(0);
            insertParam.setTermId(1401L);
            return null;
        }).when(termCommandMapper).insertTerm(any(TermInsertParam.class));

        AdminTermMutationResult result = adminTermCommandService.createDraft(
                1301L,
                new AdminTermDraftCreateRequest("1.1"),
                adminActor()
        );

        ArgumentCaptor<TermInsertParam> captor = ArgumentCaptor.forClass(TermInsertParam.class);
        verify(termCommandMapper).insertTerm(captor.capture());
        assertEquals("SERVICE", captor.getValue().getCategory());
        assertEquals("1.1", captor.getValue().getVersion());
        assertEquals("DRAFT", captor.getValue().getStatus());
        assertEquals("DRAFT", result.status());
        verify(adminTermAuditService).writeTermAudit(any(), eq(1401L), eq("TERM_DRAFT_CREATED"), any(), any(), any(), any());
    }

    @Test
    void updateDraftRejectsPublishedTerm() {
        when(termQueryMapper.lockAdminTermById(1301L)).thenReturn(publishedServiceTerm());

        AppException exception = assertThrows(
                AppException.class,
                () -> adminTermCommandService.updateDraft(
                        1301L,
                        new AdminTermUpdateRequest(
                                "서비스 이용약관",
                                "본문",
                                "1.1",
                                true,
                                LocalDateTime.of(2026, 3, 27, 0, 0)
                        ),
                        adminActor()
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
    }

    @Test
    void publishTermArchivesCurrentPublishedVersionAndPublishesDraft() {
        AdminTermDetailRecord draft = draftServiceTerm();
        when(termQueryMapper.lockAdminTermById(1401L)).thenReturn(draft);
        when(termQueryMapper.lockTermsByCategory("SERVICE")).thenReturn(List.of(publishedServiceTermList(), draftServiceTermList()));
        when(termCommandMapper.publishTerm(eq(1401L), any())).thenReturn(1);
        when(termQueryMapper.findAdminTermDetailById(1401L)).thenReturn(publishedDraftAfterPublish());

        AdminTermMutationResult result = adminTermCommandService.publishTerm(1401L, adminActor());

        verify(termCommandMapper).archivePublishedTermsByCategory(eq("SERVICE"), any());
        verify(termCommandMapper).publishTerm(eq(1401L), any());
        verify(adminTermAuditService).writeTermAudit(any(), eq(1401L), eq("TERM_PUBLISHED"), any(), any(), any(), any());
        assertEquals("PUBLISHED", result.status());
        assertEquals("1.1", result.version());
    }

    private AdminTermDetailRecord publishedServiceTerm() {
        AdminTermDetailRecord record = new AdminTermDetailRecord();
        record.setTermId(1301L);
        record.setCategory("SERVICE");
        record.setTitle("서비스 이용약관");
        record.setContent("게스트하우스 예약 서비스 이용약관 v1.0");
        record.setVersion("1.0");
        record.setRequired(true);
        record.setStatus("PUBLISHED");
        record.setEffectiveAt(LocalDateTime.of(2026, 3, 1, 0, 0));
        record.setCreatedAt(LocalDateTime.of(2026, 3, 1, 0, 0));
        record.setUpdatedAt(LocalDateTime.of(2026, 3, 1, 0, 0));
        return record;
    }

    private AdminTermDetailRecord draftServiceTerm() {
        AdminTermDetailRecord record = new AdminTermDetailRecord();
        record.setTermId(1401L);
        record.setCategory("SERVICE");
        record.setTitle("서비스 이용약관");
        record.setContent("게스트하우스 예약 서비스 이용약관 v1.1");
        record.setVersion("1.1");
        record.setRequired(true);
        record.setStatus("DRAFT");
        record.setEffectiveAt(LocalDateTime.of(2026, 3, 27, 0, 0));
        record.setCreatedAt(LocalDateTime.of(2026, 3, 27, 10, 0));
        record.setUpdatedAt(LocalDateTime.of(2026, 3, 27, 10, 0));
        return record;
    }

    private AdminTermDetailRecord publishedDraftAfterPublish() {
        AdminTermDetailRecord record = draftServiceTerm();
        record.setStatus("PUBLISHED");
        return record;
    }

    private AdminTermListRecord publishedServiceTermList() {
        AdminTermListRecord record = new AdminTermListRecord();
        record.setTermId(1301L);
        record.setCategory("SERVICE");
        record.setTitle("서비스 이용약관");
        record.setVersion("1.0");
        record.setRequired(true);
        record.setStatus("PUBLISHED");
        record.setEffectiveAt(LocalDateTime.of(2026, 3, 1, 0, 0));
        record.setUpdatedAt(LocalDateTime.of(2026, 3, 1, 0, 0));
        return record;
    }

    private AdminTermListRecord draftServiceTermList() {
        AdminTermListRecord record = new AdminTermListRecord();
        record.setTermId(1401L);
        record.setCategory("SERVICE");
        record.setTitle("서비스 이용약관");
        record.setVersion("1.1");
        record.setRequired(true);
        record.setStatus("DRAFT");
        record.setEffectiveAt(LocalDateTime.of(2026, 3, 27, 0, 0));
        record.setUpdatedAt(LocalDateTime.of(2026, 3, 27, 10, 0));
        return record;
    }

    private SessionUser adminActor() {
        return new SessionUser(103L, "admin.demo", "Admin Demo", UserRole.ADMIN);
    }
}
