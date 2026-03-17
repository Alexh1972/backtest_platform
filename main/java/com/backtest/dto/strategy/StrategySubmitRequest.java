package com.backtest.dto.strategy;

import lombok.Data;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
@Data
public class StrategySubmitRequest {
    Date start;
    Date end;
    String ticker;
    String code;
}
