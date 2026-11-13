using EducationCertPortal.Models;

namespace EducationCertPortal.Services;

public interface IPersonnelService
{
    Task<List<Personnel>> GetAllPersonnelAsync(string? searchQuery = null, PersonnelStatus? status = null);
    Task<Personnel?> GetByIdAsync(int id);
    Task<Personnel?> GetByPersonnelCodeAsync(string code);
    Task<bool> SavePersonnelAsync(Personnel personnel);
    Task<(int Added, int Updated, int RetiredCount)> ImportFromExcelAsync(Stream fileStream);
    Task<List<Personnel>> GetDeletableRetiredPersonnelAsync();
    Task<bool> DeleteRetiredPersonnelAsync(int personnelId);
}
