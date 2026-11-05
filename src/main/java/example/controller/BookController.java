package example.controller;

import example.dto.BookRequest;
import example.entity.Book;
import example.exception.ApiException;
import example.repository.BookRepository;
import example.repository.IssuedBookRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private static final Set<String> SORTABLE_FIELDS = Set.of(
            "bookId", "title", "author", "category",
            "totalCopies", "availableCopies"
    );

    private final BookRepository bookRepository;
    private final IssuedBookRepository issueRepository;

    public BookController(
            BookRepository bookRepository,
            IssuedBookRepository issueRepository) {
        this.bookRepository = bookRepository;
        this.issueRepository = issueRepository;
    }

    @GetMapping
    public List<Book> getAllBooks(@RequestParam(required = false) String q) {
        if (q == null || q.isBlank()) {
            return bookRepository.findAll(Sort.by("bookId").ascending());
        }
        String term = q.trim();
        return bookRepository
                .findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(
                        term, term);
    }

    @GetMapping("/search")
    public List<Book> searchBooks(@RequestParam String q) {
        String term = q.trim();
        return bookRepository
                .findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(
                        term, term);
    }

    @GetMapping("/page")
    public Page<Book> getBooksPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "bookId") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) String q) {

        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Page must be 0 or greater and size must be between 1 and 100");
        }

        if (!SORTABLE_FIELDS.contains(sortBy)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Invalid sort field. Allowed: " + SORTABLE_FIELDS);
        }

        Sort sort = "desc".equalsIgnoreCase(direction)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        if (q == null || q.isBlank()) {
            return bookRepository.findAll(pageable);
        }

        String term = q.trim();
        return bookRepository
                .findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(
                        term, term, pageable);
    }

    @GetMapping("/{id}")
    public Book getBookById(@PathVariable Integer id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> notFound(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Book addBook(@Valid @RequestBody BookRequest request) {

        if (request.bookId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Book ID is required");
        }

        if (bookRepository.existsById(request.bookId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Book ID " + request.bookId() + " already exists");
        }

        validateCopyCounts(
                request.totalCopies(),
                request.availableCopies(),
                0
        );

        Book book = new Book();
        book.setBookId(request.bookId());
        applyRequest(book, request);

        return bookRepository.save(book);
    }

    @PutMapping("/{id}")
    @Transactional
    public Book updateBook(
            @PathVariable Integer id,
            @Valid @RequestBody BookRequest request) {

        // Lock the row so a simultaneous issue/return cannot change copies
        // between our consistency check and the save.
        Book existing = bookRepository.findByIdForUpdate(id)
                .orElseThrow(() -> notFound(id));

        long activeIssues = issueRepository.countByBookIdAndStatus(
                id, "ISSUED");

        validateCopyCounts(
                request.totalCopies(),
                request.availableCopies(),
                activeIssues
        );

        applyRequest(existing, request);

        return bookRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBook(@PathVariable Integer id) {

        if (!bookRepository.existsById(id)) {
            throw notFound(id);
        }

        if (issueRepository.existsByBookId(id)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cannot delete this book because issue records exist. "
                            + "Return/clean the related issues first.");
        }

        bookRepository.deleteById(id);
    }

    private void applyRequest(Book book, BookRequest request) {
        book.setTitle(request.title().trim());
        book.setAuthor(request.author().trim());
        book.setCategory(trimToNull(request.category()));
        book.setTotalCopies(request.totalCopies());
        book.setAvailableCopies(request.availableCopies());
    }

    private void validateCopyCounts(
            Integer totalCopies,
            Integer availableCopies,
            long activeIssues) {

        if (totalCopies == null || availableCopies == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Total copies and available copies are required");
        }

        if (totalCopies < 0 || availableCopies < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Copy counts cannot be negative");
        }

        if (totalCopies < activeIssues) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Total copies cannot be less than the " + activeIssues
                            + " copies currently issued");
        }

        if (availableCopies > totalCopies) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Available copies cannot exceed total copies");
        }

        long maxAvailable = totalCopies - activeIssues;
        if (availableCopies > maxAvailable) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Available copies cannot exceed " + maxAvailable
                            + " because " + activeIssues
                            + " copies are currently issued");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ApiException notFound(Integer id) {
        return new ApiException(HttpStatus.NOT_FOUND,
                "Book not found with id: " + id);
    }
}
