package example.service;

import example.dto.IssueRequest;
import example.entity.Book;
import example.entity.IssuedBook;
import example.entity.Student;
import example.exception.ApiException;
import example.repository.BookRepository;
import example.repository.IssuedBookRepository;
import example.repository.StudentRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
@ExtendWith(MockitoExtension.class)
class IssueServiceTest {

    @Mock
    private IssuedBookRepository issueRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private StudentRepository studentRepository;

    private IssueService issueService;

    @BeforeEach
    void setUp() {
        issueService = new IssueService(
                issueRepository, bookRepository, studentRepository);
    }

    @Test
    void issuingDecreasesAvailableCopiesAndSetsDates() {
        Book book = book(1, 3, 2);
        Student student = student(101);

        when(bookRepository.findByIdForUpdate(1)).thenReturn(Optional.of(book));
        when(studentRepository.findById(101)).thenReturn(Optional.of(student));
        when(issueRepository.save(any(IssuedBook.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        IssuedBook result = issueService.issueBook(new IssueRequest(1, 101));

        assertEquals(1, book.getAvailableCopies());
        assertEquals(IssuedBook.STATUS_ISSUED, result.getStatus());
        assertEquals(LocalDate.now(), result.getIssueDate());
        assertEquals(LocalDate.now().plusDays(14), result.getDueDate());
        verify(bookRepository).save(book);
    }

    @Test
    void issuingWithZeroAvailableCopiesFailsWithoutSaving() {
        Book book = book(1, 1, 0);
        Student student = student(101);

        when(bookRepository.findByIdForUpdate(1)).thenReturn(Optional.of(book));
        when(studentRepository.findById(101)).thenReturn(Optional.of(student));

        ApiException ex = assertThrows(ApiException.class,
                () -> issueService.issueBook(new IssueRequest(1, 101)));

        assertEquals(409, ex.getStatus().value());
        verify(bookRepository, never()).save(any(Book.class));
        verify(issueRepository, never()).save(any(IssuedBook.class));
    }

    @Test
    void returningIncreasesAvailableCopies() {
        IssuedBook issue = issued(5, 1, IssuedBook.STATUS_ISSUED, null);
        Book book = book(1, 3, 2);

        when(issueRepository.findByIdForUpdate(5)).thenReturn(Optional.of(issue));
        when(bookRepository.findByIdForUpdate(1)).thenReturn(Optional.of(book));
        when(issueRepository.save(any(IssuedBook.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        IssuedBook result = issueService.returnBook(5);

        assertEquals(3, book.getAvailableCopies());
        assertEquals(IssuedBook.STATUS_RETURNED, result.getStatus());
        assertEquals(LocalDate.now(), result.getReturnDate());
    }

    @Test
    void returningTwiceFails() {
        IssuedBook issue = issued(
                5, 1, IssuedBook.STATUS_RETURNED, LocalDate.now());

        when(issueRepository.findByIdForUpdate(5)).thenReturn(Optional.of(issue));

        ApiException ex = assertThrows(ApiException.class,
                () -> issueService.returnBook(5));

        assertEquals(409, ex.getStatus().value());
        verify(bookRepository, never()).findByIdForUpdate(any());
        verify(issueRepository, never()).save(any(IssuedBook.class));
    }

    private Book book(int id, int total, int available) {
        Book book = new Book();
        book.setBookId(id);
        book.setTitle("Test Book");
        book.setAuthor("Test Author");
        book.setTotalCopies(total);
        book.setAvailableCopies(available);
        return book;
    }

    private Student student(int id) {
        Student student = new Student();
        student.setStudentId(id);
        student.setName("Test Student");
        student.setEmail("student" + id + "@example.com");
        return student;
    }

    private IssuedBook issued(
            int id, int bookId, String status, LocalDate returnDate) {

        IssuedBook issue = new IssuedBook();
        issue.setIssueId(id);
        issue.setBookId(bookId);
        issue.setStudentId(101);
        issue.setIssueDate(LocalDate.now().minusDays(20));
        issue.setDueDate(LocalDate.now().minusDays(6));
        issue.setReturnDate(returnDate);
        issue.setStatus(status);
        return issue;
    }
}
