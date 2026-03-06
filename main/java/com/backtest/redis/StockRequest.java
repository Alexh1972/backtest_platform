package com.backtest.redis;

import com.backtest.dto.stock.StockTopicRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@AllArgsConstructor
public class StockRequest {
    @Autowired
    private final RedisTemplate<String, Object> redisTemplate;

    @Autowired
    @Qualifier("stockRequestTopic")
    private final ChannelTopic topic;

    public void publish(StockTopicRequest request) {
        redisTemplate.convertAndSend(topic.getTopic(), request.toJson());
    }
}
