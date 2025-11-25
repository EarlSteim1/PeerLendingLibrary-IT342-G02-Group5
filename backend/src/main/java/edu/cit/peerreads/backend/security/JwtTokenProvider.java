package edu.cit.peerreads.backend.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;

import org.springframework.stereotype.Component;

import edu.cit.peerreads.backend.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtTokenProvider {

    private static final int HS512_MIN_KEY_BYTES = 64;

    private final JwtProperties jwtProperties;
    private SecretKey signingKey;

    @PostConstruct
    void init() {
        byte[] secretBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        byte[] keyBytes = ensureMinKeyLength(secretBytes);
        signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    private byte[] ensureMinKeyLength(byte[] secretBytes) {
        if (secretBytes.length >= HS512_MIN_KEY_BYTES) {
            return secretBytes;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-512");
            byte[] derived = digest.digest(secretBytes);
            log.warn("Configured JWT secret is shorter than 512 bits. Deriving a HS512-compliant key via SHA-512 hash.");
            return derived;
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-512 algorithm not available on this JVM", ex);
        }
    }

    public String generateToken(UserPrincipal principal) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getExpirationMs());

        return Jwts.builder()
                .setSubject(String.valueOf(principal.getId()))
                .claim("email", principal.getEmail())
                .claim("role", principal.getAuthorities().stream().findFirst().map(Object::toString).orElse("ROLE_USER"))
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(signingKey, SignatureAlgorithm.HS512)
                .compact();
    }

    public Long getUserIdFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return Long.parseLong(claims.getSubject());
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }
}

