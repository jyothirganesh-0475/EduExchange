
namespace EduExchange.API.Models;

public class User
{
    public int     UserId         { get; set; }
    public string  Username       { get; set; } = string.Empty;
    public string  Email          { get; set; } = string.Empty;
    public string? PasswordHash   { get; set; }
    public string? FullName       { get; set; }   // ← ADD
    public string? About          { get; set; }   // ← ADD
    public string? EducationLevel { get; set; }
    public string? City           { get; set; }
    public DateTime CreatedAt     { get; set; } = DateTime.UtcNow;

    public string? GoogleId       { get; set; }
    public string? ProfilePicture { get; set; }
    public bool    IsGoogleUser   { get; set; } = false;

    public string? PasswordResetToken { get; set; }
    public DateTime? ResetTokenExpires { get; set; }

    public string? OtpToken { get; set; }
    public DateTime? OtpTokenExpires { get; set; }

    public ICollection<Book>        Books        { get; set; } = [];
    public ICollection<Note>        Notes        { get; set; } = [];
    public ICollection<Item>        Items        { get; set; } = [];
    public ICollection<ItemRequest> ItemRequests { get; set; } = [];
}