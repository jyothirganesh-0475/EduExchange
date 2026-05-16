using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using EduExchange.API.Data;
using EduExchange.API.Models;

namespace EduExchange.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _db;
    public NotificationsController(AppDbContext db) => _db = db;

    // GET api/notifications/{userId} — get all unread notifications for user
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetUnread(int userId)
    {
        var notifications = await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
        return Ok(notifications);
    }

    // PUT api/notifications/{userId}/mark-read — mark all as read
    [HttpPut("{userId}/mark-read")]
    public async Task<IActionResult> MarkAllRead(int userId)
    {
        var unread = await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();
        unread.ForEach(n => n.IsRead = true);
        await _db.SaveChangesAsync();
        return Ok();
    }

    // PUT api/notifications/{id}/read — mark single as read
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var n = await _db.Notifications.FindAsync(id);
        if (n == null) return NotFound();
        n.IsRead = true;
        await _db.SaveChangesAsync();
        return Ok();
    }
}