package com.backtest.controller;

import com.backtest.annotations.RequireAuth;
import com.backtest.dto.BaseResponse;
import com.backtest.dto.ErrorResponse;
import com.backtest.dto.user.ProfileResponse;
import com.backtest.dto.user.UpdatePasswordRequest;
import com.backtest.dto.user.UpdateUsernameRequest;
import com.backtest.dto.user.UpdateUsernameResponse;
import com.backtest.model.User;
import com.backtest.service.JwtService;
import com.backtest.service.SessionService;
import com.backtest.service.UserService;
import com.backtest.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    @Autowired
    private final UserService userService;

    @Autowired
    private final JwtService jwtService;

    @Autowired
    private final SessionService sessionService;

    @Autowired
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/profile")
    @RequireAuth
    public ProfileResponse getProfile(HttpServletRequest request) {
        User user = AuthUtil.getUser(request);
        return new ProfileResponse(user.getUsername(), user.getEmail());
    }

    @PutMapping("/username")
    @RequireAuth
    public UpdateUsernameResponse updateUsername(HttpServletRequest request, @RequestBody UpdateUsernameRequest body) {
        User user = AuthUtil.getUser(request);
        String newUsername = body.getUsername();

        if (StringUtils.isBlank(newUsername)) {
            return new UpdateUsernameResponse(new ErrorResponse("Username cannot be empty!"));
        }

        newUsername = newUsername.trim();

        if (newUsername.equals(user.getUsername())) {
            return new UpdateUsernameResponse(new ErrorResponse("New username must be different from the current one!"));
        }

        if (userService.getUserByUsername(newUsername).isPresent()) {
            return new UpdateUsernameResponse(new ErrorResponse("Username already in use!"));
        }

        user.setUsername(newUsername);
        user = userService.save(user);

        // The username is the JWT subject, so the current token is no longer valid.
        // Clear the session and issue a fresh token for the new username.
        sessionService.deleteByUsername(user);
        String token = jwtService.generateToken(user);

        return new UpdateUsernameResponse("Username updated successfully.", token);
    }

    @PutMapping("/password")
    @RequireAuth
    public BaseResponse updatePassword(HttpServletRequest request, @RequestBody UpdatePasswordRequest body) {
        User user = AuthUtil.getUser(request);

        if (StringUtils.isBlank(body.getCurrentPassword()) || StringUtils.isBlank(body.getNewPassword())) {
            return new BaseResponse(new ErrorResponse("Current and new password are required!"));
        }

        if (!passwordEncoder.matches(body.getCurrentPassword(), user.getPassword())) {
            return new BaseResponse(new ErrorResponse("Current password is incorrect!"));
        }

        if (passwordEncoder.matches(body.getNewPassword(), user.getPassword())) {
            return new BaseResponse(new ErrorResponse("New password must be different from the current one!"));
        }

        user.setPassword(passwordEncoder.encode(body.getNewPassword()));
        userService.save(user);

        return new BaseResponse("Password updated successfully.");
    }
}
