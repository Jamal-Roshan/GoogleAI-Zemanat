using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationCertPortal.Models;

[Table("Personnel")]
public class Personnel
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string PersonnelCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(15)]
    public string NationalCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string FatherName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string AccountNumber { get; set; } = string.Empty;

    [MaxLength(50)]
    public string ShebaNumber { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Mobile { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Department { get; set; } = "مدیریت آموزش و پرورش ملایر";

    [MaxLength(100)]
    public string JobTitle { get; set; } = "شاغل";

    // مبالغ مالی
    public decimal BaseSalary { get; set; }           // حکم حقوقی
    public decimal NetIncome { get; set; }            // خالص دریافتی
    public decimal TotalActiveDeductions { get; set; } // مانده کل تعهدات فعلی

    public PersonnelStatus Status { get; set; } = PersonnelStatus.Active;

    [MaxLength(300)]
    public string? StatusReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation property
    public virtual ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();
}
