// ════════════════════════════════════════════════════════════════════════════
// File: EduExchange.API/GenerateBookCovers.cs
// Run this as a one-time C# script using: dotnet script GenerateBookCovers.csx
// OR just paste the GenerateCovers() call in Program.cs temporarily
//
// EASIER: Just run the GenerateCovers endpoint below — hit it once from browser
// GET http://localhost:5141/api/dev/generate-covers
// ════════════════════════════════════════════════════════════════════════════

// Add this temporary controller to your project — delete after running once

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduExchange.API.Controllers;

[ApiController]
[Route("api/dev")]
[Authorize]
public class DevController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public DevController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpGet("generate-covers")]
    public IActionResult GenerateCovers()
    {
        // Only allow in Development environment
        if (!_env.IsDevelopment())
            return NotFound();
        var folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "books", "covers");
        Directory.CreateDirectory(folder);

        var books = new[]
        {
            ("clrs.svg",            "#1a472a", "Introduction\nto Algorithms",        "Cormen et al."),
            ("os_concepts.svg",     "#1e3a5f", "Operating System\nConcepts",         "Silberschatz"),
            ("computer_networks.svg","#0d2137","Computer\nNetworks",                 "Tanenbaum"),
            ("c_language.svg",      "#2c2c2c", "The C\nProgramming\nLanguage",       "Kernighan & Ritchie"),
            ("physics.svg",         "#b34700", "Fundamentals\nof Physics",           "Halliday & Resnick"),
            ("kreyszig.svg",        "#8b0000", "Advanced Engineering\nMathematics",  "Kreyszig"),
            ("discrete_math.svg",   "#4a0080", "Discrete\nMathematics",             "Kenneth Rosen"),
            ("dbms.svg",            "#00695c", "Database\nManagement\nSystems",      "Ramakrishnan"),
            ("python.svg",          "#1565c0", "Automate the\nBoring Stuff\nwith Python", "Al Sweigart"),
            ("linear_algebra.svg",  "#003366", "Introduction to\nLinear Algebra",   "Gilbert Strang"),
            ("signals.svg",         "#311b92", "Signals\nand Systems",              "Oppenheim"),
            ("ai_modern.svg",       "#0a2342", "Artificial\nIntelligence",          "Russell & Norvig"),
            ("clean_code.svg",      "#212121", "Clean\nCode",                       "Robert C. Martin"),
            ("thermodynamics.svg",  "#4e342e", "Thermodynamics\nAn Engineering\nApproach", "Cengel"),
            ("digital_design.svg",  "#1b5e20", "Digital\nDesign",                  "M. Morris Mano"),
        };

        foreach (var (filename, color, title, author) in books)
        {
            var lines = title.Split('\n');
            var textLines = string.Join("", lines.Select((line, i) =>
                $"<text x=\"150\" y=\"{160 + (i * 38)}\" font-family=\"Georgia,serif\" font-size=\"22\" font-weight=\"bold\" fill=\"white\" text-anchor=\"middle\">{System.Security.SecurityElement.Escape(line)}</text>"
            ));

            var svg = $@"<svg xmlns=""http://www.w3.org/2000/svg"" width=""300"" height=""420"" viewBox=""0 0 300 420"">
  <defs>
    <linearGradient id=""bg"" x1=""0%"" y1=""0%"" x2=""100%"" y2=""100%"">
      <stop offset=""0%"" style=""stop-color:{color};stop-opacity:1"" />
      <stop offset=""100%"" style=""stop-color:{color}99;stop-opacity:1"" />
    </linearGradient>
    <linearGradient id=""stripe"" x1=""0%"" y1=""0%"" x2=""0%"" y2=""100%"">
      <stop offset=""0%"" style=""stop-color:#ffffff;stop-opacity:0.15"" />
      <stop offset=""100%"" style=""stop-color:#ffffff;stop-opacity:0"" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width=""300"" height=""420"" fill=""url(#bg)""/>

  <!-- Top stripe -->
  <rect width=""300"" height=""80"" fill=""url(#stripe)""/>

  <!-- Bottom bar -->
  <rect y=""360"" width=""300"" height=""60"" fill=""rgba(0,0,0,0.3)""/>

  <!-- Decorative lines -->
  <rect x=""20"" y=""20"" width=""260"" height=""4"" fill=""white"" opacity=""0.5"" rx=""2""/>
  <rect x=""20"" y=""396"" width=""260"" height=""4"" fill=""white"" opacity=""0.5"" rx=""2""/>

  <!-- Book icon -->
  <text x=""150"" y=""110"" font-size=""48"" text-anchor=""middle"">📚</text>

  <!-- Title -->
  {textLines}

  <!-- Author -->
  <text x=""150"" y=""385"" font-family=""Arial,sans-serif"" font-size=""14"" fill=""rgba(255,255,255,0.9)"" text-anchor=""middle"">{System.Security.SecurityElement.Escape(author)}</text>

  <!-- EduExchange watermark -->
  <text x=""150"" y=""410"" font-family=""Arial,sans-serif"" font-size=""10"" fill=""rgba(255,255,255,0.4)"" text-anchor=""middle"">EduExchange</text>
</svg>";

            var path = Path.Combine(folder, filename);
            System.IO.File.WriteAllText(path, svg);
        }

        return Ok(new {
            message = $"Generated {books.Length} book covers successfully!",
            folder  = folder,
            files   = books.Select(b => b.Item1).ToArray()
        });
    }
}