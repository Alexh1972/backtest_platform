package com.backtest.dto.stock;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Component
public class StockTopicRedisResponse {
    String ticker;
    String start;
    String end;
    String interval;
    List<StockInfo> data;

    @SneakyThrows
    public static StockTopicRedisResponse fromJson(String json) {
        return new ObjectMapper().readValue(json, StockTopicRedisResponse.class);
    }
}
