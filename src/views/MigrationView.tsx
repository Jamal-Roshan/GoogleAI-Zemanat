import React, { useState } from 'react';
import { Personnel } from '../types';
import { StorageManager } from '../utils/storage';
import { toPersianDigits } from '../utils/persianUtils';
import {
  Database,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Code,
  Layers,
  ShieldAlert,
  GitBranch,
  Copy,
  Check,
} from 'lucide-react';

interface MigrationViewProps {
  personnelList: Personnel[];
  onRefresh: () => void;
  onNavigate: (view: string) => void;
}

export const MigrationView: React.FC<MigrationViewProps> = ({
  personnelList: _personnelList,
  onRefresh,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'sql_migration' | 'dotnet_arch' | 'env_security' | 'github_actions'>('sql_migration');
  const [dataInput, setDataInput] = useState<string>('');
  const [migrationResult, setMigrationResult] = useState<{
    importedCount: number;
    errors: string[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // SQL Script specifically generated for Zemanatnameh SQL Server database
  const sqlServerScript = `-- اسکریپت استخراج داده‌های گواهی قبلی از پایگاه داده Zemanatnameh
-- اجرا در SQL Server Management Studio (SSMS):
USE [Zemanatnameh];
GO

SELECT 
    g.[RowID] AS oldId,
    g.[Code] AS personnelCode,
    CAST(g.[Shomareh] AS NVARCHAR(50)) AS certificateNo,
    g.[GovahiTypeID] AS govahiTypeId,
    CASE 
        WHEN g.[GovahiTypeID] = 1 THEN 'salary_deduction'
        WHEN g.[GovahiTypeID] = 2 THEN 'bank_guarantee'
        WHEN g.[GovahiTypeID] = 3 THEN 'inquiry'
        ELSE 'salary_deduction'
    END AS [type],
    g.[BankFullname] AS bankName,
    g.[LoanAmount] AS loanAmount,
    g.[MablaghKhalesDaryafti] AS netSalaryAtIssuance,
    LTRIM(RTRIM(CONCAT(ISNULL(g.[LoanOwner_FirstName], N''), N' ', ISNULL(g.[LoanOwner_LastName], N'')))) AS borrowerName,
    g.[LoanOwner_FatherName] AS borrowerFatherName,
    g.[LoanOwner_NID] AS borrowerNationalCode,
    g.[RelativeId] AS relativeId,
    CASE 
        WHEN g.[RelativeId] = 1 THEN N'خود پرسنل'
        WHEN g.[RelativeId] = 2 THEN N'فرزند'
        WHEN g.[RelativeId] = 3 THEN N'همسر'
        WHEN g.[RelativeId] = 4 THEN N'برادر'
        WHEN g.[RelativeId] = 5 THEN N'خواهر'
        WHEN g.[RelativeId] = 6 THEN N'پدر'
        WHEN g.[RelativeId] = 7 THEN N'مادر'
        ELSE N'سایر بستگان'
    END AS borrowerRelation,
    CASE WHEN g.[Vaziyat_Soudur] = 2 THEN 1 ELSE 0 END AS isSurplus,
    CASE 
        WHEN g.[StateId] = 2 OR g.[TasviyehDate] IS NOT NULL THEN 'settled'
        WHEN g.[StateId] = 3 THEN 'cancelled'
        ELSE 'issued'
    END AS [status],
    CONVERT(VARCHAR(10), g.[DateOfCreate], 111) AS createdAt,
    g.[Tasviyehby] AS settledBy,
    CONVERT(VARCHAR(10), g.[TasviyehDate], 111) AS settledAt,
    g.[Sader_Konandeh] AS operatorName,
    g.[Shomareh_Nameh_Estelam_Bank] AS bankLetterNumber,
    g.[Tarikh_Nameh_Estelam_Bank] AS bankLetterDate,
    g.[Sader_Konnandeh_Estelam] AS inquiryIssuer
FROM [dbo].[Govahies] g
ORDER BY g.[RowID] ASC
FOR JSON PATH;`;

  // Sample JSON payload matching Zemanatnameh database
  const handleLoadSampleData = () => {
    const samplePayload = [
      {
        RowID: 1001,
        Code: '1001',
        Shomareh: '1052/104',
        GovahiTypeID: 1,
        BankFullname: 'بانک ملی ایران - شعبه مرکزی ملایر',
        LoanAmount: 150000000,
        MablaghKhalesDaryafti: 380000000,
        LoanOwner_FirstName: 'علیرضا',
        LoanOwner_LastName: 'حسینی مقدم',
        LoanOwner_FatherName: 'محمدرضا',
        LoanOwner_NID: '0012345678',
        RelativeId: 1,
        StateId: 2,
        DateOfCreate: '۱۴۰۲/۰۲/۱۵',
        Tasviyehby: 'سارا رضایی',
        TasviyehDate: '۱۴۰۳/۰۴/۲۰',
        Vaziyat_Soudur: 1,
        Sader_Konandeh: 'مهندس حسینی',
      },
      {
        RowID: 1002,
        Code: '1002',
        Shomareh: '1053/104',
        GovahiTypeID: 2,
        BankFullname: 'بانک ملت - شعبه انقلاب',
        LoanAmount: 180000000,
        MablaghKhalesDaryafti: 310000000,
        LoanOwner_FirstName: 'مهرداد',
        LoanOwner_LastName: 'احمدی‌پور',
        LoanOwner_FatherName: 'علی‌اکبر',
        LoanOwner_NID: '0039988112',
        RelativeId: 4,
        StateId: 1,
        DateOfCreate: '۱۴۰۳/۰۵/۱۰',
        Vaziyat_Soudur: 1,
        Sader_Konandeh: 'سارا رضایی',
      },
    ];

    setDataInput(JSON.stringify(samplePayload, null, 2));
  };

  const handleExecuteMigration = () => {
    setErrorMessage(null);
    if (!dataInput.trim()) {
      setErrorMessage('لطفاً داده‌های خروجی SQL Server را وارد نمایید.');
      return;
    }

    try {
      const parsedData = JSON.parse(dataInput);
      if (!Array.isArray(parsedData)) {
        setErrorMessage('فرمت داده باید به صورت آرایه‌ای از گواهی‌های قبلی باشد.');
        return;
      }

      const res = StorageManager.importLegacyGovahies(parsedData);
      setMigrationResult(res);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(`خطا در تجزیه داده‌ها: ${err.message}`);
    }
  };

  const csharpModelsCode = `// Models/Govahi.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MalayerEdu.Certificates.Domain.Entities
{
    [Table("Govahies")]
    public class Govahi
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required, MaxLength(32)]
        public string TrackingCode { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? CertificateNo { get; set; } // مثال: 1/104

        [Required]
        public int PersonnelId { get; set; }

        [ForeignKey(nameof(PersonnelId))]
        public virtual Personnel Personnel { get; set; } = null!;

        [Required]
        public GovahiType Type { get; set; } // SalaryDeduction, BankGuarantee, Inquiry

        [Required, MaxLength(150)]
        public string BankName { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string BranchName { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,0)")]
        public decimal LoanAmount { get; set; }

        public bool IsSurplus { get; set; } = false;

        public GovahiStatus Status { get; set; } = GovahiStatus.Issued;

        // اطلاعات وام‌گیرنده
        public BorrowerType BorrowerType { get; set; } = BorrowerType.Self;
        public string? BorrowerName { get; set; }
        public string? BorrowerNationalCode { get; set; }
        public string? BorrowerFatherName { get; set; }
        public string? BorrowerRelation { get; set; }

        // مشخصات استعلام بانک (در صورت نوع استعلام)
        public string? BankLetterNumber { get; set; }
        public string? BankLetterDate { get; set; }

        // اطلاعات اقدام‌کنندگان
        [Required, MaxLength(100)]
        public string OperatorName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ApproverName { get; set; }

        [MaxLength(10)]
        public string CreatedAtShamsi { get; set; } = string.Empty;

        // مشخصات تسویه
        [MaxLength(100)]
        public string? SettledBy { get; set; }

        [MaxLength(10)]
        public string? SettledAtShamsi { get; set; }

        // شناسه مهر و امضا
        public int? SignatureImageId { get; set; }
    }

    public enum GovahiType { SalaryDeduction = 1, BankGuarantee = 2, Inquiry = 3, InquiryTwoPiece = 4, Verification = 5 }
    public enum GovahiStatus { Pending = 0, Approved = 1, Issued = 2, Settled = 3, Cancelled = 4, Rejected = 5 }
    public enum BorrowerType { Self = 1, Other = 2 }
}`;

  const envSecuritySnippet = `# راهنمای تنظیم متغیر محیطی در Windows Server (بدون هاردکد کردن در appsettings.json):
# ۱. باز کردن PowerShell یا CMD با دسترسی Administrator:

# تنظیم متغیر محیطی سیستمی:
setx DB_CONNECTION "Server=localhost;Database=Zemanatnameh;User Id=sa;Password=YourSecurePassword123!;TrustServerCertificate=True;" /M

# ۲. نحوه خواندن امن در Program.cs پروژه .NET 10:
var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION") 
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DB_CONNECTION' was not found in environment variables.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));`;

  const githubActionsYaml = `# .github/workflows/dotnet-ci.yml
name: .NET 10 CI & Build Verification

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4

    - name: Setup .NET 10 SDK
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '10.0.x'

    - name: Restore NuGet Dependencies
      run: dotnet restore MalayerEdu.Certificates.sln

    - name: Build Solution (Release)
      run: dotnet build MalayerEdu.Certificates.sln --no-restore --configuration Release`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  انتقال داده‌ها و معماری سازمانی پایگاه داده (SQL Server & .NET 10)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  معماری رسمی سازمان
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                کوئری استخراج اطلاعات پایگاه داده Zemanatnameh، معماری Code-First، تنظیم امن متغیرهای محیطی و استقرار
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mt-6 pt-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('sql_migration')}
            className={`pb-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'sql_migration'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            انتقال داده از SQL Server قبلی
          </button>
          <button
            onClick={() => setActiveTab('dotnet_arch')}
            className={`pb-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'dotnet_arch'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            معماری .NET 10 & EF Core Code-First
          </button>
          <button
            onClick={() => setActiveTab('env_security')}
            className={`pb-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'env_security'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            امنیت رشته اتصال (Environment Variable)
          </button>
          <button
            onClick={() => setActiveTab('github_actions')}
            className={`pb-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'github_actions'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            اکشن گیت‌هاب (CI/CD)
          </button>
        </div>
      </div>

      {/* Tab 2: SQL Server Migration */}
      {activeTab === 'sql_migration' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  ۱. اسکریپت استخراج از دیتابیس SQL Server قدیمی
                </h3>
              </div>
              <button
                onClick={() => copyText(sqlServerScript, 'sql_script')}
                className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 hover:text-purple-900 bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
              >
                {copiedSnippet === 'sql_script' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet === 'sql_script' ? 'کپی شد' : 'کپی اسکریپت T-SQL'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              این کوئری T-SQL را در SQL Server Management Studio (SSMS) روی پایگاه داده قدیمی اجرا فرمایید تا خروجی استاندارد JSON سازگار با جدول جدید تولید شود:
            </p>

            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800 max-h-[350px]">
              {sqlServerScript}
            </pre>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-900 dark:text-blue-200 text-xs space-y-1">
              <span className="font-bold block">منطق تطبیق پرسنل در مهاجرت:</span>
              <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                سامانه کد پرسنلی هر رکورد قدیمی را با جدول پرسنل فعال جدید مطابقت می‌دهد؛ گواهی‌های تسویه شده از سرجمع تعهدات کسر می‌شوند.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  ۲. درج خروجی و اجرای انتقال (Migration)
                </h3>
                <button
                  type="button"
                  onClick={handleLoadSampleData}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                >
                  بارگذاری دیتای نمونه تستی
                </button>
              </div>

              <textarea
                rows={11}
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                placeholder="خروجی JSON یا اطلاعات خروجی جدول Govahies قدیمی را اینجا الصاق (Paste) نمایید..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {migrationResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  migrationResult.importedCount > 0
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    تعداد {toPersianDigits(migrationResult.importedCount)} رکورد با موفقیت به جدول Govahies جدید منتقل گردید.
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => onNavigate('archive')}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
              >
                مشاهده در بایگانی گواهی‌ها
              </button>

              <button
                onClick={handleExecuteMigration}
                className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>اجرای انتقال به دیتابیس جدید</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: .NET 10 & EF Core Architecture */}
      {activeTab === 'dotnet_arch' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                کدهای Entity Framework Core 10 (Code-First)
              </h3>
            </div>
            <button
              onClick={() => copyText(csharpModelsCode, 'csharp_code')}
              className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg font-bold"
            >
              {copiedSnippet === 'csharp_code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>کپی مدل‌های C#</span>
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            مدل‌های دامنه زیر تمام فیلدهای جدول Govahies، کدهای اعتبارسنجی، وضعیت تسویه و ارتباط با پرسنل را در .NET 10 پیاده‌سازی می‌کنند:
          </p>

          <pre className="p-4 bg-slate-900 text-purple-300 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800 max-h-[450px]">
            {csharpModelsCode}
          </pre>
        </div>
      )}

      {/* Tab 4: Environment Variable Security */}
      {activeTab === 'env_security' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                امنیت رشته اتصال SQL Server از طریق متغیر محیطی (Environment Variable)
              </h3>
            </div>
            <button
              onClick={() => copyText(envSecuritySnippet, 'env_snippet')}
              className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg font-bold"
            >
              {copiedSnippet === 'env_snippet' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>کپی دستورات</span>
            </button>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
            <strong>قانون امنیتی:</strong> به هیچ عنوان نام کاربری و رمز دیتابیس در فایل <code className="font-mono">appsettings.json</code> ذخیره نگردد. سیستم عامل سرور با متغیر محیطی <code className="font-mono">DB_CONNECTION</code> رشته اتصال را به پروژه تحویل می‌دهد.
          </div>

          <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
            {envSecuritySnippet}
          </pre>
        </div>
      )}

      {/* Tab 5: GitHub Actions CI/CD */}
      {activeTab === 'github_actions' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                پیکربندی گیت‌هاب اکشن جهت بیلد و تست خودکار (.github/workflows/dotnet-ci.yml)
              </h3>
            </div>
            <button
              onClick={() => copyText(githubActionsYaml, 'gh_snippet')}
              className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg font-bold"
            >
              {copiedSnippet === 'gh_snippet' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>کپی YAML اکشن</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-900 text-blue-300 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
            {githubActionsYaml}
          </pre>
        </div>
      )}
    </div>
  );
};
