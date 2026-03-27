package com.guesthouse.shared.db.auth.mapper;

import com.guesthouse.shared.db.auth.model.UserAuthRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserQueryMapper {

    UserAuthRecord findAuthUserByLoginId(@Param("loginId") String loginId);

    UserAuthRecord findAuthUserByUserId(@Param("userId") Long userId);

    UserAuthRecord findActiveUserByNameAndEmail(
            @Param("name") String name,
            @Param("email") String email
    );

    UserAuthRecord findActiveUserByNameAndPhone(
            @Param("name") String name,
            @Param("phone") String phone
    );

    UserAuthRecord findActiveUserByLoginIdAndNameAndEmail(
            @Param("loginId") String loginId,
            @Param("name") String name,
            @Param("email") String email
    );

    UserAuthRecord findActiveUserByLoginIdAndNameAndPhone(
            @Param("loginId") String loginId,
            @Param("name") String name,
            @Param("phone") String phone
    );
}
