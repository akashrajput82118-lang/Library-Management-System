package example.config;

import example.entity.Admin;
import example.repository.AdminRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Optional, environment-gated admin bootstrap.
 *
 * Set APP_ADMIN_USERNAME and APP_ADMIN_PASSWORD (minimum 12 characters) for
 * one startup to create an admin or reset an existing admin's password.
 * Nothing is created when the variables are absent.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;

    public AdminBootstrap(
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.username:}") String username,
            @Value("${app.admin.password:}") String password) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {

        String cleanUsername = username == null ? "" : username.trim();
        String rawPassword = password == null ? "" : password;

        if (cleanUsername.isEmpty() && rawPassword.isEmpty()) {
            return;
        }

        if (cleanUsername.isEmpty() || rawPassword.length() < 12) {
            log.error("Admin bootstrap skipped: APP_ADMIN_USERNAME is required "
                    + "and APP_ADMIN_PASSWORD must be at least 12 characters.");
            return;
        }

        Admin admin = adminRepository.findByUsername(cleanUsername)
                .orElseGet(() -> new Admin(
                        adminRepository.findMaxId() + 1,
                        cleanUsername,
                        ""
                ));

        admin.setPasswordHash(passwordEncoder.encode(rawPassword));
        adminRepository.save(admin);

        log.info("Admin account '{}' was created or its password was reset "
                        + "successfully. Remove APP_ADMIN_USERNAME and "
                        + "APP_ADMIN_PASSWORD from the environment now.",
                cleanUsername);
    }
}
