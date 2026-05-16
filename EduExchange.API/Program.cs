using EduExchange.API.Data;
using EduExchange.API.Repositories;
using EduExchange.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Database (Dynamic Provider based on Environment) ──────────────────────────
if (builder.Environment.IsDevelopment())
{
    // Use SQL Server locally (Server=. = default local SQL Server instance)
    builder.Services.AddDbContext<AppDbContext>(opt =>
        opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
}
else
{
    // Use PostgreSQL when deployed on Render.
    // Render sets DATABASE_URL automatically; fall back to appsettings if not present.
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    var pgConnStr   = !string.IsNullOrEmpty(databaseUrl)
        ? databaseUrl
        : builder.Configuration.GetConnectionString("DefaultConnection");

    builder.Services.AddDbContext<AppDbContext>(opt =>
        opt.UseNpgsql(pgConnStr));
}

// ── MVC Architecture ──────────────────────────────────────────────────────────
builder.Services.AddScoped<IBookRepository, BookRepository>();
builder.Services.AddScoped<IBookService, BookService>();
builder.Services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();
builder.Services.AddScoped<IEmailService, EmailService>();

// ── JWT Authentication ────────────────────────────────────────────────────────
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(opt =>
{
    opt.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = builder.Configuration["Jwt:Issuer"],
        ValidAudience            = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey         = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
});

builder.Services.AddAuthorization();

// ── Controllers + JSON ────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        opt.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Production origin is read from appsettings.Production.json (ClientApp:BaseUrl),
// overridable via the CLIENTAPP__BASEURL environment variable on Render.
var productionOrigin = builder.Configuration["ClientApp:BaseUrl"] ?? "https://YOUR_RENDER_FRONTEND_URL";

builder.Services.AddCors(opt =>
    opt.AddPolicy("AllowAngular", p =>
        p.WithOrigins(
            "http://localhost:4200",
            productionOrigin
          )
         .AllowAnyMethod()
         .AllowAnyHeader()));

var app = builder.Build();

// ── Auto-apply database schema on startup ─────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (app.Environment.IsDevelopment())
    {
        // SQL Server dev: create all tables from the EF model if DB doesn't exist yet.
        // Does NOT require migrations — just creates the schema automatically.
        db.Database.EnsureCreated();
    }
    else
    {
        // PostgreSQL on Render: apply the InitialPostgres migration automatically.
        db.Database.Migrate();
    }
}

// ── Middleware Pipeline ───────────────────────────────────────────────────────
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowAngular");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();