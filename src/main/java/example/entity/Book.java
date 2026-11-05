package example.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "books")
public class Book {

    @Id
    @NotNull(message = "Book ID is required")
    @Min(value = 1, message = "Book ID must be greater than 0")
    @Column(name = "book_id")
    private Integer bookId;

    @NotBlank(message = "Title cannot be empty")
    @Size(max = 250, message = "Title cannot be longer than 250 characters")
    @Column(nullable = false, length = 250)
    private String title;

    @NotBlank(message = "Author cannot be empty")
    @Size(max = 250, message = "Author cannot be longer than 250 characters")
    @Column(nullable = false, length = 250)
    private String author;

    @Size(max = 250, message = "Category cannot be longer than 250 characters")
    @Column(length = 250)
    private String category;

    @NotNull(message = "Total copies is required")
    @Min(value = 0, message = "Total copies cannot be negative")
    @Column(name = "total_copies", nullable = false)
    private Integer totalCopies;

    @NotNull(message = "Available copies is required")
    @Min(value = 0, message = "Available copies cannot be negative")
    @Column(name = "available_copies", nullable = false)
    private Integer availableCopies;

    public Book() {
    }

    public Integer getBookId() {
        return bookId;
    }

    public void setBookId(Integer bookId) {
        this.bookId = bookId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getTotalCopies() {
        return totalCopies;
    }

    public void setTotalCopies(Integer totalCopies) {
        this.totalCopies = totalCopies;
    }

    public Integer getAvailableCopies() {
        return availableCopies;
    }

    public void setAvailableCopies(Integer availableCopies) {
        this.availableCopies = availableCopies;
    }
}
