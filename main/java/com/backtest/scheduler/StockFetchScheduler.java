package com.backtest.scheduler;

import com.backtest.dto.stock.StockTopicRedisRequest;
import com.backtest.service.StockFetchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class StockFetchScheduler {
    @Autowired
    private StockFetchService stockFetchService;

    private final List<String> symbols = Arrays.asList(
            "SPY", "QQQ", "IWM", "DIA",

            "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "AVGO", "ADBE", "NFLX",

            "JPM", "BAC", "GS", "V", "MA", "PYPL",

            "XOM", "CVX", "CAT", "BA",

            "JNJ", "UNH", "PFE", "PG", "KO", "PEP", "WMT", "COST",

            "GLD", "TLT",

            "SMH"
    );

    @Scheduled(fixedDelay = 1000 * 60 * 60, initialDelay = 1000 * 60)
    public void run() {
        log.info("[START] Stock fetch scheduler");
//        List<StockTopicRedisRequest> requests = symbols.stream().map(
//                s -> {
//                    return new StockTopicRedisRequest(s, null, null, null);
//                }
//        ).toList();
//
//        stockFetchService.getStocks(requests);
        log.info("[FINISH] Stock fetch scheduler");
    }
}
