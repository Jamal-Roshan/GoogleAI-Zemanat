using Microsoft.EntityFrameworkCore;
using EducationCertPortal.Data;
using EducationCertPortal.Models;

namespace EducationCertPortal.Services;

public class CertificateService : ICertificateService
{
    private readonly AppDbContext _context;
    private readonly IBarcodeService _barcodeService;

    // حافظه موقت برای محافظت در برابر حملات پویش و حدس مکرر (Rate Limiting)
    private static readonly Dictionary<string, (int Attempts, DateTime LockoutUntil)> _rateLimits = new();

    public CertificateService(AppDbContext context, IBarcodeService barcodeService)
    {
        _context = context;
        _barcodeService = barcodeService;
    }

    public async Task<List<Certificate>> GetAllCertificatesAsync(string? searchQuery = null, CertificateType? type = null, CertificateStatus? status = null)
    {
        var query = _context.Certificates
            .Include(c => c.Personnel)
            .AsNoTracking()
            .AsQueryable();

        if (type.HasValue)
        {
            query = query.Where(c => c.Type == type.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(c => c.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchQuery))
        {
            var s = searchQuery.Trim().ToLower();
            query = query.Where(c =>
                c.TrackingCode.ToLower().Contains(s) ||
                c.CertificateNo.ToLower().Contains(s) ||
                c.RecipientName.ToLower().Contains(s) ||
                (c.Personnel != null && (c.Personnel.FullName.ToLower().Contains(s) || c.Personnel.PersonnelCode.Contains(s) || c.Personnel.NationalCode.Contains(s)))
            );
        }

        return await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
    }

    public async Task<Certificate?> GetCertificateByIdAsync(int id)
    {
        return await _context.Certificates
            .Include(c => c.Personnel)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Certificate?> VerifyCertificateAsync(string trackingOrCertNo, string clientIp)
    {
        if (string.IsNullOrWhiteSpace(trackingOrCertNo)) return null;

        var ip = string.IsNullOrEmpty(clientIp) ? "unknown" : clientIp;
        var now = DateTime.UtcNow;

        // بررسی مسدودیت موقت IP در صورت آزمون و خطای بیش از حد
        if (_rateLimits.TryGetValue(ip, out var limitInfo))
        {
            if (now < limitInfo.LockoutUntil)
            {
                throw new InvalidOperationException("به دلیل تلاش‌های ناموفق متوالی، استعلام از این آدرس موقتاً مسدود است. لطفاً چند لحظه بعد تلاش کنید.");
            }
        }

        var clean = trackingOrCertNo.Trim().ToLower();
        var cert = await _context.Certificates
            .Include(c => c.Personnel)
            .FirstOrDefaultAsync(c =>
                c.TrackingCode.ToLower() == clean ||
                c.CertificateNo.ToLower() == clean ||
                c.CertificateNo.Replace("/", "").ToLower() == clean.Replace("/", "")
            );

        if (cert == null)
        {
            int attempts = 1;
            if (_rateLimits.TryGetValue(ip, out limitInfo))
            {
                attempts = limitInfo.Attempts + 1;
            }

            var lockout = (attempts >= 4) ? now.AddSeconds(20) : DateTime.MinValue;
            _rateLimits[ip] = (attempts, lockout);
        }
        else
        {
            _rateLimits.Remove(ip);
        }

        return cert;
    }

    public async Task<(bool Success, string Message, Certificate? Certificate)> IssueCertificateAsync(Certificate certRequest, int currentUserId)
    {
        var settings = await _context.SystemSettings.FirstOrDefaultAsync() ?? new SystemSettings();
        var personnel = await _context.Personnel.FindAsync(certRequest.PersonnelId);

        if (personnel == null)
        {
            return (false, "پرسنل مورد نظر در سامانه یافت نشد.", null);
        }

        // بررسی بازنشسته یا غیرفعال بودن پرسنل
        if (personnel.Status != PersonnelStatus.Active)
        {
            return (false, "پرسنل به دلیل وضعیت غیرفعال یا بازنشستگی، مجاز به صدور ضمانت یا گواهی نمی‌باشد.", null);
        }

        // بررسی شرط حداقل دریافتی (تنظیمات مدیریتی)
        if (personnel.NetIncome < settings.MinIncomeThreshold)
        {
            return (false, $"خالص دریافتی متقاضی ({_barcodeService.FormatCurrency(personnel.NetIncome)}) کمتر از حداقل دریافتی مجاز ({_barcodeService.FormatCurrency(settings.MinIncomeThreshold)}) تعیین شده در سیستم است.", null);
        }

        // بررسی حداقل مبلغ معتبر تسهیلات (حداقل ۱۰,۰۰۰ ریال طبق درخواست)
        if (certRequest.LoanAmount < 10000)
        {
            return (false, "مبلغ تسهیلات درخواستی باید از ۱۰,۰۰۰ ریال بیشتر باشد.", null);
        }

        // تخصیص شماره دبیرخانه خودکار ترتیبی به همراه پسوند (مثلاً ۴/۱۰۴)
        settings.LastSecretariatSeqNumber += 1;
        var seq = settings.LastSecretariatSeqNumber;
        var suffix = string.IsNullOrWhiteSpace(settings.SecretariatSuffix) ? "104" : settings.SecretariatSuffix.Trim();
        certRequest.CertificateNo = $"{seq}/{suffix}";
        certRequest.SecretariatSeqNumber = seq;

        // تولید کد رهگیری امنیتی ۶۰ بیت بدون ترتیب عددی و کاملاً غیرقابل حدس
        certRequest.TrackingCode = _barcodeService.GenerateUnguessableTrackingCode();
        certRequest.Status = CertificateStatus.Approved;
        certRequest.CreatedAt = DateTime.UtcNow;
        certRequest.ApprovedAt = DateTime.UtcNow;
        certRequest.ApproverName = settings.SignerName;

        // اضافه کردن مبلغ تعهد جدید به مجموع تعهدات پرسنل
        personnel.TotalActiveDeductions += certRequest.InstallmentAmount;
        personnel.UpdatedAt = DateTime.UtcNow;

        _context.Certificates.Add(certRequest);
        await _context.SaveChangesAsync();

        return (true, "گواهی با موفقیت صادر گردید.", certRequest);
    }

    public async Task<bool> SettleCertificateAsync(int certificateId, string settledBy)
    {
        var cert = await _context.Certificates
            .Include(c => c.Personnel)
            .FirstOrDefaultAsync(c => c.Id == certificateId);

        if (cert == null || cert.Status == CertificateStatus.Settled) return false;

        cert.Status = CertificateStatus.Settled;
        cert.SettledAt = DateTime.UtcNow;
        cert.SettledBy = settledBy;

        // گواهی تسویه شده دیگر در سرجمع تعهدات پرسنل لحاظ نمی‌شود
        if (cert.Personnel != null)
        {
            cert.Personnel.TotalActiveDeductions = Math.Max(0, cert.Personnel.TotalActiveDeductions - cert.InstallmentAmount);
            cert.Personnel.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CancelCertificateAsync(int certificateId, string cancelReason, string cancelledBy)
    {
        var cert = await _context.Certificates
            .Include(c => c.Personnel)
            .FirstOrDefaultAsync(c => c.Id == certificateId);

        if (cert == null || cert.Status == CertificateStatus.Cancelled) return false;

        bool wasActive = cert.Status == CertificateStatus.Approved;
        cert.Status = CertificateStatus.Cancelled;
        cert.CancelledAt = DateTime.UtcNow;
        cert.CancelledBy = cancelledBy;
        cert.CancelReason = cancelReason;

        if (wasActive && cert.Personnel != null)
        {
            cert.Personnel.TotalActiveDeductions = Math.Max(0, cert.Personnel.TotalActiveDeductions - cert.InstallmentAmount);
            cert.Personnel.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<(int TotalCertificates, int ActiveGuarantees, int SettledCount, decimal TotalActiveAmount)> GetPortalStatsAsync()
    {
        var total = await _context.Certificates.CountAsync();
        var activeGuarantees = await _context.Certificates.CountAsync(c => c.Status == CertificateStatus.Approved);
        var settled = await _context.Certificates.CountAsync(c => c.Status == CertificateStatus.Settled);
        var totalActiveAmount = await _context.Certificates
            .Where(c => c.Status == CertificateStatus.Approved)
            .SumAsync(c => c.LoanAmount);

        return (total, activeGuarantees, settled, totalActiveAmount);
    }
}
