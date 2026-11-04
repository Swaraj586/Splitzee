package com.splitzee.security.filter;

import com.splitzee.constant.ApplicationConstants;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.tomcat.util.descriptor.web.SecurityCollection;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

public class JwtTokenValidationFilter extends OncePerRequestFilter{

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Qualifier("publicPaths")
    private final List<String> publicPaths;

    public JwtTokenValidationFilter(List<String> publicPaths) {
        this.publicPaths = publicPaths;
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
       String authHeader = request.getHeader(ApplicationConstants.JWT_HEADER);
       if(authHeader != null && authHeader.startsWith("Bearer ") && authHeader.length() > 7)
       {
           try{
               String jwt = authHeader.substring(7);
               Environment env = getEnvironment();
               if(env != null)
               {
                   String secret = env.getProperty(ApplicationConstants.JWT_SECRET, ApplicationConstants.JWT_SECRET_DEFAULT_VALUE);
                   SecretKey secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
                   if(secretKey!= null)
                   {
                       Claims claims = Jwts.parser().verifyWith(secretKey).build().parseClaimsJws(jwt).getPayload();
                       String username = String.valueOf(claims.get("username"));
                       String roles = String.valueOf(claims.get("roles"));
                       Authentication authentication = new UsernamePasswordAuthenticationToken(username, null, AuthorityUtils.commaSeparatedStringToAuthorityList(roles));
                       SecurityContextHolder.getContext().setAuthentication(authentication);

                   }
               }
           }
           catch (ExpiredJwtException exp)
           {
               response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
               response.getWriter().write("Token has expired");
                return;
           } catch (Exception e)
           {
               throw new BadCredentialsException("Invalid token");
           }
       }

       filterChain.doFilter(request, response);

    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return publicPaths.stream().anyMatch(publicPath -> pathMatcher.match(publicPath, path));
    }
}
