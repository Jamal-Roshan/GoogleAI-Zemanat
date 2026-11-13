using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationCertPortal.Models;

[Table("Certificates")]
public class Certificate
{
    [Key]
    public int Id { get; set; }

    // کلید خارجی پرسنل
    public int PersonnelId { get; set; }
    [ForeignKey(nameof(PersonnelId))]
    public virtual Personnel? Personnel { get; set; }

    // شماره ثبت دبیرخانه به همراه پسوند (مثلاً ۱/۱۰۴)
    [Required]
    [MaxLength(50)]
    public string CertificateNo { get; set; } = string.Empty;

    public int SecretariatSeqNumber { get; set; }

    // کد رهگیری غیرقابل حدس و پیش‌بینی با آنتروپی رمزنگاری (TRK-XXXX-XXXX-XXXX)
    [Required]
    [MaxLength(60)]
    public string TrackingCode { get; set; } = string.Empty;

    public CertificateType Type { get; set; } = CertificateType.Guarantee;

    public CertificateStatus Status { get; set; } = CertificateStatus.Approved;

    // اطلاعات تسهیلات و بانک
    [MaxLength(100)]
    public string BankName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string BranchName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string RecipientName { get; set; } = string.Empty; // نام متقاضی یا وام‌گیرنده

    [MaxLength(20)]
    public string RecipientNationalCode { get; set; } = string.Empty;

    public decimal LoanAmount { get; set; }

    public decimal InstallmentAmount { get; set; }

    public int InstallmentCount { get; set; }

    [MaxLength(100)]
    public string LoanSubject { get; set; } = "تسهیلات بانکی";

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    // اطلاعات ثبت و تایید
    [MaxLength(100)]
    public string OperatorName { get; set; } = "کارشناس صدور و رفاه";

    [MaxLength(100)]
    public string ApproverName { get; set; } = "معاون مدیر کل و مدیر اداره";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }

    // وضعیت تسویه
    public DateTime? SettledAt { get; set; }
    [MaxLength(100)]
    public string? SettledBy { get; set; }

    // وضعیت ابطال
    public DateTime? CancelledAt { get; set; }
    [MaxLength(100)]
    public string? CancelledBy { get; set; }
    [MaxLength(300)]
    public string? CancelReason { get; set; }
}
