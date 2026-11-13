namespace EducationCertPortal.Models;

public enum CertificateType
{
    Guarantee = 1,       // ضمانت‌نامه
    Deduction = 2,       // گواهی کسر از حقوق
    BankInquiry = 3      // پاسخ استعلام بانکی
}

public enum CertificateStatus
{
    Pending = 1,         // در نوبت صدور
    Approved = 2,        // صادر شده / فعال
    Settled = 3,         // تسویه شده (از سقف و سرجمع کسر نمی‌گردد)
    Cancelled = 4,       // ابطال شده
    Rejected = 5         // رد شده
}

public enum PersonnelStatus
{
    Active = 1,          // فعال شاغل
    Retired = 2,         // بازنشسته (غیرفعال)
    Suspended = 3        // مسدود یا تعلیق شده
}

[Flags]
public enum UserRoles
{
    None = 0,
    Personnel = 1,       // پرسنل
    Operator = 2,        // اپراتور صدور
    Approver = 4,        // تاییدکننده
    Admin = 8            // مدیر سامانه
}
