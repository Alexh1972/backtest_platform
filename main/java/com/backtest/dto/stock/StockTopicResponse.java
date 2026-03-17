package com.backtest.dto.stock;

import com.fasterxml.jackson.annotation.JsonInclude;
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
public class StockTopicResponse {
    String ticker;
    String start;
    String end;
    String interval;
    List<StockInfo> data;

    @SneakyThrows
    public static StockTopicResponse fromJson(String json) {
        return new ObjectMapper().readValue(json, StockTopicResponse.class);
    }
}
