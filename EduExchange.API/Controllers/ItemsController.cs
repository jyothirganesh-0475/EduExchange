using EduExchange.API.Data;
using EduExchange.API.DTOs;
using EduExchange.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EduExchange.API.Controllers;

[ApiController]
[Route("api/items")]
[Authorize]
public class ItemsController : ControllerBase
{
    private readonly AppDbContext        _context;
    private readonly IWebHostEnvironment _env;

    public ItemsController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env     = env;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? type,
        [FromQuery] string? search,
        [FromQuery] int?    excludeOwner)
    {
        var query = _context.Items
            .Include(i => i.Owner)
            .AsQueryable();

        if (excludeOwner.HasValue)
            query = query.Where(i => i.OwnerId != excludeOwner.Value);

        if (!string.IsNullOrEmpty(type))
            query = query.Where(i => i.ItemType == type);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(i => i.Name.Contains(search) ||
                                     i.Description!.Contains(search));

        return Ok(await query.OrderByDescending(i => i.CreatedAt).ToListAsync());
    }

    [HttpGet("myitems/{ownerId}")]
    public async Task<IActionResult> GetMyItems(int ownerId)
        => Ok(await _context.Items
            .Include(i => i.Owner)
            .Where(i => i.OwnerId == ownerId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _context.Items
            .Include(i => i.Owner)
            .FirstOrDefaultAsync(i => i.ItemId == id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] ItemFormDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        string? imagePath = null;
        if (dto.Image != null && dto.Image.Length > 0)
        {
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(dto.Image.FileName)}";
            var uploads  = Path.Combine(_env.WebRootPath, "uploads", "items");
            Directory.CreateDirectory(uploads);
            var filePath = Path.Combine(uploads, fileName);
            using var stream = new FileStream(filePath, FileMode.Create);
            await dto.Image.CopyToAsync(stream);
            imagePath = $"uploads/items/{fileName}";
        }

        var item = new Item
        {
            Name          = dto.Name,
            Description   = dto.Description,
            ItemType      = dto.ItemType,
            Condition     = dto.Condition,
            ContactNumber = dto.ContactNumber,
            OwnerId       = currentUserId,
            ImagePath     = imagePath
        };

        _context.Items.Add(item);
        await _context.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateItemDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var item = await _context.Items.FindAsync(id);
        if (item == null) return NotFound();

        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        if (item.OwnerId != currentUserId) return Forbid();

        item.Name          = dto.Name;
        item.Description   = dto.Description;
        item.ItemType      = dto.ItemType;
        item.Condition     = dto.Condition;
        item.Status        = dto.Status;
        item.ContactNumber = dto.ContactNumber;

        await _context.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _context.Items.FindAsync(id);
        if (item == null) return NotFound();

        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        if (item.OwnerId != currentUserId) return Forbid();

        var requests = await _context.ItemRequests
            .Where(r => r.ItemId == id).ToListAsync();
        if (requests.Any())
            _context.ItemRequests.RemoveRange(requests);

        if (!string.IsNullOrEmpty(item.ImagePath))
        {
            var fullPath = Path.Combine(_env.WebRootPath, item.ImagePath);
            if (System.IO.File.Exists(fullPath))
                System.IO.File.Delete(fullPath);
        }

        _context.Items.Remove(item);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("requests")]
    public async Task<IActionResult> CreateRequest([FromBody] CreateItemRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var item = await _context.Items.FindAsync(dto.ItemId);
        if (item == null) return NotFound("Item not found.");
        if (item.OwnerId == currentUserId)
            return BadRequest("You cannot request your own item.");

        var existing = await _context.ItemRequests
            .FirstOrDefaultAsync(r => r.ItemId     == dto.ItemId &&
                                      r.RequesterId == currentUserId &&
                                      r.Status      == "Pending");
        if (existing != null)
            return BadRequest("You already have a pending request for this item.");

        var request = new ItemRequest
        {
            ItemId      = dto.ItemId,
            RequesterId = currentUserId,
            Message     = dto.Message,
            Status      = "Pending"
        };
        _context.ItemRequests.Add(request);
        await _context.SaveChangesAsync();

        var requester = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == currentUserId);

        _context.Notifications.Add(new Notification
        {
            UserId      = item.OwnerId,
            Message     = $"📬 {requester?.Username ?? "Someone"} requested your item '{item.Name}'!",
            Type        = "item",
            ReferenceId = request.ItemRequestId,
            IsRead      = false,
            CreatedAt   = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return Ok(request);
    }

    [HttpGet("requests/sent/{userId}")]
    public async Task<IActionResult> GetSentRequests(int userId)
        => Ok(await _context.ItemRequests
            .Include(r => r.Item).ThenInclude(i => i!.Owner)
            .Include(r => r.Requester)
            .Where(r => r.RequesterId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync());

    [HttpGet("requests/received/{userId}")]
    public async Task<IActionResult> GetReceivedRequests(int userId)
        => Ok(await _context.ItemRequests
            .Include(r => r.Item)
            .Include(r => r.Requester)
            .Where(r => r.Item!.OwnerId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync());

    [HttpPut("requests/{id}")]
    public async Task<IActionResult> UpdateRequestStatus(
        int id, [FromBody] UpdateItemRequestDto dto)
    {
        var request = await _context.ItemRequests
            .Include(r => r.Item)
            .FirstOrDefaultAsync(r => r.ItemRequestId == id);

        if (request == null) return NotFound();

        request.Status = dto.Status;

        if (dto.Status == "Approved" && request.Item != null)
            request.Item.Status = "Unavailable";

        var itemName = request.Item?.Name ?? "an item";
        var message  = dto.Status switch
        {
            "Approved"  => $"✅ Your request for '{itemName}' was approved!",
            "Rejected"  => $"❌ Your request for '{itemName}' was rejected.",
            "Completed" => $"🎉 Your exchange for '{itemName}' is completed!",
            _           => $"Your request for '{itemName}' was updated to {dto.Status}."
        };

        _context.Notifications.Add(new Notification
        {
            UserId      = request.RequesterId,
            Message     = message,
            Type        = "item",
            ReferenceId = request.ItemRequestId,
            IsRead      = false,
            CreatedAt   = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(request);
    }
}