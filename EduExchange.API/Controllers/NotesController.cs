using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduExchange.API.Data;
using EduExchange.API.Models;
using EduExchange.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace EduExchange.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotesController : ControllerBase
{
    private readonly AppDbContext        _context;
    private readonly IWebHostEnvironment _env;

    public NotesController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env     = env;
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    // ── GET all notes ─────────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _context.Notes
            .Include(n => n.Uploader)
            .ToListAsync());

    // ── GET my notes ──────────────────────────────────────────────────────────
    [HttpGet("mynotes/{uploaderId}")]
    public async Task<IActionResult> GetMyNotes(int uploaderId)
        => Ok(await _context.Notes
            .Include(n => n.Uploader)
            .Where(n => n.UploaderId == uploaderId)
            .ToListAsync());

    // ── POST upload note ──────────────────────────────────────────────────────
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload([FromForm] NoteUploadDto dto)
    {
        if (dto.File == null || dto.File.Length == 0)
            return BadRequest("File is required.");

        // Read uploader from JWT
        var uploaderId = GetCurrentUserId();
        if (uploaderId == 0) return Unauthorized();

        var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads");
        Directory.CreateDirectory(uploadsFolder);

        var ext      = Path.GetExtension(dto.File.FileName);
        var rawName  = Path.GetFileNameWithoutExtension(dto.File.FileName);
        var safeName = System.Text.RegularExpressions.Regex.Replace(
                           rawName, @"[^a-zA-Z0-9\-_]", "_");
        var fileName = $"{Guid.NewGuid()}_{safeName}{ext}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
            await dto.File.CopyToAsync(stream);

        var note = new Note
        {
            Title         = dto.Title,
            Subject       = dto.Subject,
            AcademicLevel = dto.AcademicLevel,
            FilePath      = $"uploads/{fileName}",
            UploaderId    = uploaderId,   // ← from JWT, not dto
            CategoryId    = dto.CategoryId
        };

        _context.Notes.Add(note);
        await _context.SaveChangesAsync();
        return Ok(note);
    }

    // ── DELETE note ───────────────────────────────────────────────────────────
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var note = await _context.Notes.FindAsync(id);
        if (note == null) return NotFound();

        // Only the uploader can delete
        var currentUserId = GetCurrentUserId();
        if (currentUserId == 0) return Unauthorized();
        if (note.UploaderId != currentUserId) return Forbid();

        if (!string.IsNullOrEmpty(note.FilePath))
        {
            var fullPath = Path.Combine(_env.WebRootPath, note.FilePath);
            if (System.IO.File.Exists(fullPath))
                System.IO.File.Delete(fullPath);
        }

        _context.Notes.Remove(note);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}