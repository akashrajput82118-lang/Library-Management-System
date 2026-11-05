package example.dto;

public record DashboardStats(
        long totalTitles,
        long totalCopies,
        long totalStudents,
        long issuedBooks,
        long availableCopies,
        long overdueBooks
) {
}
