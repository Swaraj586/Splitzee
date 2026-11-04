package com.splitzee.user.controller;

import com.splitzee.dto.LoginRequestDto;
import com.splitzee.dto.LoginResponseDto;
import com.splitzee.dto.RegisterRequestDto;
import com.splitzee.dto.UserDto;
import com.splitzee.model.PendingRegistration;
import com.splitzee.model.User;
import com.splitzee.repository.PendingRegiRepo;
import com.splitzee.repository.UserRepository;
import com.splitzee.resend.EmailService;
import com.splitzee.resend.EmailTemplateService;
import com.splitzee.security.util.Jwt;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.password.CompromisedPasswordChecker;
import org.springframework.security.authentication.password.CompromisedPasswordDecision;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@RestController

public class UserController {

    @Autowired
    private UserRepository data;

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private Jwt jwt;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CompromisedPasswordChecker compromisedPasswordChecker;

    @Autowired
    private PendingRegiRepo pendingRegiRepo;

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmailTemplateService emailTemplateService;

    @Value("${frontend.url:${FRONTEND_URL:http://localhost:3000}}")
    private String frontendUrl;

    @PostMapping(version = "1.0", path="/login")
    public ResponseEntity login(@RequestBody LoginRequestDto loginRequestDto){

        try{
            var resAuth = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(loginRequestDto.getUsername(), loginRequestDto.getPassword()));

            String jwtToken = jwt.generateJwtToken(resAuth);
            User logedInUser = (User) resAuth.getPrincipal();
            UserDto userDto = new UserDto(logedInUser.getEmail(), logedInUser.getName());
            ;
            BeanUtils.copyProperties(logedInUser, userDto);

            return ResponseEntity.status(HttpStatus.OK).body(new LoginResponseDto(HttpStatus.OK.getReasonPhrase(), userDto,jwtToken));

        }catch (BadCredentialsException ex){
            return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }catch (AuthenticationException ex){
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Authentication failed");
        } catch (Exception ex){
            ex.printStackTrace();
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
        }

    }

    private ResponseEntity<LoginResponseDto> buildErrorResponse(HttpStatus httpStatus, String message) {

        return ResponseEntity.status(httpStatus).body(new LoginResponseDto(message, null, null));
    }

    @PostMapping(version = "1.0", path="/signup")
    public ResponseEntity register(@RequestBody RegisterRequestDto u){
        try {
            CompromisedPasswordDecision decision = compromisedPasswordChecker.check(u.getPassword());
            if (decision.isCompromised()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password is compromised. Please choose a different password.");
            }
            Optional<User> existingUser = data.readUserByEmail(u.getEmail());
            if(existingUser.isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User with this email already exists");
            }
            pendingRegiRepo.deleteByEmail((u.getEmail()));

            byte[] randomBytes = new byte[32];
            new SecureRandom().nextBytes(randomBytes);
            String rawToken = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
            String tokenHash;
            try {
                tokenHash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(rawToken.getBytes()));

            } catch (Exception e){
                throw new RuntimeException("Error hashing token: " + e.getMessage());
            }

            PendingRegistration pending = new PendingRegistration(
                    tokenHash,
                    u.getEmail(),
                    u.getName(),
                    passwordEncoder.encode(u.getPassword()),
                    Instant.now().plus(24, ChronoUnit.HOURS)
            );
            pendingRegiRepo.save(pending);
            String appBaseUrl = (frontendUrl != null && !frontendUrl.isBlank())
                    ? frontendUrl.replaceAll("/+$", "")
                    : "http://localhost:3000";
            String verifyUrl = appBaseUrl + "/verify-email?token=" + rawToken;
            String html = emailTemplateService.buildActivationEmail(u.getName(), verifyUrl);
            emailService.sendEmail(u.getEmail(), "Activate your Splitzee Account", html);
            return ResponseEntity.status(HttpStatus.CREATED).body("Verification link sent to your email. Please verify to activate your account.");
        } catch (RuntimeException e) {
            throw new RuntimeException(e);
        }

    }


    @GetMapping(version = "1.0", path="/verify-email")
    public ResponseEntity<String> verifyEmail(@RequestParam("token") String token) {

        String tokenHash;
        try {
            tokenHash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes()));

        } catch (Exception e){
            throw new RuntimeException("Error hashing token: " + e.getMessage());
        }
        PendingRegistration pending = pendingRegiRepo.findByTokenHash(tokenHash)
                .orElse(null);

        if (pending == null || pending.isExpired()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired verification link.");
        }
        User user = new User();
        user.setEmail(pending.getEmail());
        user.setName(pending.getName());
        user.setPassword(pending.getEncodedPassword());
        data.save(user);
        pendingRegiRepo.delete(pending);
        return ResponseEntity.ok("Account verified and activated successfully! You can now log in.");
    }

}
