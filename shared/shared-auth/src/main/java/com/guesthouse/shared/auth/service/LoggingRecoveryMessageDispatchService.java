package com.guesthouse.shared.auth.service;

import com.guesthouse.shared.domain.auth.RecoveryChannel;
import com.guesthouse.shared.domain.auth.RecoveryVerificationType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class LoggingRecoveryMessageDispatchService implements RecoveryMessageDispatchService {

    private static final Logger log = LoggerFactory.getLogger(LoggingRecoveryMessageDispatchService.class);

    private final Environment environment;

    public LoggingRecoveryMessageDispatchService(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void sendCode(
            RecoveryVerificationType verificationType,
            RecoveryChannel channel,
            String destination,
            String verificationCode
    ) {
        if (isProductionProfile()) {
            log.info("Recovery verification prepared. type={} channel={} destination={}", verificationType, channel, destination);
            return;
        }

        log.info(
                "Recovery verification prepared. type={} channel={} destination={} code={}",
                verificationType,
                channel,
                destination,
                verificationCode
        );
    }

    private boolean isProductionProfile() {
        for (String activeProfile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(activeProfile) || "production".equalsIgnoreCase(activeProfile)) {
                return true;
            }
        }
        return false;
    }
}
