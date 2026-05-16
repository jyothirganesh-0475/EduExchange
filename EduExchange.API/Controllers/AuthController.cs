using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using EduExchange.API.Data;
using EduExchange.API.DTOs;
using EduExchange.API.Models;
using EduExchange.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace EduExchange.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
private readonly AppDbContext _context;
private readonly IConfiguration _config;
private readonly IGoogleTokenValidator _googleValidator;
private readonly IEmailService _emailService; // Add this field

public AuthController(
    AppDbContext context,
    IConfiguration config,
    IGoogleTokenValidator googleValidator,
    IEmailService emailService) // Add this parameter
{
    _context = context;
    _config = config;
    _googleValidator = googleValidator;
    _emailService = emailService; // Assign it
}

    // ── POST /api/auth/register ───────────────────────────────────────────────
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest("An account with this email already exists.");

        if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
            return BadRequest("This username is already taken.");

        var user = new User
        {
            Username     = dto.Username,
            Email        = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Registration successful! Please log in." });
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user == null || string.IsNullOrEmpty(user.PasswordHash))
        {
            // Account exists but was created via Google
            if (user != null && user.IsGoogleUser)
                return BadRequest("This account uses Google Sign-In. Please sign in with Google.");

            return Unauthorized("Invalid email or password.");
        }

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized("Invalid email or password.");

        return Ok(new AuthResponseDto
{
    Token          = GenerateJwt(user),
    UserId         = user.UserId,
    Username       = user.Username,
    Email          = user.Email,
    FullName       = user.FullName,        // ← ADD
    About          = user.About,           // ← ADD
    EducationLevel = user.EducationLevel,
    City           = user.City,
    ProfilePicture = user.ProfilePicture   // ← ADD
});
    }

    // ── POST /api/auth/google ─────────────────────────────────────────────────
    // Angular sends the Google ID token here after user signs in with Google
    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<IActionResult> GoogleSignIn([FromBody] GoogleAuthDto dto)
    {
        // 1. Verify the ID token with Google's servers
        var payload = await _googleValidator.ValidateAsync(dto.IdToken);
        if (payload == null)
            return Unauthorized("Invalid Google token. Please try again.");

        // 2. Check if user already exists by GoogleId or Email
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.GoogleId == payload.Subject
                                   || u.Email    == payload.Email);

        bool isNewUser = false;

        if (user == null)
        {
            // 3a. New user — create account automatically
            isNewUser = true;

            // Generate a unique username from their Google name
            var baseUsername = (payload.GivenName ?? payload.Email.Split('@')[0])
                .ToLower()
                .Replace(" ", "_");

            var username = baseUsername;
            int suffix   = 1;
            while (await _context.Users.AnyAsync(u => u.Username == username))
                username = $"{baseUsername}_{suffix++}";

            user = new User
            {
                Username       = username,
                Email          = payload.Email,
                GoogleId       = payload.Subject,
                ProfilePicture = payload.Picture,
                IsGoogleUser   = true,
                PasswordHash   = null   // no password for Google users
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        else
        {
            // 3b. Existing user — update Google fields if missing
            if (string.IsNullOrEmpty(user.GoogleId))
            {
                user.GoogleId       = payload.Subject;
                user.IsGoogleUser   = true;
                user.ProfilePicture = payload.Picture;
                await _context.SaveChangesAsync();
            }
        }

        // 4. Issue JWT same as normal login
        return Ok(new GoogleAuthResponseDto
        {
            Token          = GenerateJwt(user),
            UserId         = user.UserId,
            Username       = user.Username,
            Email          = user.Email,
            IsNewUser      = isNewUser,
            ProfilePicture = user.ProfilePicture
        });
    }

    // ── JWT Generator ─────────────────────────────────────────────────────────
    private string GenerateJwt(User user)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email,          user.Email),
            new Claim(ClaimTypes.Name,           user.Username)
        };

        var token = new JwtSecurityToken(
            issuer:             _config["Jwt:Issuer"],
            audience:           _config["Jwt:Audience"],
            claims:             claims,
            expires:            DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }


    // Add these to AuthController.cs

