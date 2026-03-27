package com.guesthouse.shared.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "auth.rate-limit")
public class AuthRateLimitProperties {

    private boolean enabled = true;
    private final Rule login = new Rule(30, 300, 300, 60);
    private final Rule signup = new Rule(5, 600, 30, 60);
    private final Rule recoveryRequest = new Rule(5, 600, 30, 60);
    private final Rule recoveryVerify = new Rule(10, 600, 60, 60);

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Rule getLogin() {
        return login;
    }

    public Rule getSignup() {
        return signup;
    }

    public Rule getRecoveryRequest() {
        return recoveryRequest;
    }

    public Rule getRecoveryVerify() {
        return recoveryVerify;
    }

    public static class Rule {
        private int perIpLimit;
        private long perIpWindowSeconds;
        private int globalLimit;
        private long globalWindowSeconds;

        public Rule() {
        }

        public Rule(int perIpLimit, long perIpWindowSeconds, int globalLimit, long globalWindowSeconds) {
            this.perIpLimit = perIpLimit;
            this.perIpWindowSeconds = perIpWindowSeconds;
            this.globalLimit = globalLimit;
            this.globalWindowSeconds = globalWindowSeconds;
        }

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
