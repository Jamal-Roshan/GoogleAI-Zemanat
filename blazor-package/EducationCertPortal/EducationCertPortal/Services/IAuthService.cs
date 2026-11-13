using EducationCertPortal.Models;

namespace EducationCertPortal.Services;

public interface IAuthService
{
    Task<(bool Success, string Message, SystemUser? User)> LoginAsync(string username, string password);
    Task<SystemUser?> GetCurrentUserAsync();
    Task<bool> ResetPasswordAsync(int targetUserId, int actorUserId);
    Task<bool> ChangePasswordAsync(int userId, string oldPassword, string newPassword);
    Task<bool> ResetEntireSystemAsync(bool reloadDefaults);
    Task<SystemSettings> GetSystemSettingsAsync();
    Task<bool> UpdateSystemSettingsAsync(SystemSettings settings);
}
