package com.backtest.service;

import com.backtest.dto.stock.StockInfo;
import com.backtest.dto.stock.StockTopicRequest;
import com.backtest.dto.stock.StockTopicResponse;
import com.backtest.model.Stock;
import com.backtest.redis.StockRequest;
import com.backtest.repository.StockRepository;
import com.backtest.util.StockTopicLockUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockService {
    private final StockRepository stockRepository;
    private Map<String, List<Stock>> stockLockMap = new HashMap<>();

    public Stock fromStockInfo(String ticker, StockInfo stockInfo) {
        return new Stock(ticker,
                OffsetDateTime.parse(stockInfo.getDate().replace(" ", "T"))
                        .toLocalDateTime(),
                stockInfo.getOpen(),
                stockInfo.getHigh(),
                stockInfo.getLow(),
                stockInfo.getClose(),
                stockInfo.getVolume(),
                stockInfo.getDividends(),
                stockInfo.getStockSplits());
    }

    public List<Stock> saveStockResponse(StockTopicResponse stockTopicResponse) {
        String ticker = stockTopicResponse.getTicker();

        List<Stock> stocks = new ArrayList<>();
        for (StockInfo stockInfo : stockTopicResponse.getData()) {
            Stock stock = fromStockInfo(ticker, stockInfo);
            try {
                stocks.add(stockRepository.saveAndFlush(stock));
            } catch (Exception e) {
                log.error("Error saving stock: {}", stock, e);
            }
        }

        return stocks;
    }

    public Map<String, List<Stock>> getStockLockMap() {
        return stockLockMap;
    }
}
