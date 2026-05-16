namespace EduExchange.API.Models;

public class Category
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? Domain { get; set; }
}