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
public class ProfileResponse {
    String username;
    String email;
    ErrorResponse error;
    BaseResponse.ResponseStatus status;

    public ProfileResponse(ErrorResponse errorResponse) {
        status = BaseResponse.ResponseStatus.ERROR;
        this.error = errorResponse;
    }

    public ProfileResponse(String username, String email) {
        status = BaseResponse.ResponseStatus.SUCCESS;
        this.username = username;
        this.email = email;
    }
}
