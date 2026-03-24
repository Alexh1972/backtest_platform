package com.backtest.dto.strategy;

import lombok.Data;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
@Data
public class StrategySubmitRedisRequest {
    Date start;
    Date end;
    String code;
}
