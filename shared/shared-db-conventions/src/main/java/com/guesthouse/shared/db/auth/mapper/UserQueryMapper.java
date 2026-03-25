package com.guesthouse.shared.db.auth.mapper;

import com.guesthouse.shared.db.auth.model.UserAuthRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserQueryMapper {

    UserAuthRecord findAuthUserByLoginId(@Param("loginId") String loginId);
}
