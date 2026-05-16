using System.ComponentModel.DataAnnotations;

namespace EduExchange.API.DTOs;

public class GoogleAuthDto
{
    [Required]
    public string IdToken { get; set; } = "";
}

public class GoogleAuthResponseDto
{
    public string  Token          { get; set; } = "";
    public int     UserId         { get; set; }
    public string  Username       { get; set; } = "";
    public string  Email          { get; set; } = "";
    public string? FullName { get; set; }
    public bool    IsNewUser      { get; set; }
    public string? ProfilePicture { get; set; }
}