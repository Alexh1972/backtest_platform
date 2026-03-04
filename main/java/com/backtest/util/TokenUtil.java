package com.backtest.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class TokenUtil {
	public String getTokenFromRequest(HttpServletRequest request) {
		if (request.getHeader("Authorization") != null)
			return getTokenFromHeader(request.getHeader("Authorization"));
		else
			return request.getParameter("token");
	}

	public String getTokenFromHeader(String header) {
		return header.substring(7);
	}
}
