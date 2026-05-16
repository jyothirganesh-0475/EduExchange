namespace EduExchange.API.Models;

public class Book
{
    public int BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Author { get; set; }
    public string? Subject { get; set; }
    public string? AcademicLevel { get; set; }
    public string? Condition { get; set; }
    public string Status { get; set; } = "Available";
    public string? ImagePath { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? ContactNumber { get; set; }  

    public int OwnerId { get; set; }
    public User? Owner { get; set; }

    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
}