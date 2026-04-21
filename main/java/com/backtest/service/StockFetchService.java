package com.backtest.service;

import com.backtest.dto.stock.StockTopicRedisRequest;
import com.backtest.model.Stock;
import com.backtest.redis.StockRequest;
import com.backtest.redis.StockResponse;
import com.backtest.util.StockTopicLockUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockFetchService {
    @Autowired
    private final StockRequest stockRequest;

    @Autowired
    private final StockService stockService;

    @Autowired
    private StockResponse stockResponse;

    public List<Stock> getStock(StockTopicRedisRequest request) {
        log.info("[START] Request for stock - {}", request);
        stockRequest.publish(request);
        String monitor = StockTopicLockUtil.getMonitorName(request.getTicker(), request.getStart(), request.getEnd(), request.getInterval());

        synchronized (monitor) {
            try {
                monitor.wait(5000);
                log.info("[FINISH] Request for stock - {}", request);
                return stockService.getStockLockMap().remove(monitor);
            } catch (Exception e) {
                log.error("[ERROR] Error while waiting for stock {} response!", request.getTicker(), e);
            }
        }
        return null;
    }

    public Map<String, List<Stock>> getStocksSeq(List<StockTopicRedisRequest> requests) {
        Map<String, List<Stock>> ret = new HashMap<>();

        for (StockTopicRedisRequest request : requests) {
            String monitor = StockTopicLockUtil.getMonitorName(request.getTicker(), request.getStart(), request.getEnd(), request.getInterval());

            stockRequest.publish(request);
        }

        for (StockTopicRedisRequest request : requests) {
            String monitor = StockTopicLockUtil.getMonitorName(request.getTicker(), request.getStart(), request.getEnd(), request.getInterval());

            synchronized (monitor) {
                try {
                    if (!stockService.getStockLockMap().containsKey(monitor)) {
                        monitor.wait();
                    }

                    ret.put(request.getTicker(), stockService.getStockLockMap().remove(monitor));
                } catch (Exception e) {
                    log.error("Error while waiting for stock response!", e);
                }
            }
        }

        return ret;
    }

    public Map<String, List<Stock>> getStocks(List<StockTopicRedisRequest> requests) {
        Map<String, List<Stock>> ret = new HashMap<>();
        try (ExecutorService es = Executors.newFixedThreadPool(20)) {
            for (StockTopicRedisRequest request : requests) {
                es.submit(() -> {
                    ret.put(request.getTicker(), getStock(request));
                });
            }
        }

        return ret;
    }
}
