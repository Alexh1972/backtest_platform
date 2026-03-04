package com.backtest.util;

import com.backtest.model.User;
import jakarta.servlet.http.HttpServletRequest;

public class AuthUtil {
    public static User getUser(HttpServletRequest request) {
        return (User) request.getAttribute("user");
    }
}
