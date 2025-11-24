package edu.cit.peerreads.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /**
     * Secret used to sign JWT tokens. Override via environment variables in production.
     */
    private String secret = "change-me-super-secret";

    /**
     * Token validity window in milliseconds (default: 24h).
     */
    private long expirationMs = 86_400_000;
}

