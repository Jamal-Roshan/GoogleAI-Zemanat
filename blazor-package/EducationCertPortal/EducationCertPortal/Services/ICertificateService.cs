using EducationCertPortal.Models;

namespace EducationCertPortal.Services;

public interface ICertificateService
{
    Task<List<Certificate>> GetAllCertificatesAsync(string? searchQuery = null, CertificateType? type = null, CertificateStatus? status = null);
    Task<Certificate?> GetCertificateByIdAsync(int id);
    Task<Certificate?> VerifyCertificateAsync(string trackingOrCertNo, string clientIp);
    Task<(bool Success, string Message, Certificate? Certificate)> IssueCertificateAsync(Certificate certRequest, int currentUserId);
    Task<bool> SettleCertificateAsync(int certificateId, string settledBy);
    Task<bool> CancelCertificateAsync(int certificateId, string cancelReason, string cancelledBy);
    Task<(int TotalCertificates, int ActiveGuarantees, int SettledCount, decimal TotalActiveAmount)> GetPortalStatsAsync();
}
