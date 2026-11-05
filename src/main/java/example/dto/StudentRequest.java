package example.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for creating/updating a student.
 * No id -> create uses the supplied studentId; update uses the URL id.
 */
public record StudentRequest(

        @Min(value = 1, message = "Student ID must be greater than 0")
        Integer studentId,

        @NotBlank(message = "Student name cannot be empty")
        @Size(max = 250, message = "Student name cannot be longer than 250 characters")
        String name,

        @NotBlank(message = "Email cannot be empty")
        @Email(message = "Enter a valid email address")
        @Size(max = 250, message = "Email cannot be longer than 250 characters")
        String email,

        @Size(max = 15, message = "Phone number cannot be longer than 15 characters")
        String phone,

        @Size(max = 250, message = "Department cannot be longer than 250 characters")
        String department
) {
}
