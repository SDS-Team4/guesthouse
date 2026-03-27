package com.guesthouse.shared.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "auth.rate-limit")
public class AuthRateLimitProperties {

    private boolean enabled;
    private LimitPolicy login = new LimitPolicy();
    private LimitPolicy signup = new LimitPolicy();
    private LimitPolicy recoveryRequest = new LimitPolicy();
    private LimitPolicy recoveryVerify = new LimitPolicy();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public LimitPolicy getLogin() {
        return login;
    }

    public void setLogin(LimitPolicy login) {
        this.login = login;
    }

    public LimitPolicy getSignup() {
        return signup;
    }

    public void setSignup(LimitPolicy signup) {
        this.signup = signup;
    }

    public LimitPolicy getRecoveryRequest() {
        return recoveryRequest;
    }

    public void setRecoveryRequest(LimitPolicy recoveryRequest) {
        this.recoveryRequest = recoveryRequest;
    }

    public LimitPolicy getRecoveryVerify() {
        return recoveryVerify;
    }

    public void setRecoveryVerify(LimitPolicy recoveryVerify) {
        this.recoveryVerify = recoveryVerify;
    }

    public static class LimitPolicy {
        private int perIpLimit;
        private long perIpWindowSeconds;
        private int globalLimit;
        private long globalWindowSeconds;

        public int getPerIpLimit() {
            return perIpLimit;
        }

        public void setPerIpLimit(int perIpLimit) {
            this.perIpLimit = perIpLimit;
        }

        public long getPerIpWindowSeconds() {
            return perIpWindowSeconds;
        }

        public void setPerIpWindowSeconds(long perIpWindowSeconds) {
            this.perIpWindowSeconds = perIpWindowSeconds;
        }

        public int getGlobalLimit() {
            return globalLimit;
        }

        public void setGlobalLimit(int globalLimit) {
            this.globalLimit = globalLimit;
        }

        public long getGlobalWindowSeconds() {
            return globalWindowSeconds;
        }

        public void setGlobalWindowSeconds(long globalWindowSeconds) {
            this.globalWindowSeconds = globalWindowSeconds;
        }
    }
}
