package com.backtest.util;

import java.util.List;
import java.util.stream.Collectors;

public class StrategyRunTopicLockUtil {
    public static String getMonitorName(List<String> tickers, String start, String end, String file) {
        String sortedTickers = tickers.stream()
                .sorted()
                .collect(Collectors.joining(":"));
        return (sortedTickers + start + end + file).intern();
    }
}
