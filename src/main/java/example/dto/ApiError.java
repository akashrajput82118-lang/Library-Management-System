package example.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Standard error body returned by the API. Internal exception details and
 * SQL messages are never exposed to the browser.
 */
public record ApiError(
        Instant timestamp,
        int status,
        String message,
        Map<String, String> fieldErrors
) {

    public static ApiError of(int status, String message) {
        return new ApiError(Instant.now(), status, message, null);
    }

    public static ApiError of(int status, String message,
                              Map<String, String> fieldErrors) {
        return new ApiError(Instant.now(), status, message,
                fieldErrors == null || fieldErrors.isEmpty() ? null : fieldErrors);
    }
}
