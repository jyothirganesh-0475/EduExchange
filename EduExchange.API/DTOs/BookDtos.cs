using System.ComponentModel.DataAnnotations;

namespace EduExchange.API.DTOs;

// Used for POST /api/books/with-image (multipart/form-data)
// Also used for PUT /api/books/{id}/with-image (edit with optional new image)
public class BookFormDto
{
    [Required(ErrorMessage = "Title is required")]
    [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Author is required")]
    [StringLength(200, ErrorMessage = "Author cannot exceed 200 characters")]
    public string Author { get; set; } = string.Empty;

    public string? Subject       { get; set; }
    public string? AcademicLevel { get; set; }
    public string? Condition     { get; set; }

    [Phone(ErrorMessage = "Invalid phone number")]
    public string? ContactNumber { get; set; }

    // ← OwnerId REMOVED — read from JWT in controller

    [Range(1, int.MaxValue, ErrorMessage = "Invalid category")]
    public int CategoryId { get; set; }

    public IFormFile? Image { get; set; }
}

// Used for PUT /api/books/{id} (JSON, no image)
public class UpdateBookDto
{
    [Required(ErrorMessage = "Title is required")]
    [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Author is required")]
    [StringLength(200, ErrorMessage = "Author cannot exceed 200 characters")]
    public string Author { get; set; } = string.Empty;

    public string? Subject       { get; set; }
    public string? AcademicLevel { get; set; }
    public string? Condition     { get; set; }
    public string? Status        { get; set; }

    [Phone(ErrorMessage = "Invalid phone number")]
    public string? ContactNumber { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Invalid category")]
    public int CategoryId { get; set; }
}