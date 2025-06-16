package com.fitavera.email.service;

import com.fitavera.email.config.EmailProperties;
import com.fitavera.tenant.repository.entity.Tenant;
import com.fitavera.user.repository.entity.ClientInvitation;
import com.fitavera.user.repository.entity.User;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailProperties emailProperties;
    private final SpringTemplateEngine templateEngine;
    private final MessageSource messageSource;

    @Async
    public void sendConfirmationEmail(String to, String token, Locale locale) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());

            Context context = new Context();
            context.setVariable("confirmationUrl",
                    String.format("%s?token=%s", emailProperties.getConfirmationUrl(), token));

            String content = templateEngine.process("email/%s/confirmation".formatted(locale.getLanguage()), context);

            helper.setFrom(emailProperties.getFrom(), emailProperties.getSenderName());
            helper.setTo(to);
            helper.setSubject(messageSource.getMessage("email.subject.admin.registration", null, locale));
            helper.setText(content, true);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send confirmation email", e);
        }
    }

    @Async
    public void sendClientInvitation(Tenant tenant, ClientInvitation invitation, User inviter) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());

            Context context = new Context();
            String registrationUrl = emailProperties.getClientRegistrationUrl()
                    .formatted(tenant.getId(), invitation.getId()) + "?locale=" + tenant.getLocale().getLanguage();
            context.setVariable("registrationUrl", registrationUrl);
            String inviterFullName = inviter.getFirstName() + " " + inviter.getLastName();
            context.setVariable("inviterName", inviterFullName);
            context.setVariable("tenantName", tenant.getName());

            String content = templateEngine.process("email/%s/client-invitation"
                    .formatted(tenant.getLocale().getLanguage()), context);

            helper.setFrom(emailProperties.getFrom(), emailProperties.getSenderName());
            helper.setTo(invitation.getEmail());
            helper.setSubject(messageSource.getMessage("email.subject.client.registration",
                    new Object[]{tenant.getName(), inviterFullName},
                    tenant.getLocale()));
            helper.setText(content, true);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send client invitation email", e);
        }
    }
} 