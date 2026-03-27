package com.guesthouse.guestapi.accommodation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "guest.public-read")
public class GuestPublicReadProperties {

    private int defaultPageSize = 20;
    private int maxPageSize = 50;
    private int searchCacheTtlSeconds = 15;
    private int detailCacheTtlSeconds = 30;
    private int calendarCacheTtlSeconds = 15;
    private final RateLimitRule search = new RateLimitRule(120, 60, 2000, 60);
    private final RateLimitRule detail = new RateLimitRule(180, 60, 3000, 60);
    private final RateLimitRule calendar = new RateLimitRule(180, 60, 3000, 60);

    public int getDefaultPageSize() {
        return defaultPageSize;
    }

    public void setDefaultPageSize(int defaultPageSize) {
        this.defaultPageSize = defaultPageSize;
    }

    public int getMaxPageSize() {
        return maxPageSize;
    }

    public void setMaxPageSize(int maxPageSize) {
        this.maxPageSize = maxPageSize;
    }

    public int getSearchCacheTtlSeconds() {
        return searchCacheTtlSeconds;
    }

    public void setSearchCacheTtlSeconds(int searchCacheTtlSeconds) {
        this.searchCacheTtlSeconds = searchCacheTtlSeconds;
    }

    public int getDetailCacheTtlSeconds() {
        return detailCacheTtlSeconds;
    }

    public void setDetailCacheTtlSeconds(int detailCacheTtlSeconds) {
        this.detailCacheTtlSeconds = detailCacheTtlSeconds;
    }

    public int getCalendarCacheTtlSeconds() {
        return calendarCacheTtlSeconds;
    }

    public void setCalendarCacheTtlSeconds(int calendarCacheTtlSeconds) {
        this.calendarCacheTtlSeconds = calendarCacheTtlSeconds;
    }

    public RateLimitRule getSearch() {
        return search;
    }

    public RateLimitRule getDetail() {
        return detail;
    }

    public RateLimitRule getCalendar() {
        return calendar;
    }

    public static class RateLimitRule {
        private int perIpLimit;
        private long perIpWindowSeconds;
        private int globalLimit;
        private long globalWindowSeconds;

        public RateLimitRule() {
        }

        public RateLimitRule(int perIpLimit, long perIpWindowSeconds, int globalLimit, long globalWindowSeconds) {
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
