package com.guesthouse.shared.db.user.mapper;

import com.guesthouse.shared.db.user.model.AdminUserDetailRecord;
import com.guesthouse.shared.db.user.model.AdminUserListRecord;
import com.guesthouse.shared.db.user.model.UserAccountRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserAccountQueryMapper {

    Long findUserIdByLoginId(@Param("loginId") String loginId);

    Long findUserIdByEmail(@Param("email") String email);

    Long findUserIdByPhone(@Param("phone") String phone);

    UserAccountRecord findUserAccountByUserId(@Param("userId") Long userId);

    List<AdminUserListRecord> findUsersForAdminList();

    AdminUserDetailRecord findAdminUserDetailByUserId(@Param("userId") Long userId);
}
