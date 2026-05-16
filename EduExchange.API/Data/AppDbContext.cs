using Microsoft.EntityFrameworkCore;
using EduExchange.API.Models;

namespace EduExchange.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ItemRequest>()
            .HasOne(r => r.Item)
            .WithMany(i => i.ItemRequests)
            .HasForeignKey(r => r.ItemId)
            .OnDelete(DeleteBehavior.Cascade);   // deleting item removes requests

        modelBuilder.Entity<ItemRequest>()
            .HasOne(r => r.Requester)
            .WithMany()
            .HasForeignKey(r => r.RequesterId)
            .OnDelete(DeleteBehavior.NoAction);  // breaks the cycle
    }

    public DbSet<User>            Users         { get; set; }
    public DbSet<Book>            Books         { get; set; }
    public DbSet<Category>        Categories    { get; set; }
    public DbSet<Note>            Notes         { get; set; }
    public DbSet<ExchangeRequest> ExchangeRequests { get; set; }
    public DbSet<Item>            Items         { get; set; }
    public DbSet<ItemRequest>     ItemRequests  { get; set; }
    public DbSet<Notification>    Notifications { get; set; }
}