package com.backtest.scheduler;

import com.backtest.dto.TickerDate;
import com.backtest.dto.stock.StockTopicRedisRequest;
import com.backtest.repository.StockRepository;
import com.backtest.service.StockFetchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cglib.core.Local;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class StockFetchScheduler {
    @Autowired
    private StockFetchService stockFetchService;

    @Autowired
    private StockRepository stockRepository;

    private final List<String> symbols = Arrays.asList(
            "SPY", "QQQ", "IWM", "DIA",

            "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "AVGO", "ADBE", "NFLX",

            "JPM", "BAC", "GS", "V", "MA", "PYPL",

            "XOM", "CVX", "CAT", "BA",

            "JNJ", "UNH", "PFE", "PG", "KO", "PEP", "WMT", "COST",

            "GLD", "TLT",

            "SMH"
    );

    public Map<String, LocalDateTime> getLastDates() {
        return stockRepository.getLastDates().stream().collect(Collectors.toMap(TickerDate::getTicker, TickerDate::getMaxDate));
    }

    @Scheduled(fixedDelay = 1000 * 60 * 60, initialDelay = 1000 * 60)
    public void run() {
        log.info("[START] Stock fetch scheduler");

//        Map<String, LocalDateTime> lastDateMap = getLastDates();
//        List<StockTopicRedisRequest> requests = symbols.stream().map(
//                s -> {
//                    return new StockTopicRedisRequest(s,
//                            lastDateMap.get(s).atZone(ZoneId.of("UTC")).
//                                    withZoneSameInstant(ZoneId.systemDefault()).toOffsetDateTime()
//                                    .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME), null, null);
//                }
//        ).toList();
//
//        stockFetchService.getStocks(requests);
        log.info("[FINISH] Stock fetch scheduler");
    }
}
