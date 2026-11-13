using Microsoft.EntityFrameworkCore;
using EducationCertPortal.Data;
using EducationCertPortal.Models;

namespace EducationCertPortal.Services;

public class PersonnelService : IPersonnelService
{
    private readonly AppDbContext _context;

    public PersonnelService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Personnel>> GetAllPersonnelAsync(string? searchQuery = null, PersonnelStatus? status = null)
    {
        var query = _context.Personnel
            .Include(p => p.Certificates)
            .AsNoTracking()
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchQuery))
        {
            var s = searchQuery.Trim().ToLower();
            query = query.Where(p =>
                p.FullName.ToLower().Contains(s) ||
                p.PersonnelCode.Contains(s) ||
                p.NationalCode.Contains(s) ||
                p.Department.ToLower().Contains(s)
            );
        }

        return await query.OrderBy(p => p.FullName).ToListAsync();
    }

    public async Task<Personnel?> GetByIdAsync(int id)
    {
        return await _context.Personnel
            .Include(p => p.Certificates)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Personnel?> GetByPersonnelCodeAsync(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        var clean = code.Trim();
        return await _context.Personnel
            .Include(p => p.Certificates)
            .FirstOrDefaultAsync(p => p.PersonnelCode == clean);
    }

    public async Task<bool> SavePersonnelAsync(Personnel personnel)
    {
        if (personnel.Id == 0)
        {
            personnel.CreatedAt = DateTime.UtcNow;
            _context.Personnel.Add(personnel);
        }
        else
        {
            personnel.UpdatedAt = DateTime.UtcNow;
            _context.Personnel.Update(personnel);
        }
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<(int Added, int Updated, int RetiredCount)> ImportFromExcelAsync(Stream fileStream)
    {
        // شبیه‌سازی خواندن اکسل و به روز رسانی رکوردها
        // در صورت عدم وجود فرد در فایل اکسل جدید، به عنوان بازنشسته علامت‌گذاری می‌شود
        return await Task.FromResult((Added: 15, Updated: 45, RetiredCount: 2));
    }

    public async Task<List<Personnel>> GetDeletableRetiredPersonnelAsync()
    {
        // کاربران بازنشسته (غیرفعال) که هیچ گواهی یا ضمانت‌نامه فعالی ندارند
        return await _context.Personnel
            .Include(p => p.Certificates)
            .Where(p => p.Status == PersonnelStatus.Retired &&
                        !p.Certificates.Any(c => c.Status == CertificateStatus.Approved))
            .ToListAsync();
    }

    public async Task<bool> DeleteRetiredPersonnelAsync(int personnelId)
    {
        var person = await _context.Personnel
            .Include(p => p.Certificates)
            .FirstOrDefaultAsync(p => p.Id == personnelId);

        if (person == null || person.Status != PersonnelStatus.Retired) return false;

        // اگر گواهی فعال داشته باشد، حذف مجاز نیست
        if (person.Certificates.Any(c => c.Status == CertificateStatus.Approved))
        {
            return false;
        }

        // حذف سوابق تسویه شده یا باطل شده متصل به فرد
        _context.Certificates.RemoveRange(person.Certificates);
        _context.Personnel.Remove(person);
        await _context.SaveChangesAsync();
        return true;
    }
}
