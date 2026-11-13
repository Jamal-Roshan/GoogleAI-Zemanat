using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationCertPortal.Models;

[Table("SystemUsers")]
public class SystemUser
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PersonnelCode { get; set; }

    public UserRoles Roles { get; set; } = UserRoles.Personnel;

    public bool IsActive { get; set; } = true;

    public bool MustChangePassword { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
}

[Table("SystemSettings")]
public class SystemSettings
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string OrgTitle { get; set; } = "مدیریت آموزش و پرورش ملایر";

    [MaxLength(150)]
    public string ManagingUnit { get; set; } = "امور مالی و حسابداری";

    [MaxLength(250)]
    public string Address { get; set; } = "ملایر، بلوار انقلاب";

    [MaxLength(100)]
    public string SignerName { get; set; } = "معاون مدیر کل و مدیر اداره";

    [MaxLength(100)]
    public string SignerRole { get; set; } = "مدیریت آموزش و پرورش ملایر";

    // حداقل دریافتی مجاز برای صدور ضمانت و گواهی
    public decimal MinIncomeThreshold { get; set; } = 50000000; // 50,000,000 ریال

    // پسوند شماره دبیرخانه
    [MaxLength(20)]
    public string SecretariatSuffix { get; set; } = "104";

    // آخرین شماره ترتیبی دبیرخانه صادر شده
    public int LastSecretariatSeqNumber { get; set; } = 0;

    // تصویر مهر و امضای دیجیتالی رسمی (Base64)
    public string? DigitalStampBase64 { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
