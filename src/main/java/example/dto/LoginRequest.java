package example.dto;

public record LoginRequest(
        @jakarta.validation.constraints.NotBlank(message = "Username is required")
        String username,

        @jakarta.validation.constraints.NotBlank(message = "Password is required")
        String password
) {
}
