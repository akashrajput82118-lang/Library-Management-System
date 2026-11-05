package example.service;

import example.dto.IssueRequest;
import example.entity.Book;
import example.entity.IssuedBook;
import example.entity.Student;
import example.exception.ApiException;
import example.repository.BookRepository;
import example.repository.IssuedBookRepository;
import example.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class IssueService {

    public static final int LOAN_PERIOD_DAYS = 14;

    private final IssuedBookRepository issueRepository;
    private final BookRepository bookRepository;
    private final StudentRepository studentRepository;

    public IssueService(
            IssuedBookRepository issueRepository,
            BookRepository bookRepository,
            StudentRepository studentRepository) {
        this.issueRepository = issueRepository;
        this.bookRepository = bookRepository;
        this.studentRepository = studentRepository;
    }

    /**
     * Issues one copy inside a single transaction.
     *
     * The book row is locked with SELECT ... FOR UPDATE before the copy count
     * is checked, so two simultaneous requests cannot both take the last copy.
     */
    @Transactional
    public IssuedBook issueBook(IssueRequest request) {

        Book book = bookRepository.findByIdForUpdate(request.bookId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Book not found with id: " + request.bookId()
                ));

        Student student = studentRepository.findById(request.studentId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Student not found with id: " + request.studentId()
                ));

        int available = book.getAvailableCopies() == null
                ? 0
                : book.getAvailableCopies();

        if (available <= 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "No copies of '" + book.getTitle() + "' are available right now"
            );
        }

        LocalDate issueDate = LocalDate.now();

        IssuedBook issue = new IssuedBook();
        issue.setBookId(book.getBookId());
        issue.setStudentId(student.getStudentId());
        issue.setIssueDate(issueDate);
        issue.setDueDate(issueDate.plusDays(LOAN_PERIOD_DAYS));
        issue.setReturnDate(null);
        issue.setStatus(IssuedBook.STATUS_ISSUED);

        book.setAvailableCopies(available - 1);
        bookRepository.save(book);

        return issueRepository.save(issue);
    }

    /**
     * Returns one copy. The issue row is locked so the same issue cannot be
     * returned twice, even by concurrent requests.
     */
    @Transactional
    public IssuedBook returnBook(Integer issueId) {

        IssuedBook issue = issueRepository.findByIdForUpdate(issueId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Issue record not found with id: " + issueId
                ));

        if (!IssuedBook.STATUS_ISSUED.equals(issue.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "This book has already been returned"
            );
        }

        Book book = bookRepository.findByIdForUpdate(issue.getBookId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Book not found with id: " + issue.getBookId()
                ));

        int available = book.getAvailableCopies() == null
                ? 0
                : book.getAvailableCopies();
        int total = book.getTotalCopies() == null
                ? available
                : book.getTotalCopies();

        // Defensive cap: available must never exceed total even if the data
        // was edited manually in MySQL.
        book.setAvailableCopies(Math.min(total, available + 1));
        bookRepository.save(book);

        issue.setReturnDate(LocalDate.now());
        issue.setStatus(IssuedBook.STATUS_RETURNED);

        return issueRepository.save(issue);
    }
}
