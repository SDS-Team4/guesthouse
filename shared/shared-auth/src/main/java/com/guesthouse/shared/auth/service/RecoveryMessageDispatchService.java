package com.guesthouse.shared.auth.service;

import com.guesthouse.shared.domain.auth.RecoveryChannel;
import com.guesthouse.shared.domain.auth.RecoveryVerificationType;

public interface RecoveryMessageDispatchService {

    void sendCode(
            RecoveryVerificationType verificationType,
            RecoveryChannel channel,
            String destination,
            String verificationCode
    );
}
