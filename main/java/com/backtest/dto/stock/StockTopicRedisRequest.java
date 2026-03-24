package com.backtest.dto.stock;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import tools.jackson.databind.ObjectMapper;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
public class StockTopicRedisRequest {
    String ticker;
    String start;
    String end;
    String interval;

    public StockTopicRedisRequest(String ticker, String start, String end, String interval) {
        this.ticker = ticker;
        this.start = (start != null) ? start : "1900-01-01T00:00:00";
        this.interval = (interval != null) ? interval : "1d";
        if (end != null) {
            this.end = end;
        } else {
            this.end = OffsetDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
        }
    }

    @SneakyThrows
    public String toJson() {
        return new ObjectMapper().writeValueAsString(this);
    }
}
