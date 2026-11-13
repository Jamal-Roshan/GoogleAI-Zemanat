using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using EducationCertPortal.Models;

namespace EducationCertPortal.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        // 1. تنظیمات سازمانی اولیه
        if (!await context.SystemSettings.AnyAsync())
        {
            var defaultSettings = new SystemSettings
            {
                OrgTitle = "مدیریت آموزش و پرورش ملایر",
                ManagingUnit = "امور مالی و حسابداری",
                Address = "ملایر، بلوار انقلاب",
                SignerName = "معاون مدیر کل و مدیر اداره",
                SignerRole = "مدیریت آموزش و پرورش ملایر",
                MinIncomeThreshold = 50000000, // حداقل ۵۰ میلیون ریال
                SecretariatSuffix = "104",
                LastSecretariatSeqNumber = 3,
                UpdatedAt = DateTime.UtcNow
            };
            context.SystemSettings.Add(defaultSettings);
            await context.SaveChangesAsync();
        }

        // 2. کاربر مدیر پیش‌فرض (admin / admin) با کلیه نقش‌ها
        if (!await context.SystemUsers.AnyAsync(u => u.Username == "admin"))
        {
            var adminUser = new SystemUser
            {
                Username = "admin",
                PasswordHash = HashPassword("admin"),
                FullName = "مدیر کل و راهبر سیستم",
                Roles = UserRoles.Admin | UserRoles.Operator | UserRoles.Approver | UserRoles.Personnel,
                IsActive = true,
                MustChangePassword = false,
                CreatedAt = DateTime.UtcNow
            };
            context.SystemUsers.Add(adminUser);
            await context.SaveChangesAsync();
        }

        // 3. پرسنل نمونه برای تست و آماده‌به‌کاری سریع
        if (!await context.Personnel.AnyAsync())
        {
            var p1 = new Personnel
            {
                PersonnelCode = "98234101",
                NationalCode = "3920184751",
                FullName = "علیرضا اسدی ملایری",
                FatherName = "محمدرضا",
                AccountNumber = "0105829143004",
                ShebaNumber = "IR420170000000105829143004",
                Mobile = "09181512345",
                Department = "آموزش متوسطه اول",
                JobTitle = "دبیر رسمی",
                BaseSalary = 185000000,
                NetIncome = 142000000,
                TotalActiveDeductions = 25000000,
                Status = PersonnelStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            var p2 = new Personnel
            {
                PersonnelCode = "98234102",
                NationalCode = "3920258142",
                FullName = "فاطمه رضایی سامنی",
                FatherName = "حسین",
                AccountNumber = "0106941235008",
                ShebaNumber = "IR530170000000106941235008",
                Mobile = "09183517890",
                Department = "آموزش ابتدایی",
                JobTitle = "آموزگار رسمی",
                BaseSalary = 162000000,
                NetIncome = 128000000,
                TotalActiveDeductions = 18000000,
                Status = PersonnelStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            var p3 = new Personnel
            {
                PersonnelCode = "97112005",
                NationalCode = "3930491823",
                FullName = "محمد مرادی زند",
                FatherName = "جعفر",
                AccountNumber = "0201458921001",
                ShebaNumber = "IR120170000000201458921001",
                Mobile = "09188514321",
                Department = "امور اداری و مالی",
                JobTitle = "کارشناس حسابداری",
                BaseSalary = 198000000,
                NetIncome = 156000000,
                TotalActiveDeductions = 0,
                Status = PersonnelStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            context.Personnel.AddRange(p1, p2, p3);
            await context.SaveChangesAsync();

            // ثبت نمونه ضمانت‌نامه و استعلام با کدهای رهگیری غیرقابل حدس و پسوند ۱۰۴
            var cert1 = new Certificate
            {
                PersonnelId = p1.Id,
                CertificateNo = "1/104",
                SecretariatSeqNumber = 1,
                TrackingCode = "TRK-9F4K-7M2R-8W5B",
                Type = CertificateType.Guarantee,
                Status = CertificateStatus.Approved,
                BankName = "بانک ملی ایران",
                BranchName = "شعبه مرکزی ملایر",
                RecipientName = "محمدجواد احمدی",
                RecipientNationalCode = "3921102948",
                LoanAmount = 500000000,
                InstallmentAmount = 14500000,
                InstallmentCount = 36,
                LoanSubject = "تسهیلات خرید کالا و مسکن",
                Description = "ضمانت پرداخت اقساط تسهیلات اعطایی",
                OperatorName = "کارشناس صدور و رفاه",
                ApproverName = "معاون مدیر کل و مدیر اداره",
                CreatedAt = DateTime.UtcNow.AddDays(-10),
                ApprovedAt = DateTime.UtcNow.AddDays(-10)
            };

            var cert2 = new Certificate
            {
                PersonnelId = p2.Id,
                CertificateNo = "2/104",
                SecretariatSeqNumber = 2,
                TrackingCode = "TRK-4X8P-3V9L-6Q1Z",
                Type = CertificateType.Deduction,
                Status = CertificateStatus.Approved,
                BankName = "بانک صادرات ایران",
                BranchName = "شعبه بازار ملایر",
                RecipientName = "فاطمه رضایی سامنی",
                RecipientNationalCode = "3920258142",
                LoanAmount = 300000000,
                InstallmentAmount = 9800000,
                InstallmentCount = 24,
                LoanSubject = "تسهیلات مرابحه قرض‌الحسنه",
                Description = "گواهی کسر از حقوق جهت ضمانت شخص متقاضی",
                OperatorName = "کارشناس صدور و رفاه",
                ApproverName = "معاون مدیر کل و مدیر اداره",
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                ApprovedAt = DateTime.UtcNow.AddDays(-5)
            };

            var cert3 = new Certificate
            {
                PersonnelId = p3.Id,
                CertificateNo = "3/104",
                SecretariatSeqNumber = 3,
                TrackingCode = "TRK-7T2K-8D4G-1Y6M",
                Type = CertificateType.BankInquiry,
                Status = CertificateStatus.Approved,
                BankName = "بانک سپه",
                BranchName = "شعبه طالقانی ملایر",
                RecipientName = "محمد مرادی زند",
                RecipientNationalCode = "3930491823",
                LoanAmount = 800000000,
                InstallmentAmount = 22000000,
                InstallmentCount = 48,
                LoanSubject = "استعلام توان مالی و ضمانت تسهیلات",
                Description = "پاسخ به استعلام بانکی وضعیت حقوق و اقساط",
                OperatorName = "کارشناس صدور و رفاه",
                ApproverName = "معاون مدیر کل و مدیر اداره",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                ApprovedAt = DateTime.UtcNow.AddDays(-1)
            };

            context.Certificates.AddRange(cert1, cert2, cert3);
            await context.SaveChangesAsync();
        }
    }

    public static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(password + "_Salt_EducationPortal_2026");
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    public static bool VerifyPassword(string password, string hash)
    {
        return HashPassword(password) == hash;
    }
}
