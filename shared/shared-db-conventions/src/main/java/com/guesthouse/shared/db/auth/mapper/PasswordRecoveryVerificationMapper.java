package com.guesthouse.shared.db.auth.mapper;

import com.guesthouse.shared.db.auth.model.PasswordRecoveryVerificationInsertParam;
import com.guesthouse.shared.db.auth.model.PasswordRecoveryVerificationRecord;
import com.guesthouse.shared.domain.auth.RecoveryVerificationType;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface PasswordRecoveryVerificationMapper {

    void insertVerification(PasswordRecoveryVerificationInsertParam param);

    PasswordRecoveryVerificationRecord findLatestActiveVerification(
            @Param("userId") Long userId,
            @Param("verificationType") RecoveryVerificationType verificationType
    );

    int expireActiveVerifications(
            @Param("userId") Long userId,
            @Param("verificationType") RecoveryVerificationType verificationType,
            @Param("expiredAt") LocalDateTime expiredAt
    );

    int incrementAttemptCount(@Param("verificationId") Long verificationId);

    int markVerified(@Param("verificationId") Long verificationId);

    int markExpired(@Param("verificationId") Long verificationId);

    int markConsumed(
            @Param("verificationId") Long verificationId,
            @Param("consumedAt") LocalDateTime consumedAt
    );
}