// ── POST /api/auth/forgot-password ────────────────────────────────────────
[HttpPost("forgot-password")]
[AllowAnonymous]
public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
{
    if (!ModelState.IsValid) return BadRequest(ModelState);
    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
    
    if (user == null) return Ok(new { message = "If an account exists, a reset link has been sent." });

    user.PasswordResetToken = Guid.NewGuid().ToString();
    user.ResetTokenExpires = DateTime.UtcNow.AddHours(1); 
    await _context.SaveChangesAsync();

    var clientBaseUrl = _config["ClientApp:BaseUrl"] ?? "http://localhost:4200";
    var resetLink = $"{clientBaseUrl}/reset-password?token={user.PasswordResetToken}&email={user.Email}";

    // Construct the HTML Email
    string emailBody = $@"
        <div style='font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;'>
            <h2 style='color: #6c63ff;'>EduExchange Password Reset</h2>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{resetLink}' style='background-color: #6c63ff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;'>Reset Password</a>
            </div>
            <p style='font-size: 12px; color: #777;'>This link will expire in 1 hour. If you didn't request this, you can ignore this email.</p>
        </div>";

    // 4. Use the injected service to send the real email
    await _emailService.SendEmailAsync(user.Email, "Reset Your EduExchange Password", emailBody);

    return Ok(new { message = "Reset link sent successfully." });
}

// ── POST /api/auth/reset-password ─────────────────────────────────────────
[HttpPost("reset-password")]
[AllowAnonymous]
public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
{
    var user = await _context.Users.FirstOrDefaultAsync(u => 
        u.Email == dto.Email && u.PasswordResetToken == dto.Token);

    if (user == null || user.ResetTokenExpires < DateTime.UtcNow)
    {
        return BadRequest("Invalid or expired reset token.");
    }

    // 3. Update Password
    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
    
    // 4. Clear token fields so they can't be used again
    user.PasswordResetToken = null;
    user.ResetTokenExpires = null;

    await _context.SaveChangesAsync();
    return Ok(new { message = "Password has been reset successfully." });
}

// ── POST /api/auth/send-otp ───────────────────────────────────────────────
[HttpPost("send-otp")]
[AllowAnonymous]
public async Task<IActionResult> SendOtp([FromBody] SendOtpDto dto)
{
    if (!ModelState.IsValid) return BadRequest(ModelState);
    
    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
    if (user == null) return Ok(new { message = "If an account exists, an OTP has been sent." });

    // Generate 6 digit OTP
    Random rand = new Random();
    string otp = rand.Next(100000, 999999).ToString();

    user.OtpToken = otp;
    user.OtpTokenExpires = DateTime.UtcNow.AddMinutes(10); // OTP valid for 10 mins
    await _context.SaveChangesAsync();

    // Send email
    string emailBody = $@"
        <div style='font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;'>
            <h2 style='color: #6c63ff; text-align: center;'>EduExchange Password Reset</h2>
            <p style='text-align: center;'>You requested to reset your password using an OTP code.</p>
            <div style='text-align: center; margin: 30px 0;'>
                <span style='font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1a1a2e; background: #f8f9fa; padding: 10px 20px; border-radius: 8px;'>{otp}</span>
            </div>
            <p style='font-size: 12px; color: #777; text-align: center;'>This code will expire in 10 minutes. Do not share it with anyone.</p>
        </div>";

    await _emailService.SendEmailAsync(user.Email, "Your EduExchange Password Reset Code", emailBody);

    return Ok(new { message = "OTP sent successfully." });
}

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────
[HttpPost("verify-otp")]
[AllowAnonymous]
public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
{
    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email && u.OtpToken == dto.Otp);

    if (user == null || user.OtpTokenExpires < DateTime.UtcNow)
    {
        return BadRequest("Invalid or expired OTP.");
    }

    // OTP is valid! Let's clear the OTP and generate a Password Reset Token 
    // so the user can securely set a new password on the next screen.
    user.OtpToken = null;
    user.OtpTokenExpires = null;
    
    user.PasswordResetToken = Guid.NewGuid().ToString();
    user.ResetTokenExpires = DateTime.UtcNow.AddMinutes(15); 
    await _context.SaveChangesAsync();

    // Return the reset token so the frontend can pass it to the reset-password page
    return Ok(new { 
        message = "OTP verified successfully.",
        token = user.PasswordResetToken
    });
}



}