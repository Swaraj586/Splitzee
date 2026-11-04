package com.splitzee.resend;


import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final Resend resend;

    public EmailService(Resend resend) {
        this.resend = resend;
    }

    public String sendEmail(String to, String subject, String htmlContent) {
        CreateEmailOptions params = CreateEmailOptions.builder()
                .from("noreply@splitzee.spdev.tech")
                .to(to)
                .subject(subject)
                .html(htmlContent)
                .build();

        try{
            CreateEmailResponse response = resend.emails().send(params);
            return response.getId();
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

}
