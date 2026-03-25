package com.guesthouse.shared.db.auth.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface UserLoginSecurityMapper {

    void insertIfAbsent(@Param("userId") Long userId);

    void registerFailedLogin(@Param("userId") Long userId, @Param("failedAt") LocalDateTime failedAt);

    void registerSuccessfulLogin(@Param("userId") Long userId, @Param("loginAt") LocalDateTime loginAt);
}
