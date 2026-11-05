package example.repository;

import example.entity.IssuedBook;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface IssuedBookRepository extends JpaRepository<IssuedBook, Integer> {

    List<IssuedBook> findAllByOrderByIssueIdDesc();

    List<IssuedBook> findByStatusOrderByIssueIdDesc(String status);

    List<IssuedBook> findByStudentIdOrderByIssueIdDesc(Integer studentId);

    List<IssuedBook> findByStudentIdAndStatusOrderByIssueIdDesc(
            Integer studentId, String status);

    long countByStatus(String status);

    long countByStatusAndDueDateBefore(String status, LocalDate date);

    long countByBookIdAndStatus(Integer bookId, String status);

    long countByStudentIdAndStatus(Integer studentId, String status);

    boolean existsByBookId(Integer bookId);

    boolean existsByStudentId(Integer studentId);

    /**
     * Row-level lock used while returning a book so the same issue cannot be
     * returned twice by two simultaneous requests.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from IssuedBook i where i.issueId = :id")
    Optional<IssuedBook> findByIdForUpdate(@Param("id") Integer id);

    /**
     * "Recent activity" = newest issue OR return event. COALESCE lets the
     * return date win when a book has already come back.
     */
    @Query("""
            select i from IssuedBook i
            order by coalesce(i.returnDate, i.issueDate) desc, i.issueId desc
            """)
    List<IssuedBook> findRecentActivity(Pageable pageable);
}
