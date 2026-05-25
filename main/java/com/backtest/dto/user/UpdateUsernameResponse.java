package com.backtest.dto.user;

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
public class UpdateUsernameResponse {
    String message;
    String token;
    ErrorResponse error;
    BaseResponse.ResponseStatus status;

    public UpdateUsernameResponse(ErrorResponse errorResponse) {
        status = BaseResponse.ResponseStatus.ERROR;
        this.error = errorResponse;
    }

    public UpdateUsernameResponse(String message, String token) {
        status = BaseResponse.ResponseStatus.SUCCESS;
        this.message = message;
        this.token = token;
    }
}
