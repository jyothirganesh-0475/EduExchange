using System.ComponentModel.DataAnnotations;

namespace EduExchange.API.DTOs;

// Used for POST /api/notes  (multipart/form-data)
public class NoteUploadDto
{
    [Required(ErrorMessage = "Title is required")]
    [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Subject is required")]
    public string Subject { get; set; } = string.Empty;

    [Required(ErrorMessage = "Academic level is required")]
    public string AcademicLevel { get; set; } = string.Empty;

    // ← UploaderId REMOVED — read from JWT in controller

    [Range(1, int.MaxValue, ErrorMessage = "Invalid category")]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "File is required")]
    public IFormFile File { get; set; } = null!;
}