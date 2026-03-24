package com.backtest.controller;

import com.backtest.annotations.RequireAuth;
import com.backtest.dto.BaseResponse;
import com.backtest.dto.ErrorResponse;
import com.backtest.dto.strategy.StrategyRunRedisRequest;
import com.backtest.dto.strategy.StrategySubmitRedisRequest;
import com.backtest.model.Submission;
import com.backtest.model.User;
import com.backtest.redis.StrategyRunRequest;
import com.backtest.service.SubmissionService;
import com.backtest.util.AuthUtil;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;

@RestController
@RequestMapping("/api/strategy")
@RequiredArgsConstructor
@Slf4j
public class StrategyController {
    @Autowired
    private final StrategyRunRequest strategyRunRequest;

    @Autowired
    private final SubmissionService submissionService;

    @PostMapping("/submit")
    @RequireAuth
    public BaseResponse submitStrategy(HttpServletRequest request, @RequestBody StrategySubmitRedisRequest body) {
        User user = AuthUtil.getUser(request);
        String hash = UUID.randomUUID().toString().replace("-", "");
        Path path = Paths.get("scripts/" + hash + ".py");

        try (BufferedWriter writer = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) {
            writer.write(new String(Base64.getDecoder().decode(body.getCode())));
            writer.flush();

            submissionService.save(new Submission(user, hash));
            return new BaseResponse(hash);
        } catch (Exception e) {
            log.error("Error while submitting strategy!", e);
        }
        return new BaseResponse(new ErrorResponse("Error while submitting strategy!"));
    }

    @PostMapping("/run")
    @RequireAuth
    public BaseResponse runStrategy(HttpServletRequest request, @RequestBody StrategyRunRedisRequest body, ServletResponse servletResponse) {
        User user = AuthUtil.getUser(request);

        Submission submission = submissionService.getSubmission(user, body.getFile());

        if (submission != null) {
            strategyRunRequest.publish(body);
            return new BaseResponse("Strategy successfully started!");
        }

        return new BaseResponse(new ErrorResponse("Error while starting strategy"));
    }
}
