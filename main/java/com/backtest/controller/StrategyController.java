package com.backtest.controller;

import com.backtest.annotations.RequireAuth;
import com.backtest.dto.strategy.StrategySubmitRequest;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/strategy")
@RequiredArgsConstructor
@Slf4j
public class StrategyController {
    @PostMapping("/submit")
    @RequireAuth
    public void submitStrategy(HttpServletRequest request, @RequestBody StrategySubmitRequest body) {
        String hash = UUID.randomUUID().toString().replace("-", "");
        Path path = Paths.get("scripts/" + hash + ".py");

        try (BufferedWriter writer = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) {
            writer.write(body.getCode());
            writer.flush();
        } catch (Exception e) {
            log.error("Error while submitting strategy!", e);
        }
    }
}
