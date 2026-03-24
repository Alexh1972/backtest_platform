package com.backtest.redis;

import com.backtest.dto.stock.StockTopicRedisResponse;
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
public class StrategyRunResponse implements MessageListener {
    public void onMessage(Message message, byte[] bytes) {
        log.info(message.toString());
    }
}
