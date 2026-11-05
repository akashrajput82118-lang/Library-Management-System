package example.controller;

import example.dto.IssueRequest;
import example.dto.IssueResponse;
import example.entity.IssuedBook;
import example.exception.ApiException;
import example.repository.IssuedBookRepository;
import example.service.IssueMapper;
import example.service.IssueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
import java.util.Objects;

@RestController
@RequestMapping("/api/issues")
public class IssuedBookController {

    private final IssuedBookRepository issueRepository;
    private final IssueService issueService;
    private final IssueMapper issueMapper;

    public IssuedBookController(
            IssuedBookRepository issueRepository,
            IssueService issueService,
            IssueMapper issueMapper) {
        this.issueRepository = issueRepository;
        this.issueService = issueService;
        this.issueMapper = issueMapper;
    }

    @GetMapping
    public List<IssueResponse> getAllIssues(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer studentId) {

        String normalizedStatus = normalizeStatus(status);

        List<IssuedBook> issues;

        if (normalizedStatus != null && studentId != null) {
            issues = issueRepository
                    .findByStudentIdAndStatusOrderByIssueIdDesc(
                            studentId, normalizedStatus);
        } else if (normalizedStatus != null) {
            issues = issueRepository
                    .findByStatusOrderByIssueIdDesc(normalizedStatus);
        } else if (studentId != null) {
            issues = issueRepository
                    .findByStudentIdOrderByIssueIdDesc(studentId);
        } else {
            issues = issueRepository.findAllByOrderByIssueIdDesc();
        }

        return issueMapper.toResponses(issues);
    }

    @GetMapping("/{id}")
    public IssueResponse getIssue(@PathVariable Integer id) {
        IssuedBook issue = issueRepository.findById(id)
                .orElseThrow(() -> notFound(id));
        return issueMapper.toResponse(issue);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IssueResponse issueBook(@Valid @RequestBody IssueRequest request) {
        IssuedBook issue = issueService.issueBook(request);
        return issueMapper.toResponse(issue);
    }

    @PutMapping("/{id}/return")
    public IssueResponse returnBook(@PathVariable Integer id) {
        IssuedBook issue = issueService.returnBook(id);
        return issueMapper.toResponse(issue);
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        String normalized = status.trim().toUpperCase();

        if (!Objects.equals(normalized, IssuedBook.STATUS_ISSUED)
                && !Objects.equals(normalized, IssuedBook.STATUS_RETURNED)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Invalid status. Use ISSUED or RETURNED");
        }

        return normalized;
    }

    private ApiException notFound(Integer id) {
        return new ApiException(HttpStatus.NOT_FOUND,
                "Issue record not found with id: " + id);
    }
}
