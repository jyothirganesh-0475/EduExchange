using EduExchange.API.Data;
using EduExchange.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EduExchange.API.Repositories;

public interface IBookRepository
{
    Task<IEnumerable<Book>> GetAllAsync(string? level, string? search, int? excludeOwner);
    Task<IEnumerable<Book>> GetMyBooksAsync(int ownerId);
    Task<Book?> GetByIdAsync(int id);
    Task<Book> CreateAsync(Book book);
    Task<Book?> UpdateAsync(int id, Book book);
    Task<bool> DeleteAsync(int id);
}

public class BookRepository : IBookRepository
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public BookRepository(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    public async Task<IEnumerable<Book>> GetAllAsync(string? level, string? search, int? excludeOwner)
    {
        var query = _context.Books
            .Include(b => b.Owner)
            .Include(b => b.Category)
            .AsQueryable();

        if (excludeOwner.HasValue)
            query = query.Where(b => b.OwnerId != excludeOwner.Value);

        if (!string.IsNullOrEmpty(level))
            query = query.Where(b => b.AcademicLevel == level);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(b => b.Title.Contains(search) ||
                                     b.Author!.Contains(search));

        return await query.ToListAsync();
    }

    public async Task<IEnumerable<Book>> GetMyBooksAsync(int ownerId)
        => await _context.Books
            .Include(b => b.Owner)
            .Include(b => b.Category)
            .Where(b => b.OwnerId == ownerId)
            .ToListAsync();

    public async Task<Book?> GetByIdAsync(int id)
        => await _context.Books
            .Include(b => b.Owner)
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.BookId == id);

    public async Task<Book> CreateAsync(Book book)
    {
        _context.Books.Add(book);
        await _context.SaveChangesAsync();
        return book;
    }

    public async Task<Book?> UpdateAsync(int id, Book updated)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return null;

        book.Title         = updated.Title;
        book.Author        = updated.Author;
        book.Subject       = updated.Subject;
        book.AcademicLevel = updated.AcademicLevel;
        book.Condition     = updated.Condition;
        book.Status        = updated.Status;
        book.ContactNumber = updated.ContactNumber;
        book.CategoryId    = updated.CategoryId;
        if (!string.IsNullOrEmpty(updated.ImagePath))
            book.ImagePath = updated.ImagePath;

        await _context.SaveChangesAsync();
        return book;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return false;

        // Delete related exchange requests first (FK constraint)
        var exchangeRequests = await _context.ExchangeRequests
            .Where(e => e.BookId == id)
            .ToListAsync();
        if (exchangeRequests.Any())
            _context.ExchangeRequests.RemoveRange(exchangeRequests);

        // Delete physical image file if exists
        if (!string.IsNullOrEmpty(book.ImagePath))
        {
            var fullPath = Path.Combine(_env.WebRootPath, book.ImagePath);
            if (System.IO.File.Exists(fullPath))
                System.IO.File.Delete(fullPath);
        }

        _context.Books.Remove(book);
        await _context.SaveChangesAsync();
        return true;
    }
}