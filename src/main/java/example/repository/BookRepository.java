package example.repository;

import example.entity.Book;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Integer> {

    List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(
            String title, String author);

    Page<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(
            String title, String author, Pageable pageable);

    /**
     * Row-level lock used while issuing/returning a book. It prevents two
     * concurrent requests from reading the same available-copy count.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Book b where b.bookId = :id")
    Optional<Book> findByIdForUpdate(@Param("id") Integer id);

    @Query("select coalesce(sum(b.totalCopies), 0) from Book b")
    long sumTotalCopies();

    @Query("select coalesce(sum(b.availableCopies), 0) from Book b")
    long sumAvailableCopies();
}
