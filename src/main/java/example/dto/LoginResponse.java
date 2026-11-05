package example.dto;

public record LoginResponse(
        String token,
        String tokenType,
        String username,
        long expiresInSeconds
) {
}
