package com.backtest.util;

public class StockTopicLockUtil {
    public static String getMonitorName(String ticker, String start, String end, String interval) {
        return (ticker + start + end + interval).intern();
    }
}
