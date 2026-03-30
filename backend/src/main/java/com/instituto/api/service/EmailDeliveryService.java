package com.instituto.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailDeliveryService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EmailDeliveryService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@instituto.local}")
    private String fromAddress;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    public EmailDeliveryService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void send(String to, String subject, String body) {
        if (!mailEnabled) {
            LOGGER.info("SMTP desabilitado. E-mail de verificacao nao enviado para {}. Assunto: {}", to, subject);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        String resolvedFrom = (fromAddress == null || fromAddress.isBlank()) ? smtpUsername : fromAddress;
        if (resolvedFrom == null || resolvedFrom.isBlank()) {
            throw new IllegalStateException("Remetente de e-mail nao configurado (app.mail.from/spring.mail.username).");
        }
        message.setFrom(resolvedFrom);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
}
