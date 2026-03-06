package com.backtest.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.listener.ChannelTopic;

@Configuration
public class TopicConfig {
    @Bean
    public ChannelTopic stockResponseTopic() {
        return new ChannelTopic("stock-response-topic");
    }

    @Bean
    public ChannelTopic stockRequestTopic() {
        return new ChannelTopic("stock-request-topic");
    }
}
