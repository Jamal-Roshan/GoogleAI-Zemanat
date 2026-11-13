using Microsoft.EntityFrameworkCore;
using EducationCertPortal.Data;
using EducationCertPortal.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. ثبت سرویس‌های Blazor Server با قابلیت تعاملی (Interactive Server)
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor(options =>
{
    options.DetailedErrors = builder.Environment.IsDevelopment();
    options.DisconnectedCircuitRetentionPeriod = TimeSpan.FromMinutes(5);
});

// 2. پیکربندی پایگاه‌داده (پشتیبانی از SQLite سبک محلی یا SQL Server سازمانی)
var dbProvider = builder.Configuration.GetValue<string>("DatabaseProvider") ?? "Sqlite";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (dbProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        var sqlServerConnection = builder.Configuration.GetConnectionString("SqlServerConnection");
        options.UseSqlServer(sqlServerConnection);
    }
    else
    {
        var sqliteConnection = builder.Configuration.GetConnectionString("SqliteConnection")
                               ?? "Data Source=EducationCertPortal.db;Cache=Shared";
        options.UseSqlite(sqliteConnection);
    }
});

// 3. ثبت سرویس‌های اختصاصی سامانه
builder.Services.AddScoped<IBarcodeService, BarcodeService>();
builder.Services.AddScoped<ICertificateService, CertificateService>();
builder.Services.AddScoped<IPersonnelService, PersonnelService>();
builder.Services.AddScoped<IAuthService, AuthService>();

var app = builder.Build();

// 4. راه‌اندازی و مقداردهی اولیه خودکار دیتابیس در اولین اجرا
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbInitializer.InitializeAsync(dbContext);
}

// 5. خط لوله میانی (Middleware Pipeline)
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.MapBlazorHub();
app.MapFallbackToPage("/_Host");

app.Run();
