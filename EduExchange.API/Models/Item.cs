namespace EduExchange.API.Models;

public class Item
{
    public int     ItemId        { get; set; }
    public string  Name          { get; set; } = string.Empty;
    public string? Description   { get; set; }
    public string  ItemType      { get; set; } = string.Empty; // Calculator, Drafter, Geometric Box, Other
    public string? Condition     { get; set; }
    public string  Status        { get; set; } = "Available";
    public string? ImagePath     { get; set; }
    public string? ContactNumber { get; set; }
    public int     OwnerId       { get; set; }
    public DateTime CreatedAt    { get; set; } = DateTime.UtcNow;

    public User? Owner { get; set; }
    public ICollection<ItemRequest> ItemRequests { get; set; } = [];
}