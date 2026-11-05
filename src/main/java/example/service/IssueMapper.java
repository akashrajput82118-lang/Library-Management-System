package example.service;

import example.dto.IssueResponse;
import example.entity.Book;
import example.entity.IssuedBook;
import example.entity.Student;
import example.repository.BookRepository;
import example.repository.StudentRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Converts issue entities into API responses without creating one query per
 * row for book and student names.
 */
@Component
public class IssueMapper {

    private final BookRepository bookRepository;
    private final StudentRepository studentRepository;

    public IssueMapper(
            BookRepository bookRepository,
            StudentRepository studentRepository) {
        this.bookRepository = bookRepository;
        this.studentRepository = studentRepository;
    }

    public List<IssueResponse> toResponses(List<IssuedBook> issues) {

        Set<Integer> bookIds = issues.stream()
                .map(IssuedBook::getBookId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<Integer> studentIds = issues.stream()
                .map(IssuedBook::getStudentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Integer, Book> books = bookRepository.findAllById(bookIds).stream()
                .collect(Collectors.toMap(Book::getBookId, Function.identity()));

        Map<Integer, Student> students =
                studentRepository.findAllById(studentIds).stream()
                        .collect(Collectors.toMap(
                                Student::getStudentId,
                                Function.identity()
                        ));

        return issues.stream()
                .map(issue -> IssueResponse.from(
                        issue,
                        books.get(issue.getBookId()),
                        students.get(issue.getStudentId())
                ))
                .toList();
    }

    public IssueResponse toResponse(IssuedBook issue) {
        return toResponses(List.of(issue)).getFirst();
    }
}
