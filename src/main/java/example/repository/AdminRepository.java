package example.repository;

import example.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Integer> {

    Optional<Admin> findByUsername(String username);

    @Query("select coalesce(max(a.adminId), 0) from Admin a")
    Integer findMaxId();
}
