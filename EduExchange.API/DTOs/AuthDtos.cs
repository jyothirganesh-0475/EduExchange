using System.ComponentModel.DataAnnotations;

namespace EduExchange.API.DTOs;

public class RegisterDto
{
    [Required(ErrorMessage = "Username is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be 3–50 characters")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
    public string Password { get; set; } = string.Empty;

    public string? EducationLevel { get; set; }
    public string? City           { get; set; }
}

public class LoginDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string  Token          { get; set; } = string.Empty;
    public string  Username       { get; set; } = string.Empty;
    public int     UserId         { get; set; }
    public string  Email          { get; set; } = string.Empty;
    public string? FullName       { get; set; }   // ← ADD
    public string? About          { get; set; }   // ← ADD
    public string? EducationLevel { get; set; }
    public string? City           { get; set; }
    public string? ProfilePicture { get; set; }   // ← ADD
}

// DTOs/AuthDtos.cs
public class ResetPasswordDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Token is required")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
    public string NewPassword { get; set; } = string.Empty;
}

public class ForgotPasswordDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;
}

public class SendOtpDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;
}

public class VerifyOtpDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "OTP is required")]
    public string Otp { get; set; } = string.Empty;
}