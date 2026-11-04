package com.splitzee.security.util;


import com.splitzee.constant.ApplicationConstants;
import com.splitzee.model.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.core.env.Environment;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.stream.Collectors;

@Component

public class Jwt {

    private final Environment env;

    public Jwt(Environment env) {
        this.env = env;
    }

    public String generateJwtToken(Authentication authentication) {

        String jwtToken;
        String secret = env.getProperty(ApplicationConstants.JWT_SECRET, ApplicationConstants.JWT_SECRET_DEFAULT_VALUE);
        SecretKey secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        var fetchedUser = (User) authentication.getPrincipal();
        jwtToken = Jwts.builder().issuer("splitzee").subject("JWT Token")
                .claim("username", fetchedUser.getEmail())
                .claim("name", fetchedUser.getName())
                .claim("roles",authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.joining(",")))
                .issuedAt(new java.util.Date())
                .expiration(new java.util.Date((new java.util.Date()).getTime() + 24*60*60*1000))
                .signWith(secretKey).compact();
        return jwtToken;
    }

}
