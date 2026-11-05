package example.dto;

import example.entity.Book;
import example.entity.IssuedBook;
import example.entity.Student;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Flattened API representation of an issue record. It includes read-only
 * book/student names so the React table does not need extra requests.
 */
public record IssueResponse(
        Integer issueId,
        Integer bookId,
        String bookTitle,
        Integer studentId,
        String studentName,
        LocalDate issueDate,
        LocalDate dueDate,
        LocalDate returnDate,
        String status,
        boolean overdue,
        long overdueDays
) {

    public static IssueResponse from(IssuedBook issue, Book book, Student student) {
        LocalDate today = LocalDate.now();
        boolean isIssued = IssuedBook.STATUS_ISSUED.equals(issue.getStatus());
        boolean isOverdue = isIssued
                && issue.getDueDate() != null
                && issue.getDueDate().isBefore(today);
        long overdueDays = isOverdue
                ? ChronoUnit.DAYS.between(issue.getDueDate(), today)
                : 0L;

        return new IssueResponse(
                issue.getIssueId(),
                issue.getBookId(),
                book != null ? book.getTitle() : "(deleted book)",
                issue.getStudentId(),
                student != null ? student.getName() : "(deleted student)",
                issue.getIssueDate(),
                issue.getDueDate(),
                issue.getReturnDate(),
                issue.getStatus(),
                isOverdue,
                overdueDays
        );
    }
}
