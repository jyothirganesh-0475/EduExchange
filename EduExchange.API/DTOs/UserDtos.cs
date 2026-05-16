using System.ComponentModel.DataAnnotations;

namespace EduExchange.API.DTOs;

public class UpdateProfileDto
{
    [StringLength(100)]
    public string? FullName { get; set; }

    [StringLength(100)]
    public string? EducationLevel { get; set; }

    [StringLength(100)]
    public string? City { get; set; }

    [StringLength(500)]
    public string? About { get; set; }   // ← ADD
}