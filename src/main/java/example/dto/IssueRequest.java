package example.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Only the ids are accepted from the client. Dates and status are always
 * calculated by the server.
 */
public record IssueRequest(

        @NotNull(message = "Book ID is required")
        @Min(value = 1, message = "Book ID must be greater than 0")
        Integer bookId,

        @NotNull(message = "Student ID is required")
        @Min(value = 1, message = "Student ID must be greater than 0")
        Integer studentId
) {
}
