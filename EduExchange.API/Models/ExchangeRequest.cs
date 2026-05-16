using System.ComponentModel.DataAnnotations;

namespace EduExchange.API.Models;

public class ExchangeRequest
{
    [Key]
    public int RequestId { get; set; }
    public int BookId { get; set; }
    public Book? Book { get; set; }
    public int RequesterId { get; set; }
    public User? Requester { get; set; }
    public string Status { get; set; } = "Pending";
    public string? Message { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}