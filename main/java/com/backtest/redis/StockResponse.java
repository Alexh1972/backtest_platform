package com.backtest.redis;

import com.backtest.dto.stock.StockTopicResponse;
import com.backtest.model.Stock;
import com.backtest.service.StockService;
import com.backtest.util.StockTopicLockUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class StockResponse implements MessageListener {
    @Autowired
    private final StockService stockService;

    public void onMessage(Message message, byte[] bytes) {
        StockTopicResponse response = StockTopicResponse.fromJson(message.toString());
        List<Stock> stocks = stockService.saveStockResponse(response);

        String monitor = StockTopicLockUtil.getMonitorName(response.getTicker(), response.getStart(), response.getEnd(), response.getInterval());
        synchronized (monitor) {
            stockService.getStockLockMap().put(monitor, stocks);
            monitor.notify();
        }
    }
}
