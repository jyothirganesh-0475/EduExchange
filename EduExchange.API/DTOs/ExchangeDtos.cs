using System.ComponentModel.DataAnnotations;

namespace EduExchange.API.DTOs;

// Used for POST /api/exchange
public class CreateExchangeDto
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid book")]
    public int BookId { get; set; }

    // ← RequesterId REMOVED — read from JWT in controller

    [StringLength(500, ErrorMessage = "Message cannot exceed 500 characters")]
    public string? Message { get; set; }
}

// Used for PUT /api/exchange/{id}
public class UpdateExchangeDto
{
    [Required(ErrorMessage = "Status is required")]
    public string Status { get; set; } = string.Empty;
}