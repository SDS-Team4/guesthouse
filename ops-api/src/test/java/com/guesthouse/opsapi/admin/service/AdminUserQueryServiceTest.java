package com.guesthouse.opsapi.admin.service;

import com.guesthouse.shared.db.user.mapper.UserAccountQueryMapper;
import com.guesthouse.shared.db.user.model.AdminUserDetailRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserQueryServiceTest {

    @Mock
    private UserAccountQueryMapper userAccountQueryMapper;

    private AdminUserQueryService adminUserQueryService;

    @BeforeEach
    void setUp() {
        adminUserQueryService = new AdminUserQueryService(userAccountQueryMapper);
    }

    @Test
    void userDetailRejectsMissingUser() {
        when(userAccountQueryMapper.findAdminUserDetailByUserId(999L)).thenReturn(null);

        AppException exception = assertThrows(
                AppException.class,
                () -> adminUserQueryService.getUserDetail(999L)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals(ErrorCode.NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void userDetailReturnsRecord() {
        AdminUserDetailRecord record = new AdminUserDetailRecord();
        record.setUserId(103L);
        record.setLoginId("admin.demo");
        when(userAccountQueryMapper.findAdminUserDetailByUserId(103L)).thenReturn(record);

        assertEquals("admin.demo", adminUserQueryService.getUserDetail(103L).getLoginId());
    }
}
