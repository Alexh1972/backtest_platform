package com.backtest.redis;

import com.backtest.dto.stock.StockTopicRedisResponse;
import com.backtest.dto.strategy.StrategyRunRedisResponse;
import com.backtest.model.Stock;
import com.backtest.model.StrategyReport;
import com.backtest.service.StockService;
import com.backtest.service.StrategyReportService;
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
public class StrategyRunResponse implements MessageListener {
    private final StrategyReportService strategyReportService;

    public void onMessage(Message message, byte[] bytes) {
        StrategyRunRedisResponse response = StrategyRunRedisResponse.fromJson(message.toString());
        if (!response.isSuccess()) {
            log.error("Error while running strategy! {}", response);
            strategyReportService.delete(response.getId());
            return;
        }

        StrategyReport report = response.toEntity();
        report.setStatus(StrategyReport.StrategyReportStatus.COMPLETED);
        strategyReportService.save(report);
    }
}
