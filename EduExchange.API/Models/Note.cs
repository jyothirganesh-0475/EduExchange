namespace EduExchange.API.Models;

public class Note
{
    public int NoteId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? AcademicLevel { get; set; }
    public string? FilePath { get; set; }
    public int UploaderId { get; set; }
    public User? Uploader { get; set; }
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}