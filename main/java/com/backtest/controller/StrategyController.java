package com.backtest.controller;

import com.backtest.annotations.RequireAuth;
import com.backtest.dto.BaseResponse;
import com.backtest.dto.ErrorResponse;
import com.backtest.dto.strategy.StrategyRunRedisRequest;
import com.backtest.dto.strategy.StrategyRunServerResponse;
import com.backtest.dto.strategy.StrategySubmitRedisRequest;
import com.backtest.dto.strategy.SubmissionDto;
import com.backtest.model.StrategyReport;
import com.backtest.model.Submission;
import com.backtest.model.User;
import com.backtest.redis.StrategyRunRequest;
import com.backtest.repository.StrategyReportRepository;
import com.backtest.service.StrategyReportService;
import com.backtest.service.SubmissionService;
import com.backtest.util.AuthUtil;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
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

    @Autowired
    private final StrategyReportService strategyReportService;

    @PostMapping("/submit")
    @RequireAuth
    public BaseResponse submitStrategy(HttpServletRequest request, @RequestBody StrategySubmitRedisRequest body) {
        User user = AuthUtil.getUser(request);
        String hash = UUID.randomUUID().toString().replace("-", "");
        Path path = Paths.get("storage/scripts/" + hash + ".py");

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
    public StrategyRunServerResponse runStrategy(HttpServletRequest request, @RequestBody StrategyRunRedisRequest body, ServletResponse servletResponse) {
        User user = AuthUtil.getUser(request);

        Submission submission = submissionService.getSubmission(user, body.getFile());

        if (submission != null) {
            StrategyReport strategyReport = new StrategyReport();
            strategyReport = strategyReportService.save(strategyReport);
            body.setId(strategyReport.getStrategyReportId());
            strategyRunRequest.publish(body);
            return new StrategyRunServerResponse(strategyReport.getStrategyReportId());
        }

        return new StrategyRunServerResponse(new ErrorResponse("Error while starting strategy"));
    }

    @GetMapping("/submissions")
    @RequireAuth
    public List<SubmissionDto> listSubmissions(HttpServletRequest request) {
        User user = AuthUtil.getUser(request);
        return submissionService.getSubmissions(user).stream()
                .map(SubmissionDto::from)
                .toList();
    }

    @GetMapping("/submission/{hash}/code")
    @RequireAuth
    public BaseResponse getSubmissionCode(HttpServletRequest request, @PathVariable String hash) {
        User user = AuthUtil.getUser(request);
        Submission submission = submissionService.getSubmission(user, hash);

        if (submission == null) {
            return new BaseResponse(new ErrorResponse("Submission not found"));
        }

        try {
            String code = Files.readString(Paths.get("storage/scripts/" + hash + ".py"), StandardCharsets.UTF_8);
            return new BaseResponse(code);
        } catch (Exception e) {
            log.error("Error reading submission code for {}", hash, e);
            return new BaseResponse(new ErrorResponse("Error reading submission code"));
        }
    }

    @GetMapping("/reports")
    @RequireAuth
    public List<StrategyReport> listReports(HttpServletRequest request, @RequestParam String hash) {
        User user = AuthUtil.getUser(request);
        Submission submission = submissionService.getSubmission(user, hash);

        if (submission == null) {
            return List.of();
        }

        return strategyReportService.getReports(hash);
    }

    @GetMapping("/report/{id}")
    @RequireAuth
    public StrategyReport getReport(@PathVariable Long id) {
        List<StrategyReport> reports = strategyReportService.getReport(id);
        return reports.isEmpty() ? null : reports.get(0);
    }

    @GetMapping("/report/{id}/image")
    @RequireAuth
    public ResponseEntity<byte[]> getReportImage(HttpServletRequest request, @PathVariable Long id) {
        return serveArtifact(request, id, "equity_graphs", ".png", MediaType.IMAGE_PNG, null);
    }

    @GetMapping("/report/{id}/trades")
    @RequireAuth
    public ResponseEntity<byte[]> getReportTrades(HttpServletRequest request, @PathVariable Long id) {
        return serveArtifact(request, id, "trades", ".csv", MediaType.parseMediaType("text/csv"),
                "attachment; filename=\"trades-" + id + ".csv\"");
    }

    private ResponseEntity<byte[]> serveArtifact(HttpServletRequest request, Long id, String subDir,
                                                 String extension, MediaType mediaType, String contentDisposition) {
        User user = AuthUtil.getUser(request);

        List<StrategyReport> reports = strategyReportService.getReport(id);
        if (reports.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        StrategyReport report = reports.get(0);

        // A user may only access artifacts belonging to their own submissions.
        if (submissionService.getSubmission(user, report.getFileHash()) == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Path path = Paths.get("storage/" + subDir + "/" + report.getFileHash() + "-" + id + extension);
        if (!Files.exists(path)) {
            return ResponseEntity.notFound().build();
        }

        try {
            byte[] content = Files.readAllBytes(path);
            ResponseEntity.BodyBuilder builder = ResponseEntity.ok().contentType(mediaType);
            if (contentDisposition != null) {
                builder.header("Content-Disposition", contentDisposition);
            }
            return builder.body(content);
        } catch (IOException e) {
            log.error("Error reading {} artifact for report {}", subDir, id, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
