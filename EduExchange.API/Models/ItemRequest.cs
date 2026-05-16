namespace EduExchange.API.Models;

public class ItemRequest
{
    public int     ItemRequestId { get; set; }
    public int     ItemId        { get; set; }
    public int     RequesterId   { get; set; }
    public string  Status        { get; set; } = "Pending";
    public string? Message       { get; set; }
    public DateTime CreatedAt    { get; set; } = DateTime.UtcNow;

    public Item? Item      { get; set; }
    public User? Requester { get; set; }
}