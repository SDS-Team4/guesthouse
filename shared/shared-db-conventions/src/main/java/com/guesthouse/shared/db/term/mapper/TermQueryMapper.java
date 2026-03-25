package com.guesthouse.shared.db.term.mapper;

import com.guesthouse.shared.db.term.model.PublishedRequiredTermRecord;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface TermQueryMapper {

    List<PublishedRequiredTermRecord> findPublishedRequiredTerms();
}
