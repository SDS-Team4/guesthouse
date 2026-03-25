package com.guesthouse.shared.db.user.mapper;

import com.guesthouse.shared.db.user.model.UserInsertParam;
import com.guesthouse.shared.domain.user.UserRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface UserAccountCommandMapper {

    void insertUser(UserInsertParam userInsertParam);

    int promoteUserToHost(
            @Param("userId") Long userId,
            @Param("expectedRole") UserRole expectedRole,
            @Param("updatedAt") LocalDateTime updatedAt
    );
}
