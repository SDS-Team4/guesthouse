package com.guesthouse.shared.db.auth.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface UserLoginSecurityMapper {

    void insertIfAbsent(@Param("userId") Long userId);

    void registerFailedLogin(
            @Param("userId") Long userId,
            @Param("failedLoginCount") int failedLoginCount,
            @Param("failedAt") LocalDateTime failedAt,
            @Param("lockedUntil") LocalDateTime lockedUntil
    );

    void registerSuccessfulLogin(@Param("userId") Long userId, @Param("loginAt") LocalDateTime loginAt);

    int markPasswordChanged(@Param("userId") Long userId, @Param("changedAt") LocalDateTime changedAt);
}
