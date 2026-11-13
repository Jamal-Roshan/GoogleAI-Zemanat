using Microsoft.EntityFrameworkCore;
using EducationCertPortal.Models;

namespace EducationCertPortal.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Personnel> Personnel => Set<Personnel>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<SystemUser> SystemUsers => Set<SystemUser>();
    public DbSet<SystemSettings> SystemSettings => Set<SystemSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // پرسنل
        modelBuilder.Entity<Personnel>(entity =>
        {
            entity.HasIndex(p => p.PersonnelCode).IsUnique();
            entity.HasIndex(p => p.NationalCode);
            entity.Property(p => p.BaseSalary).HasPrecision(18, 2);
            entity.Property(p => p.NetIncome).HasPrecision(18, 2);
            entity.Property(p => p.TotalActiveDeductions).HasPrecision(18, 2);
        });

        // گواهی و ضمانت‌نامه
        modelBuilder.Entity<Certificate>(entity =>
        {
            entity.HasIndex(c => c.TrackingCode).IsUnique();
            entity.HasIndex(c => c.CertificateNo);
            entity.Property(c => c.LoanAmount).HasPrecision(18, 2);
            entity.Property(c => c.InstallmentAmount).HasPrecision(18, 2);

            entity.HasOne(c => c.Personnel)
                  .WithMany(p => p.Certificates)
                  .HasForeignKey(c => c.PersonnelId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // کاربران
        modelBuilder.Entity<SystemUser>(entity =>
        {
            entity.HasIndex(u => u.Username).IsUnique();
        });

        // تنظیمات
        modelBuilder.Entity<SystemSettings>(entity =>
        {
            entity.Property(s => s.MinIncomeThreshold).HasPrecision(18, 2);
        });
    }
}
