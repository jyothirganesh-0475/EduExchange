using System.ComponentModel.DataAnnotations;

namespace EduExchange.API.DTOs;

public class ItemFormDto
{
    [Required] [StringLength(200)]
    public string  Name          { get; set; } = "";

    [StringLength(500)]
    public string? Description   { get; set; }

    [Required]
    public string  ItemType      { get; set; } = "";

    public string? Condition     { get; set; }

    [Phone]
    public string? ContactNumber { get; set; }

    // ← OwnerId REMOVED — read from JWT in controller

    public IFormFile? Image      { get; set; }
}

public class UpdateItemDto
{
    [Required] [StringLength(200)]
    public string  Name          { get; set; } = "";

    [StringLength(500)]
    public string? Description   { get; set; }

    [Required]
    public string  ItemType      { get; set; } = "";

    public string? Condition     { get; set; }
    public string  Status        { get; set; } = "Available";

    [Phone]
    public string? ContactNumber { get; set; }
}

public class CreateItemRequestDto
{
    [Required] [Range(1, int.MaxValue)]
    public int     ItemId  { get; set; }

    // ← RequesterId REMOVED — read from JWT in controller

    [StringLength(500)]
    public string? Message { get; set; }
}

public class UpdateItemRequestDto
{
    [Required]
    public string Status { get; set; } = ""; // Approved / Rejected / Completed
}