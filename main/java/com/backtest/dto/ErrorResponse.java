package com.backtest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    List<String> errors;

    public ErrorResponse(String... errors) {
        this.errors = List.of(errors);
    }
}
