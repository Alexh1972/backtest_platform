package com.backtest.dto.strategy;

import lombok.Data;
import lombok.SneakyThrows;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Component
@Data
public class StrategyRunRedisRequest {
    List<String> tickers;
    String start;
    String end;
    String file;

    @SneakyThrows
    public String toJson() {
        return new ObjectMapper().writeValueAsString(this);
    }
}
