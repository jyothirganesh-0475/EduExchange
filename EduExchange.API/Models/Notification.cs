namespace EduExchange.API.Models;

public class Notification
{
    public int    NotificationId { get; set; }
    public int    UserId         { get; set; }   // who receives this notification
    public string Message        { get; set; } = "";
    public string Type           { get; set; } = ""; // "exchange" | "item"
    public int?   ReferenceId    { get; set; }   // requestId or itemRequestId
    public bool   IsRead         { get; set; } = false;
    public DateTime CreatedAt    { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}