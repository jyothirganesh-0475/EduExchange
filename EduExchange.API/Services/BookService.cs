using EduExchange.API.Models;
using EduExchange.API.Repositories;

namespace EduExchange.API.Services;

public interface IBookService
{
    Task<IEnumerable<Book>> GetAllAsync(string? level, string? search, int? excludeOwner);
    Task<IEnumerable<Book>> GetMyBooksAsync(int ownerId);
    Task<Book?> GetByIdAsync(int id);
    Task<Book> CreateAsync(Book book);
    Task<Book?> UpdateAsync(int id, Book book);
    Task<bool> DeleteAsync(int id);
}

public class BookService : IBookService
{
    private readonly IBookRepository _repo;
    public BookService(IBookRepository repo) => _repo = repo;

    public Task<IEnumerable<Book>> GetAllAsync(string? level, string? search, int? excludeOwner)
        => _repo.GetAllAsync(level, search, excludeOwner);

    public Task<IEnumerable<Book>> GetMyBooksAsync(int ownerId)
        => _repo.GetMyBooksAsync(ownerId);

    public Task<Book?> GetByIdAsync(int id)
        => _repo.GetByIdAsync(id);

    public Task<Book> CreateAsync(Book book)
        => _repo.CreateAsync(book);

    public Task<Book?> UpdateAsync(int id, Book book)
        => _repo.UpdateAsync(id, book);

    public Task<bool> DeleteAsync(int id)
        => _repo.DeleteAsync(id);
}