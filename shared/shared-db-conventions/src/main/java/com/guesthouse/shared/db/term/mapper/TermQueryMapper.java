package com.guesthouse.shared.db.term.mapper;

import com.guesthouse.shared.db.term.model.AdminTermDetailRecord;
import com.guesthouse.shared.db.term.model.AdminTermListRecord;
import com.guesthouse.shared.db.term.model.PublishedRequiredTermRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TermQueryMapper {

    List<PublishedRequiredTermRecord> findPublishedRequiredTerms();

    List<AdminTermListRecord> findTermsForAdminList();

    AdminTermDetailRecord findAdminTermDetailById(@Param("termId") Long termId);

    AdminTermDetailRecord lockAdminTermById(@Param("termId") Long termId);

    List<AdminTermListRecord> lockTermsByCategory(@Param("category") String category);
}
