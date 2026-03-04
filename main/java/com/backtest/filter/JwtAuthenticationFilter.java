package com.backtest.filter;

import com.backtest.lock.SessionLock;
import com.backtest.model.User;
import com.backtest.service.JwtService;
import com.backtest.service.SessionService;
import com.backtest.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
	private final JwtService jwtService;
	private final UserService userService;
	private final SessionService sessionService;
	private final SessionLock sessionLock;
	@Override
	protected void doFilterInternal(HttpServletRequest request,
	                                HttpServletResponse response,
	                                FilterChain filterChain)
			throws ServletException, IOException {
		final String authHeader = request.getHeader("Authorization");
		final String jwt;
		final String tokenParameter;
		String username = "";


		if (StringUtils.isEmpty(authHeader) || !StringUtils.startsWith(authHeader, "Bearer ")) {
			tokenParameter = request.getParameter("token");
			if (StringUtils.isEmpty(tokenParameter)) {
				filterChain.doFilter(request, response);
				return;
			}
			jwt = tokenParameter;
		}
		else {
			jwt = authHeader.substring(7);
		}

		log.debug("JWT - {}", jwt.toString());
		username = jwtService.extractUsername(jwt);

		if (StringUtils.isNotEmpty(username) && SecurityContextHolder.getContext().getAuthentication() == null) {
			UserDetails userDetails = null;
			try {
				userDetails = userService.userDetailsService().loadUserByUsername(username);
			} catch (Exception e) {
				log.error("{}", e);
			}

			if (userDetails != null && jwtService.isTokenValid(jwt, userDetails)) {
				Optional<User> userOptional = userService.getUserByUsername(username);
				if (userOptional.isPresent()) {
					User user = userOptional.get();
					log.debug("User - {}", userDetails);
					SecurityContext context = SecurityContextHolder.createEmptyContext();
					UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
							userDetails, null, userDetails.getAuthorities());
					authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
					context.setAuthentication(authToken);
					SecurityContextHolder.setContext(context);

					if (sessionLock.lock(user.getUsername())) {
						sessionService.saveSession(jwt, "", user);
						sessionLock.unlock(user.getUsername());
					}
				}
			}
		}

		filterChain.doFilter(request, response);
	}
}
