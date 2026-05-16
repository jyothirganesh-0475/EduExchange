using Microsoft.AspNetCore.Mvc;
using EduExchange.API.Models;
using EduExchange.API.Services;
using EduExchange.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace EduExchange.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BooksController : ControllerBase
{
    private readonly IBookService        _service;
    private readonly IWebHostEnvironment _env;

    public BooksController(IBookService service, IWebHostEnvironment env)
    {
        _service = service;
        _env     = env;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? level,
        [FromQuery] string? search,
        [FromQuery] int?    excludeOwner)
        => Ok(await _service.GetAllAsync(level, search, excludeOwner));

    [HttpGet("mybooks/{ownerId}")]
    public async Task<IActionResult> GetMyBooks(int ownerId)
        => Ok(await _service.GetMyBooksAsync(ownerId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var book = await _service.GetByIdAsync(id);
        return book == null ? NotFound() : Ok(book);
    }

[HttpPost("with-image")]
[Consumes("multipart/form-data")]
public async Task<IActionResult> CreateWithImage([FromForm] BookFormDto dto)
{
    if (!ModelState.IsValid) return BadRequest(ModelState);

    // Read owner from JWT — never trust client-supplied OwnerId
    var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    var book = new Book
    {
        Title         = dto.Title,
        Author        = dto.Author,
        Subject       = dto.Subject       ?? "",
        AcademicLevel = dto.AcademicLevel ?? "",
        Condition     = dto.Condition     ?? "",
        Status        = "Available",
        ContactNumber = dto.ContactNumber,
        OwnerId       = currentUserId,   // ← from JWT, not dto
        CategoryId    = dto.CategoryId
    };

    if (dto.Image != null && dto.Image.Length > 0)
    {
        var uploadsPath = Path.Combine(_env.WebRootPath, "uploads", "books");
        Directory.CreateDirectory(uploadsPath);

        var ext      = Path.GetExtension(dto.Image.FileName);
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await dto.Image.CopyToAsync(stream);

        book.ImagePath = $"uploads/books/{fileName}";
    }

    var created = await _service.CreateAsync(book);
    return CreatedAtAction(nameof(GetById), new { id = created.BookId }, created);
}

[HttpPut("{id}")]
public async Task<IActionResult> Update(int id, [FromBody] UpdateBookDto dto)
{
    var existing = await _service.GetByIdAsync(id);
    if (existing == null) return NotFound();

    // Only the owner can update
    var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    if (existing.OwnerId != currentUserId) return Forbid();

    existing.Title         = dto.Title;
    existing.Author        = dto.Author;
    existing.Subject       = dto.Subject       ?? existing.Subject;
    existing.AcademicLevel = dto.AcademicLevel ?? existing.AcademicLevel;
    existing.Condition     = dto.Condition     ?? existing.Condition;
    existing.Status        = dto.Status        ?? existing.Status;
    existing.ContactNumber = dto.ContactNumber ?? existing.ContactNumber;
    existing.CategoryId    = dto.CategoryId;

    var updated = await _service.UpdateAsync(id, existing);
    return Ok(updated);
}

// PUT: api/books/{id}/with-image (multipart/form-data — edit with optional new image)
[HttpPut("{id}/with-image")]
[Consumes("multipart/form-data")]
public async Task<IActionResult> UpdateWithImage(int id, [FromForm] BookFormDto dto)
{
    if (!ModelState.IsValid) return BadRequest(ModelState);

    var existing = await _service.GetByIdAsync(id);
    if (existing == null) return NotFound();

    // Only the owner can update
    var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    if (existing.OwnerId != currentUserId) return Forbid();

    existing.Title         = dto.Title;
    existing.Author        = dto.Author;
    existing.Subject       = dto.Subject       ?? existing.Subject;
    existing.AcademicLevel = dto.AcademicLevel ?? existing.AcademicLevel;
    existing.Condition     = dto.Condition     ?? existing.Condition;
    existing.ContactNumber = dto.ContactNumber ?? existing.ContactNumber;
    existing.CategoryId    = dto.CategoryId;

    if (dto.Image != null && dto.Image.Length > 0)
    {
        // Delete old image if exists
        if (!string.IsNullOrEmpty(existing.ImagePath))
        {
            var oldPath = Path.Combine(_env.WebRootPath, existing.ImagePath);
            if (System.IO.File.Exists(oldPath))
                System.IO.File.Delete(oldPath);
        }

        var uploadsPath = Path.Combine(_env.WebRootPath, "uploads", "books");
        Directory.CreateDirectory(uploadsPath);

        var ext      = Path.GetExtension(dto.Image.FileName);
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await dto.Image.CopyToAsync(stream);

        existing.ImagePath = $"uploads/books/{fileName}";
    }

    var updated = await _service.UpdateAsync(id, existing);
    return Ok(updated);
}

[HttpDelete("{id}")]
public async Task<IActionResult> Delete(int id)
{
    var book = await _service.GetByIdAsync(id);
    if (book == null) return NotFound();

    // Only the owner can delete
    var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    if (book.OwnerId != currentUserId) return Forbid();

    var result = await _service.DeleteAsync(id);
    return result ? NoContent() : NotFound();
}
}  