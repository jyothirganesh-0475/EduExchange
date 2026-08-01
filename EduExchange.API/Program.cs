using EduExchange.API.Data;
using EduExchange.API.Repositories;
using EduExchange.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Database (Dynamic Provider based on Environment) ──────────────────────────
// ── Database (Bulletproof Render/Local Routing with Protocol Patch) ───────────
var renderDbUrl = Environment.GetEnvironmentVariable("RENDER_DB_URL");

if (string.IsNullOrEmpty(renderDbUrl))
{
    // NO Render URL found -> Running locally on your laptop
    builder.Services.AddDbContext<AppDbContext>(opt =>
        opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
}
else
{
    // Render URL FOUND -> Live environment. Re-format for Npgsql.
    var formattedUrl = renderDbUrl;
    
    // Standardize protocol so Uri class handles it properly
    if (formattedUrl.StartsWith("postgresql://"))
    {
        formattedUrl = "postgres://" + formattedUrl.Substring("postgresql://".Length);
    }

    var databaseUri = new Uri(formattedUrl);
    var userInfo = databaseUri.UserInfo.Split(':');

    var username = userInfo[0];
    var password = userInfo.Length > 1 ? userInfo[1] : string.Empty;
    var databaseName = databaseUri.LocalPath.TrimStart('/');
    var host = databaseUri.Host;
    var port = databaseUri.Port != -1 ? databaseUri.Port : 5432;

    var npgsqlConnString = $"Host={host};Port={port};Database={databaseName};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=True;";

    builder.Services.AddDbContext<AppDbContext>(opt =>
        opt.UseNpgsql(npgsqlConnString));
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
var productionOrigin = builder.Configuration["ClientApp:BaseUrl"] ?? "https://edu-exchange-green.vercel.app";

builder.Services.AddCors(opt =>
    opt.AddPolicy("AllowAngular", p =>
        p.WithOrigins(
            "http://localhost:4200",
            "https://edu-exchange-green.vercel.app",
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