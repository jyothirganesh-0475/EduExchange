using EduExchange.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using EduExchange.API.DTOs;

namespace EduExchange.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    // ── PUT /api/users/{id}/profile ───────────────────────────────────────────
   [HttpPut("{id}/profile")]
public async Task<IActionResult> UpdateProfile(int id, [FromBody] UpdateProfileDto dto)
{
    // Only the authenticated user can update their own profile
    var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    if (currentUserId != id) return Forbid();

    var user = await _context.Users.FindAsync(id);
    if (user == null) return NotFound();

    if (!string.IsNullOrEmpty(dto.FullName))
        user.FullName = dto.FullName;

    if (!string.IsNullOrEmpty(dto.EducationLevel))
        user.EducationLevel = dto.EducationLevel;

    if (!string.IsNullOrEmpty(dto.City))
        user.City = dto.City;

    if (!string.IsNullOrEmpty(dto.About))
        user.About = dto.About;

    await _context.SaveChangesAsync();
    return Ok(new { message = "Profile updated." });
}

[HttpGet("{id}")]
public async Task<IActionResult> GetUser(int id)
{
    var user = await _context.Users
        .Select(u => new {
            u.UserId,
            u.Username,
            u.Email,
            u.FullName,        // ← ADD
            u.About,           // ← ADD
            u.EducationLevel,
            u.City,
            u.ProfilePicture,
            u.IsGoogleUser,
            u.CreatedAt
        })
        .FirstOrDefaultAsync(u => u.UserId == id);

    return user == null ? NotFound() : Ok(user);
}

}