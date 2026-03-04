package com.backtest.service;


import com.backtest.model.Session;
import com.backtest.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

@Service
@Slf4j
@RequiredArgsConstructor
public class JwtService {
    @Value("${token.secret.key}")
    String jwtSecretKey;

    @Value("${token.expiration}") // ms
    Long jwtExpiration;

    private final UserService userService;
    private final SessionService sessionService;

    public String extractUsername(String token) {return extractClaim(token, Claims::getSubject);}
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token) && isValidSession(token);
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolvers) {
        try {
            final Claims claims = extractAllClaims(token);
            return claimsResolvers.apply(claims);
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isValidSession(String token) {
        if (token.isEmpty())
            return false;

        Optional<User> userOptional = getUserByToken(token);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            Optional<Session> sessionOptional = sessionService.getSessionByUser(user);

            if (sessionOptional.isPresent()) {
                Session session = sessionOptional.get();

                if (session.getToken().equals(token))
                    return true;
            } else {
                return true;
            }
        }

        return false;
    }

    private String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts
                    .parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            return null;
        }
    }

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public Optional<User> getUserByToken(String token) {
        return userService.getUserByUsername(extractUsername(token));
    }
}
