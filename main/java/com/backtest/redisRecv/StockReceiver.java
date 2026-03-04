package com.backtest.redisRecv;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class StockReceiver implements MessageListener {
    public void onMessage(Message message, byte[] bytes) {
        log.info("Received: " + message.toString());
    }
}
