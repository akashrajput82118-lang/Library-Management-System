package example.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final SecretKey signingKey;
    private final long expirationMillis;

    public JwtService(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.expiration-minutes:480}") long expirationMinutes) {

        String cleanSecret = secret == null ? "" : secret.trim();

        if (cleanSecret.getBytes(StandardCharsets.UTF_8).length >= 32) {
            this.signingKey = Keys.hmacShaKeyFor(
                    cleanSecret.getBytes(StandardCharsets.UTF_8));
        } else {
            // Secure fallback for local development: random per start, never
            // a hardcoded secret. Sessions end when the backend restarts.
            this.signingKey = Jwts.SIG.HS256.key().build();
            log.warn("JWT_SECRET is not set (or shorter than 32 characters). "
                    + "Using a random key for this run; all tokens become "
                    + "invalid after a restart. Set JWT_SECRET for stable logins.");
        }

        this.expirationMillis = Math.max(1, expirationMinutes) * 60_000L;
    }

    public String generateToken(UserDetails userDetails) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMillis))
                .signWith(signingKey)
                .compact();
    }

    public String extractUsername(String token) {
        try {
            return parseClaims(token).getSubject();
        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            Claims claims = parseClaims(token);
            return userDetails.getUsername().equals(claims.getSubject())
                    && claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public long getExpirationSeconds() {
        return expirationMillis / 1000L;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
