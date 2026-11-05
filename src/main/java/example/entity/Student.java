package example.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "students")
public class Student {

    @Id
    @NotNull(message = "Student ID is required")
    @Min(value = 1, message = "Student ID must be greater than 0")
    @Column(name = "student_id")
    private Integer studentId;

    @NotBlank(message = "Student name cannot be empty")
    @Size(max = 250, message = "Student name cannot be longer than 250 characters")
    @Column(nullable = false, length = 250)
    private String name;

    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Enter a valid email address")
    @Size(max = 250, message = "Email cannot be longer than 250 characters")
    @Column(nullable = false, unique = true, length = 250)
    private String email;

    @Size(max = 15, message = "Phone number cannot be longer than 15 characters")
    @Column(length = 15)
    private String phone;

    @Size(max = 250, message = "Department cannot be longer than 250 characters")
    @Column(length = 250)
    private String department;

    public Student() {
    }

    public Integer getStudentId() {
        return studentId;
    }

    public void setStudentId(Integer studentId) {
        this.studentId = studentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }
}
