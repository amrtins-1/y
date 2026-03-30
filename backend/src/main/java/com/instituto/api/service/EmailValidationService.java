package com.instituto.api.service;

import org.springframework.stereotype.Service;

import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.net.InetAddress;
import java.util.Hashtable;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class EmailValidationService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);
    private final DisposableEmailDomainService disposableEmailDomainService;

    public EmailValidationService(DisposableEmailDomainService disposableEmailDomainService) {
        this.disposableEmailDomainService = disposableEmailDomainService;
    }

    public boolean hasValidFormat(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    public boolean hasDeliverableDomain(String email) {
        String domain = extractDomain(email);
        if (domain == null) {
            return false;
        }
        return hasMxRecord(domain) || hasARecord(domain);
    }

    public boolean isDisposableDomain(String email) {
        String domain = extractDomain(email);
        if (domain == null) {
            return true;
        }
        return disposableEmailDomainService.isDisposableDomain(domain);
    }

    public boolean isAllowedForSignup(String email) {
        return hasValidFormat(email) && hasDeliverableDomain(email) && !isDisposableDomain(email);
    }

    private String extractDomain(String email) {
        if (!hasValidFormat(email)) {
            return null;
        }
        int atIndex = email.lastIndexOf('@');
        if (atIndex < 0 || atIndex == email.length() - 1) {
            return null;
        }
        return email.substring(atIndex + 1).trim().toLowerCase(Locale.ROOT);
    }

    private boolean hasMxRecord(String domain) {
        Hashtable<String, String> env = new Hashtable<>();
        env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
        DirContext context = null;
        try {
            context = new InitialDirContext(env);
            Attributes attrs = context.getAttributes(domain, new String[]{"MX"});
            Attribute mx = attrs.get("MX");
            return mx != null && mx.size() > 0;
        } catch (NamingException ignored) {
            return false;
        } finally {
            if (context != null) {
                try {
                    context.close();
                } catch (NamingException ignored) {
                    // noop
                }
            }
        }
    }

    private boolean hasARecord(String domain) {
        try {
            InetAddress.getByName(domain);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }
}
