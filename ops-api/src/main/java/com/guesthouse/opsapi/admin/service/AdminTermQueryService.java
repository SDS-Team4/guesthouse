package com.guesthouse.opsapi.admin.service;

import com.guesthouse.shared.db.term.mapper.TermQueryMapper;
import com.guesthouse.shared.db.term.model.AdminTermDetailRecord;
import com.guesthouse.shared.db.term.model.AdminTermListRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminTermQueryService {

    private final TermQueryMapper termQueryMapper;

    public AdminTermQueryService(TermQueryMapper termQueryMapper) {
        this.termQueryMapper = termQueryMapper;
    }

    public List<AdminTermListRecord> findTerms() {
        return termQueryMapper.findTermsForAdminList();
    }

    public AdminTermDetailRecord getTermDetail(Long termId) {
        AdminTermDetailRecord detail = termQueryMapper.findAdminTermDetailById(termId);
        if (detail == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Term not found.");
        }
        return detail;
    }
}
