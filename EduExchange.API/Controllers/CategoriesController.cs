using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduExchange.API.Data;
using Microsoft.AspNetCore.Authorization;

namespace EduExchange.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;
    public CategoriesController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _context.Categories.ToListAsync());
}