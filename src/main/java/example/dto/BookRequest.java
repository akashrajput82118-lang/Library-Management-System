package example.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request body for creating/updating a book. The bookId is required when
 * creating because the existing books table uses a manually supplied key.
 */
public record BookRequest(

        @Min(value = 1, message = "Book ID must be greater than 0")
        Integer bookId,

        @NotBlank(message = "Title cannot be empty")
        @Size(max = 250, message = "Title cannot be longer than 250 characters")
        String title,

        @NotBlank(message = "Author cannot be empty")
        @Size(max = 250, message = "Author cannot be longer than 250 characters")
        String author,

        @Size(max = 250, message = "Category cannot be longer than 250 characters")
        String category,

        @NotNull(message = "Total copies is required")
        @Min(value = 0, message = "Total copies cannot be negative")
        Integer totalCopies,

        @NotNull(message = "Available copies is required")
        @Min(value = 0, message = "Available copies cannot be negative")
        Integer availableCopies
) {
}
