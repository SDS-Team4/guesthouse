package com.guesthouse.opsapi.admin.service;

import com.guesthouse.opsapi.admin.api.AdminTermDraftCreateRequest;
import com.guesthouse.opsapi.admin.api.AdminTermUpdateRequest;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.term.mapper.TermCommandMapper;
import com.guesthouse.shared.db.term.mapper.TermQueryMapper;
import com.guesthouse.shared.db.term.model.AdminTermDetailRecord;
import com.guesthouse.shared.db.term.model.AdminTermListRecord;
import com.guesthouse.shared.db.term.model.TermInsertParam;
import com.guesthouse.shared.db.term.model.TermUpdateParam;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminTermCommandService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    private final TermQueryMapper termQueryMapper;
    private final TermCommandMapper termCommandMapper;
    private final AdminTermAuditService adminTermAuditService;
    private final Clock clock;

    public AdminTermCommandService(
            TermQueryMapper termQueryMapper,
            TermCommandMapper termCommandMapper,
            AdminTermAuditService adminTermAuditService,
            Clock clock
    ) {
        this.termQueryMapper = termQueryMapper;
        this.termCommandMapper = termCommandMapper;
        this.adminTermAuditService = adminTermAuditService;
        this.clock = clock;
    }

    @Transactional
    public AdminTermMutationResult createDraft(
            Long sourceTermId,
            AdminTermDraftCreateRequest request,
            SessionUser actor
    ) {
        AdminTermDetailRecord source = lockTerm(sourceTermId);
        LocalDateTime now = LocalDateTime.now(clock);
        String normalizedVersion = normalizeRequired(request.version(), "Draft version is required.");

        TermInsertParam insertParam = new TermInsertParam();
        insertParam.setCategory(source.getCategory());
        insertParam.setTitle(source.getTitle());
        insertParam.setContent(source.getContent());
        insertParam.setVersion(normalizedVersion);
        insertParam.setRequired(source.isRequired());
        insertParam.setStatus("DRAFT");
        insertParam.setEffectiveAt(source.getEffectiveAt());
        insertParam.setCreatedAt(now);
        insertParam.setUpdatedAt(now);

        try {
            termCommandMapper.insertTerm(insertParam);
        } catch (DuplicateKeyException duplicateKeyException) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "The selected category already has that version."
            );
        }

        adminTermAuditService.writeTermAudit(
                actor,
                insertParam.getTermId(),
                "TERM_DRAFT_CREATED",
                "Draft copied from an existing term version.",
                buildAuditState(source),
                buildAuditState(insertParam),
                now
        );

        return toMutationResult(insertParam, now, "DRAFT");
    }

    @Transactional
    public AdminTermMutationResult updateDraft(
            Long termId,
            AdminTermUpdateRequest request,
            SessionUser actor
    ) {
        AdminTermDetailRecord target = lockTerm(termId);
        if (!"DRAFT".equals(target.getStatus())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Only draft terms can be edited."
            );
        }

        LocalDateTime now = LocalDateTime.now(clock);
        TermUpdateParam updateParam = new TermUpdateParam();
        updateParam.setTermId(termId);
        updateParam.setTitle(normalizeRequired(request.title(), "Title is required."));
        updateParam.setContent(normalizeRequired(request.content(), "Content is required."));
        updateParam.setVersion(normalizeRequired(request.version(), "Version is required."));
        updateParam.setRequired(request.required());
        updateParam.setEffectiveAt(request.effectiveAt());
        updateParam.setUpdatedAt(now);

        try {
            int updatedRows = termCommandMapper.updateDraftTerm(updateParam);
            if (updatedRows != 1) {
                throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Term not found.");
            }
        } catch (DuplicateKeyException duplicateKeyException) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "The selected category already has that version."
            );
        }

        AdminTermDetailRecord after = termQueryMapper.findAdminTermDetailById(termId);
        adminTermAuditService.writeTermAudit(
                actor,
                termId,
                "TERM_DRAFT_UPDATED",
                "Draft term updated by admin.",
                buildAuditState(target),
                buildAuditState(after),
                now
        );

        return toMutationResult(after, now);
    }

    @Transactional
    public AdminTermMutationResult publishTerm(Long termId, SessionUser actor) {
        AdminTermDetailRecord target = lockTerm(termId);
        if (!"DRAFT".equals(target.getStatus())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Only draft terms can be published."
            );
        }

        LocalDateTime now = LocalDateTime.now(clock);
        List<AdminTermListRecord> categoryTerms = termQueryMapper.lockTermsByCategory(target.getCategory());
        boolean hasPublishedTerm = categoryTerms.stream().anyMatch(term -> "PUBLISHED".equals(term.getStatus()));

        termCommandMapper.archivePublishedTermsByCategory(target.getCategory(), now);
        int publishedRows = termCommandMapper.publishTerm(termId, now);
        if (publishedRows != 1) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Only draft terms can be published."
            );
        }

        AdminTermDetailRecord after = termQueryMapper.findAdminTermDetailById(termId);
        adminTermAuditService.writeTermAudit(
                actor,
                termId,
                "TERM_PUBLISHED",
                hasPublishedTerm ? "Draft term published and previous published version archived." : "Draft term published.",
                buildAuditState(target),
                buildAuditState(after),
                now
        );

        return toMutationResult(after, now);
    }

    private AdminTermDetailRecord lockTerm(Long termId) {
        AdminTermDetailRecord target = termQueryMapper.lockAdminTermById(termId);
        if (target == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Term not found.");
        }
        return target;
    }

    private AdminTermMutationResult toMutationResult(TermInsertParam insertParam, LocalDateTime now, String status) {
        return new AdminTermMutationResult(
                insertParam.getTermId(),
                insertParam.getCategory(),
                insertParam.getTitle(),
                insertParam.getContent(),
                insertParam.getVersion(),
                insertParam.isRequired(),
                status,
                insertParam.getEffectiveAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    private AdminTermMutationResult toMutationResult(AdminTermDetailRecord record, LocalDateTime now) {
        return new AdminTermMutationResult(
                record.getTermId(),
                record.getCategory(),
                record.getTitle(),
                record.getContent(),
                record.getVersion(),
                record.isRequired(),
                record.getStatus(),
                record.getEffectiveAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    private Map<String, Object> buildAuditState(AdminTermDetailRecord record) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("termId", record.getTermId());
        state.put("category", record.getCategory());
        state.put("title", record.getTitle());
        state.put("version", record.getVersion());
        state.put("required", record.isRequired());
        state.put("status", record.getStatus());
        state.put("effectiveAt", record.getEffectiveAt());
        return state;
    }

    private Map<String, Object> buildAuditState(TermInsertParam record) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("termId", record.getTermId());
        state.put("category", record.getCategory());
        state.put("title", record.getTitle());
        state.put("version", record.getVersion());
        state.put("required", record.isRequired());
        state.put("status", record.getStatus());
        state.put("effectiveAt", record.getEffectiveAt());
        return state;
    }

    private String normalizeRequired(String value, String message) {
        if (value == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, message);
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }
}
