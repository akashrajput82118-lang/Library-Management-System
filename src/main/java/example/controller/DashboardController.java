package example.controller;

import example.dto.DashboardStats;
import example.dto.IssueResponse;
import example.entity.IssuedBook;
import example.repository.BookRepository;
import example.repository.IssuedBookRepository;
import example.repository.StudentRepository;
import example.service.IssueMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final BookRepository bookRepository;
    private final StudentRepository studentRepository;
    private final IssuedBookRepository issueRepository;
    private final IssueMapper issueMapper;

    public DashboardController(
            BookRepository bookRepository,
            StudentRepository studentRepository,
            IssuedBookRepository issueRepository,
            IssueMapper issueMapper) {
        this.bookRepository = bookRepository;
        this.studentRepository = studentRepository;
        this.issueRepository = issueRepository;
        this.issueMapper = issueMapper;
    }

    @GetMapping("/stats")
    public DashboardStats getStats() {
        return new DashboardStats(
                bookRepository.count(),
                bookRepository.sumTotalCopies(),
                studentRepository.count(),
                issueRepository.countByStatus(IssuedBook.STATUS_ISSUED),
                bookRepository.sumAvailableCopies(),
                issueRepository.countByStatusAndDueDateBefore(
                        IssuedBook.STATUS_ISSUED, LocalDate.now())
        );
    }

    @GetMapping("/recent")
    public List<IssueResponse> getRecentActivity(
            @RequestParam(defaultValue = "10") int limit) {

        int safeLimit = Math.max(1, Math.min(limit, 50));
        List<IssuedBook> recent = issueRepository.findRecentActivity(
                PageRequest.of(0, safeLimit));

        return issueMapper.toResponses(recent);
    }
}
