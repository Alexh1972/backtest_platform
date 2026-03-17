package com.backtest.model;

public enum Interval {
    ONE_DAY("1d", 1000 * 60 * 60 * 24L),
    FIVE_MINUTES("5m", 1000 * 60 * 5L),
    TEN_MINUTES("10m", 1000 * 60 * 10L),
    FIFTEEN_MINUTES("15m", 1000 * 60 * 10L);

    final String value;
    final Long seconds;

    Interval(String value, Long seconds) {
        this.value = value;
        this.seconds = seconds;
    }

    public static Interval getInterval(String value) {
        for (Interval i : Interval.values()) {
            if (value.toLowerCase().equals(i.value.toLowerCase())) {
                return i;
            }
        }

        return null;
    }

    public static boolean isLess(String value, Long seconds) {
        for (Interval i : Interval.values()) {
            if (value.toLowerCase().equals(i.value.toLowerCase())) {
                return i.seconds.compareTo(seconds) < 0;
            }
        }

        return false;
    }
}
