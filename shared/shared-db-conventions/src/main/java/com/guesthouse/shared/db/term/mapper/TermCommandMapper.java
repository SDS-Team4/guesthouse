package com.guesthouse.shared.db.term.mapper;

import com.guesthouse.shared.db.term.model.TermInsertParam;
import com.guesthouse.shared.db.term.model.TermUpdateParam;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface TermCommandMapper {

    void insertTerm(TermInsertParam termInsertParam);

    int updateDraftTerm(TermUpdateParam termUpdateParam);

    int archivePublishedTermsByCategory(
            @Param("category") String category,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    int publishTerm(
            @Param("termId") Long termId,
            @Param("updatedAt") LocalDateTime updatedAt
    );
}
