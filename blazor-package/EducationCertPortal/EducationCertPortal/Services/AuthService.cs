using Microsoft.EntityFrameworkCore;
using EducationCertPortal.Data;
using EducationCertPortal.Models;

namespace EducationCertPortal.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private SystemUser? _currentUser;

    public AuthService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(bool Success, string Message, SystemUser? User)> LoginAsync(string username, string password)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            return (false, "نام کاربری و کلمه عبور را وارد نمایید.", null);
        }

        var cleanUser = username.Trim().ToLower();

        // قانون کاربر پیش‌فرض admin:
        // اگر سایر کاربران نقش مدیر داشته باشند، کاربر پیش‌فرض غیرفعال است.
        // اگر هیچ مدیری در سیستم نباشد، کاربر پیش‌فرض مجدداً فعال می‌شود.
        if (cleanUser == "admin")
        {
            var otherAdminsCount = await _context.SystemUsers
                .CountAsync(u => u.Username.ToLower() != "admin" &&
                                 u.IsActive &&
                                 (u.Roles & UserRoles.Admin) == UserRoles.Admin);

            if (otherAdminsCount > 0)
            {
                return (false, "کاربر پیش‌فرض admin به دلیل تعریف مدیر اختصاصی غیرفعال شده است.", null);
            }
        }

        var user = await _context.SystemUsers
            .FirstOrDefaultAsync(u => u.Username.ToLower() == cleanUser && u.IsActive);

        if (user == null || !DbInitializer.VerifyPassword(password, user.PasswordHash))
        {
            return (false, "شناسه کاربری یا رمز عبور نامعتبر است.", null);
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _currentUser = user;

        return (true, "ورود موفقیت‌آمیز بود.", user);
    }

    public Task<SystemUser?> GetCurrentUserAsync()
    {
        return Task.FromResult(_currentUser);
    }

    public async Task<bool> ResetPasswordAsync(int targetUserId, int actorUserId)
    {
        var target = await _context.SystemUsers.FindAsync(targetUserId);
        var actor = await _context.SystemUsers.FindAsync(actorUserId);
        if (target == null || actor == null) return false;

        // فقط مدیر می‌تواند رمز سایر مدیران و اپراتورها را ریست کند
        bool targetIsPrivileged = (target.Roles & (UserRoles.Admin | UserRoles.Operator)) != 0;
        bool actorIsAdmin = (actor.Roles & UserRoles.Admin) == UserRoles.Admin;

        if (targetIsPrivileged && !actorIsAdmin) return false;

        // ریست رمز به کد پرسنلی یا در غیر اینصورت به 123456
        string defaultPass = !string.IsNullOrEmpty(target.PersonnelCode) ? target.PersonnelCode : "123456";
        target.PasswordHash = DbInitializer.HashPassword(defaultPass);
        target.MustChangePassword = false;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ChangePasswordAsync(int userId, string oldPassword, string newPassword)
    {
        var user = await _context.SystemUsers.FindAsync(userId);
        if (user == null) return false;

        if (!DbInitializer.VerifyPassword(oldPassword, user.PasswordHash))
        {
            return false;
        }

        user.PasswordHash = DbInitializer.HashPassword(newPassword);
        user.MustChangePassword = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ResetEntireSystemAsync(bool reloadDefaults)
    {
        // پاکسازی کلیه اطلاعات پایگاه‌داده با تایید دو مرحله‌ای
        _context.Certificates.RemoveRange(_context.Certificates);
        _context.Personnel.RemoveRange(_context.Personnel);
        _context.SystemUsers.RemoveRange(_context.SystemUsers.Where(u => u.Username != "admin"));

        var settings = await _context.SystemSettings.FirstOrDefaultAsync();
        if (settings != null)
        {
            settings.LastSecretariatSeqNumber = 0;
            settings.DigitalStampBase64 = null;
        }

        await _context.SaveChangesAsync();

        if (reloadDefaults)
        {
            await DbInitializer.InitializeAsync(_context);
        }

        return true;
    }

    public async Task<SystemSettings> GetSystemSettingsAsync()
    {
        return await _context.SystemSettings.FirstOrDefaultAsync() ?? new SystemSettings();
    }

    public async Task<bool> UpdateSystemSettingsAsync(SystemSettings settings)
    {
        var existing = await _context.SystemSettings.FirstOrDefaultAsync();
        if (existing == null)
        {
            _context.SystemSettings.Add(settings);
        }
        else
        {
            existing.OrgTitle = settings.OrgTitle;
            existing.ManagingUnit = settings.ManagingUnit;
            existing.Address = settings.Address;
            existing.SignerName = settings.SignerName;
            existing.SignerRole = settings.SignerRole;
            existing.MinIncomeThreshold = settings.MinIncomeThreshold;
            existing.SecretariatSuffix = settings.SecretariatSuffix;
            if (!string.IsNullOrEmpty(settings.DigitalStampBase64))
            {
                existing.DigitalStampBase64 = settings.DigitalStampBase64;
            }
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
