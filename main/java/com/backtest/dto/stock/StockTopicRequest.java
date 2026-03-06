package com.backtest.dto.stock;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import tools.jackson.databind.ObjectMapper;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
@AllArgsConstructor
public class StockTopicRequest {
    String ticker;
    String start;
    String end;
    String interval;

    @SneakyThrows
    public String toJson() {
        return new ObjectMapper().writeValueAsString(this);
    }
}
