package example.controller;

import example.dto.StudentRequest;
import example.entity.Student;
import example.exception.ApiException;
import example.repository.IssuedBookRepository;
import example.repository.StudentRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
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
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private static final Set<String> SORTABLE_FIELDS = Set.of(
            "studentId", "name", "email", "phone", "department"
    );

    private final StudentRepository studentRepository;
    private final IssuedBookRepository issueRepository;

    public StudentController(
            StudentRepository studentRepository,
            IssuedBookRepository issueRepository) {
        this.studentRepository = studentRepository;
        this.issueRepository = issueRepository;
    }

    @GetMapping
    public List<Student> getAllStudents(@RequestParam(required = false) String q) {
        if (q == null || q.isBlank()) {
            return studentRepository.findAll(
                    Sort.by("studentId").ascending());
        }
        String term = q.trim();
        return studentRepository
                .findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                        term, term);
    }

    @GetMapping("/search")
    public List<Student> searchStudents(@RequestParam String q) {
        String term = q.trim();
        return studentRepository
                .findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                        term, term);
    }

    @GetMapping("/page")
    public Page<Student> getStudentsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "studentId") String sortBy,
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
            return studentRepository.findAll(pageable);
        }

        String term = q.trim();
        return studentRepository
                .findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                        term, term, pageable);
    }

    @GetMapping("/{id}")
    public Student getStudentById(@PathVariable Integer id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> notFound(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Student addStudent(@Valid @RequestBody StudentRequest request) {

        if (request.studentId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Student ID is required");
        }

        if (studentRepository.existsById(request.studentId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Student ID " + request.studentId() + " already exists");
        }

        String email = normalizeEmail(request.email());

        if (studentRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "This email address is already used by another student");
        }

        Student student = new Student();
        student.setStudentId(request.studentId());
        applyRequest(student, request, email);

        return studentRepository.save(student);
    }

    @PutMapping("/{id}")
    public Student updateStudent(
            @PathVariable Integer id,
            @Valid @RequestBody StudentRequest request) {

        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> notFound(id));

        String email = normalizeEmail(request.email());

        studentRepository.findByEmailIgnoreCase(email)
                .filter(other -> !other.getStudentId().equals(id))
                .ifPresent(other -> {
                    throw new ApiException(HttpStatus.CONFLICT,
                            "This email address is already used by another student");
                });

        applyRequest(existing, request, email);

        return studentRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStudent(@PathVariable Integer id) {

        if (!studentRepository.existsById(id)) {
            throw notFound(id);
        }

        if (issueRepository.existsByStudentId(id)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cannot delete this student because issue records exist. "
                            + "Return/clean the related issues first.");
        }

        studentRepository.deleteById(id);
    }

    private void applyRequest(
            Student student,
            StudentRequest request,
            String normalizedEmail) {

        student.setName(request.name().trim());
        student.setEmail(normalizedEmail);
        student.setPhone(trimToNull(request.phone()));
        student.setDepartment(trimToNull(request.department()));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
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
                "Student not found with id: " + id);
    }
}
