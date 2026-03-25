package com.guesthouse.opsapi.admin.service;

import com.guesthouse.shared.db.user.mapper.UserAccountQueryMapper;
import com.guesthouse.shared.db.user.model.AdminUserDetailRecord;
import com.guesthouse.shared.db.user.model.AdminUserListRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminUserQueryService {

    private final UserAccountQueryMapper userAccountQueryMapper;

    public AdminUserQueryService(UserAccountQueryMapper userAccountQueryMapper) {
        this.userAccountQueryMapper = userAccountQueryMapper;
    }

    public List<AdminUserListRecord> findUsers() {
        return userAccountQueryMapper.findUsersForAdminList();
    }

    public AdminUserDetailRecord getUserDetail(Long userId) {
        AdminUserDetailRecord detail = userAccountQueryMapper.findAdminUserDetailByUserId(userId);
        if (detail == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "User not found.");
        }
        return detail;
    }
}
