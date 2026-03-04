package com.backtest.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
@AllArgsConstructor
public class BaseResponse {
    String message;
    ErrorResponse error;
    ResponseStatus status;

    public BaseResponse(ErrorResponse errorResponse) {
        status = ResponseStatus.ERROR;
        this.error = errorResponse;
    }

    public BaseResponse(String message) {
        status = ResponseStatus.SUCCESS;
        this.message = message;
    }

    public enum ResponseStatus {
        SUCCESS, ERROR
    }
}
