package com.backtest.aspect;

import com.backtest.dto.ErrorResponse;
import com.backtest.model.User;
import com.backtest.service.JwtService;
import com.backtest.util.TokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Aspect
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthAspect {
    private final JwtService jwtService;
    private final TokenUtil tokenUtil;
    @Around("@annotation(com.backtest.annotations.RequireAuth)")
    public Object checkAuth(ProceedingJoinPoint joinPoint) throws Throwable {
        try {
            HttpServletRequest request = (HttpServletRequest) joinPoint.getArgs()[0];
            Optional<User> userOptional = jwtService.getUserByToken(tokenUtil.getTokenFromRequest(request));

            if (userOptional.isPresent()) {
                request.setAttribute("user", userOptional.get());
            } else {
                return new ErrorResponse("Invalid Token!");
            }
        } catch (ClassCastException | ArrayIndexOutOfBoundsException e) {
            log.error("First argument for a @RequiredAuth method should be HttpServletRequest!", e);
            return new ErrorResponse("An Error Has Occurred!");
        } catch (Exception e) {
            log.error("Error occurred during authentication check!", e);
            return new ErrorResponse("An Error Has Occurred!");
        }

        try {
            return joinPoint.proceed();
        } catch (Exception e) {
            log.error("Error occurred during the method proceeding the authentication check!", e);
            return new ErrorResponse("An Error Has Occurred!");
        }
    }
}
