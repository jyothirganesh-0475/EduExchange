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
public class ExchangeController : ControllerBase
{
    private readonly AppDbContext _context;
    public ExchangeController(AppDbContext context) => _context = context;

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    // ── GET all exchange requests ─────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _context.ExchangeRequests
            .Include(e => e.Book)
            .Include(e => e.Requester)
            .ToListAsync());

    // ── GET requests sent by current user ─────────────────────────────────────
    [HttpGet("sent")]
    public async Task<IActionResult> GetSent()
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        return Ok(await _context.ExchangeRequests
            .Include(e => e.Book)
            .Include(e => e.Requester)
            .Where(e => e.RequesterId == userId)
            .ToListAsync());
    }

    // ── GET requests received by current user (on their books) ────────────────
    [HttpGet("received")]
    public async Task<IActionResult> GetReceived()
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        return Ok(await _context.ExchangeRequests
            .Include(e => e.Book)
            .Include(e => e.Requester)
            .Where(e => e.Book!.OwnerId == userId)
            .ToListAsync());
    }

    // ── POST create exchange request ──────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExchangeDto dto)
    {
        var requesterId = GetCurrentUserId();
        if (requesterId == 0) return Unauthorized();

        // Fetch book first before saving anything
        var book = await _context.Books
            .FirstOrDefaultAsync(b => b.BookId == dto.BookId);
        if (book == null) return NotFound("Book not found.");

        // Cannot request your own book
        if (book.OwnerId == requesterId)
            return BadRequest("You cannot request your own book.");

        // Check for duplicate pending request
        var exists = await _context.ExchangeRequests
            .AnyAsync(r => r.BookId      == dto.BookId &&
                           r.RequesterId == requesterId &&
                           r.Status      == "Pending");
        if (exists)
            return BadRequest("You already have a pending request for this book.");

        var request = new ExchangeRequest
        {
            BookId      = dto.BookId,
            RequesterId = requesterId,
            Status      = "Pending",
            Message     = dto.Message
        };

        _context.ExchangeRequests.Add(request);
        await _context.SaveChangesAsync();

        var requester = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == requesterId);

        _context.Notifications.Add(new Notification
        {
            UserId      = book.OwnerId,
            Message     = $"📬 {requester?.Username ?? "Someone"} requested your book '{book.Title}'!",
            Type        = "exchange",
            ReferenceId = request.RequestId,
            IsRead      = false,
            CreatedAt   = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), request);
    }

    // ── PUT update exchange request status ────────────────────────────────────
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateExchangeDto dto)
    {
        var request = await _context.ExchangeRequests
            .Include(e => e.Book)
            .FirstOrDefaultAsync(e => e.RequestId == id);

        if (request == null) return NotFound();

        // Only the book owner can approve/reject/complete
        var currentUserId = GetCurrentUserId();
        if (request.Book?.OwnerId != currentUserId)
            return Forbid();

        request.Status = dto.Status;

        var bookTitle = request.Book?.Title ?? "a book";
        var message   = dto.Status switch
        {
            "Approved"  => $"✅ Your request for '{bookTitle}' was approved!",
            "Rejected"  => $"❌ Your request for '{bookTitle}' was rejected.",
            "Completed" => $"🎉 Your exchange for '{bookTitle}' is completed!",
            _           => $"Your request for '{bookTitle}' was updated to {dto.Status}."
        };

        _context.Notifications.Add(new Notification
        {
            UserId      = request.RequesterId,
            Message     = message,
            Type        = "exchange",
            ReferenceId = request.RequestId,
            IsRead      = false,
            CreatedAt   = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(request);
    }
}