package com.backtest.dto.strategy;

import com.backtest.dto.BaseResponse;
import com.backtest.dto.ErrorResponse;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
@AllArgsConstructor
public class StrategyRunServerResponse {
    String message;
    Long id;
    ErrorResponse error;
    BaseResponse.ResponseStatus status;

    public StrategyRunServerResponse(ErrorResponse errorResponse) {
        status = BaseResponse.ResponseStatus.ERROR;
        this.error = errorResponse;
    }

    public StrategyRunServerResponse(Long id) {
        status = BaseResponse.ResponseStatus.SUCCESS;
        this.id = id;
        this.message = "Strategy successfully started!";
    }
}
