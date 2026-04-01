package com.axonique_backend.axonique_backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.axonique_backend.axonique_backend.service.CodeGeneratorService;
import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;

@RestController
public class EmailController {
    
    @Value("${app.mail.resend.api}")
    private String resendApiKey;

    private CodeGeneratorService codeGeneratorService;

    public EmailController(CodeGeneratorService codeGeneratorService) {
        this.codeGeneratorService = codeGeneratorService;
    }

    @RequestMapping(path = "/sendMail/{email}")
    public String sendEmail(@PathVariable("email") String email){
        Resend resend = new Resend(resendApiKey);

        CreateEmailOptions params = CreateEmailOptions.builder()
            .from("Axonique <axonique.verify@axonique.space>")
            .to(email)
            .subject("Axonique verification code")
            .html("""
                <h1>Welcome to Axonique!</h1>
                <p>Thank you for registering.</p>
                </br>
                <p>Verification code: %s</p>
            """.formatted(codeGeneratorService.generateCode(email, 5)))
            .build();
        
        try {
            resend.emails().send(params);
            System.out.println("Sending Email");
            return "Success!!";
        } catch (Exception e) {
            System.out.println("Error while sending email!!");
            return e.getMessage();
        }
    }
}

