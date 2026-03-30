package com.instituto.api.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class DisposableEmailDomainService {

    private static final Logger LOGGER = LoggerFactory.getLogger(DisposableEmailDomainService.class);
    private static final String RESOURCE_NAME = "disposable_email_domains.txt";
    private static final Pattern DOMAIN_PATTERN = Pattern.compile("^[a-z0-9.-]+\\.[a-z]{2,}$");

    @Value("${app.email.disposable.update-enabled:true}")
    private boolean updateEnabled;

    @Value("${app.email.disposable.sources:https://raw.githubusercontent.com/disposable/disposable-email-domains/master/domains.txt,https://raw.githubusercontent.com/7c/fakefilter/main/txt/data.txt}")
    private String sourceUrls;

    private volatile Set<String> domainSet = Collections.emptySet();

    @PostConstruct
    public void init() {
        refreshDomainSet();
    }

    @Scheduled(
        initialDelayString = "${app.email.disposable.initial-delay-ms:300000}",
        fixedDelayString = "${app.email.disposable.refresh-ms:86400000}"
    )
    public void scheduledRefresh() {
        if (!updateEnabled) {
            return;
        }
        refreshDomainSet();
    }

    public boolean isDisposableDomain(String domain) {
        if (domain == null || domain.isBlank()) {
            return true;
        }

        String normalized = domain.trim().toLowerCase(Locale.ROOT);
        Set<String> current = domainSet;
        if (current.contains(normalized)) {
            return true;
        }

        int idx = normalized.indexOf('.');
        while (idx > 0 && idx < normalized.length() - 1) {
            String suffix = normalized.substring(idx + 1);
            if (current.contains(suffix)) {
                return true;
            }
            idx = normalized.indexOf('.', idx + 1);
        }
        return false;
    }

    private void refreshDomainSet() {
        Set<String> merged = new HashSet<>(loadFromResource());
        int localCount = merged.size();

        if (updateEnabled) {
            for (String source : splitSources(sourceUrls)) {
                merged.addAll(loadFromRemoteSource(source));
            }
        }

        if (merged.isEmpty()) {
            LOGGER.warn("Lista de dominios temporarios vazia. Mantendo cache anterior.");
            return;
        }

        domainSet = Set.copyOf(merged);
        LOGGER.info("Dominios temporarios carregados: total={}, local={}", domainSet.size(), localCount);
    }

    private Set<String> loadFromResource() {
        InputStream input = getClass().getClassLoader().getResourceAsStream(RESOURCE_NAME);
        if (input == null) {
            LOGGER.warn("Recurso '{}' nao encontrado.", RESOURCE_NAME);
            return Collections.emptySet();
        }
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            return parseDomains(reader);
        } catch (IOException e) {
            LOGGER.warn("Falha ao ler recurso local de dominios temporarios.", e);
            return Collections.emptySet();
        }
    }

    private Set<String> loadFromRemoteSource(String sourceUrl) {
        HttpURLConnection connection = null;
        try {
            URL url = new URL(sourceUrl);
            connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(7000);
            connection.setReadTimeout(10000);
            connection.setRequestMethod("GET");
            connection.setRequestProperty("User-Agent", "instituto-api-disposable-domain-updater/1.0");

            int status = connection.getResponseCode();
            if (status < 200 || status >= 300) {
                LOGGER.warn("Falha ao baixar lista disposable de {} (status {}).", sourceUrl, status);
                return Collections.emptySet();
            }

            try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))
            ) {
                Set<String> parsed = parseDomains(reader);
                LOGGER.info("Fonte disposable carregada: {} ({} dominios)", sourceUrl, parsed.size());
                return parsed;
            }
        } catch (Exception e) {
            LOGGER.warn("Falha ao atualizar lista disposable via {}.", sourceUrl, e);
            return Collections.emptySet();
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private Set<String> parseDomains(BufferedReader reader) throws IOException {
        Set<String> domains = new HashSet<>();
        String line;
        while ((line = reader.readLine()) != null) {
            String value = line.trim().toLowerCase(Locale.ROOT);
            if (value.isEmpty() || value.startsWith("#")) {
                continue;
            }
            if (value.startsWith("http://") || value.startsWith("https://")) {
                continue;
            }
            if (value.startsWith("@")) {
                value = value.substring(1);
            }
            if (DOMAIN_PATTERN.matcher(value).matches()) {
                domains.add(value);
            }
        }
        return domains;
    }

    private Set<String> splitSources(String rawSources) {
        if (rawSources == null || rawSources.isBlank()) {
            return Collections.emptySet();
        }
        Set<String> sources = new HashSet<>();
        Arrays.stream(rawSources.split(","))
            .map(String::trim)
            .filter(s -> !s.isBlank())
            .forEach(sources::add);
        return sources;
    }
}
