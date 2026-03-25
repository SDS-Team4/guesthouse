package com.guesthouse.shared.db.term.mapper;

import com.guesthouse.shared.db.term.model.UserTermAgreementInsertParam;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserTermAgreementCommandMapper {

    void insertUserTermAgreements(@Param("agreements") List<UserTermAgreementInsertParam> agreements);
}
