package example.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Administrator account. Passwords are stored as BCrypt hashes only.
 */
@Entity
@Table(name = "admins")
public class Admin {

    @Id
    @Column(name = "admin_id")
    private Integer adminId;

    @Column(nullable = false, unique = true, length = 250)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 250)
    private String passwordHash;

    public Admin() {
    }

    public Admin(Integer adminId, String username, String passwordHash) {
        this.adminId = adminId;
        this.username = username;
        this.passwordHash = passwordHash;
    }

    public Integer getAdminId() {
        return adminId;
    }

    public void setAdminId(Integer adminId) {
        this.adminId = adminId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
}
