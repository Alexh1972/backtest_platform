package com.backtest.controller;

import com.backtest.annotations.RequireAuth;
import com.backtest.dto.stock.StockTopicRequest;
import com.backtest.model.Stock;
import com.backtest.service.StockFetchService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
@Slf4j
public class StockController {
    @Autowired
    private final StockFetchService stockService;

    @GetMapping
    @RequireAuth
    public List<Stock> getStock(HttpServletRequest request, @RequestBody StockTopicRequest body) {
        return stockService.getStock(body);
    }
}
