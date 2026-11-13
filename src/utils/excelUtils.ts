import * as XLSX from 'xlsx';
import { Certificate, Personnel, SystemSettings } from '../types';
import { cleanPersian, formatCurrency, toEnglishDigits } from './persianUtils';

/**
 * Excel export and import utility with full RTL and Persian encoding support
 * Matches the user's input file.xlsx structure:
 * کد پرسنلی | نام | نام خانوادگی | کد ملی | خالص پرداختی | نوع استخدام | واحد سازمانی
 */

// Export data to an Excel file with RTL orientation
export function exportToExcel(
  sheets: { sheetName: string; data: any[] }[],
  fileName: string
) {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ sheetName, data }) => {
    const ws = XLSX.utils.json_to_sheet(data);

    // Set Right-to-Left (RTL) mode for the worksheet
    if (!ws['!views']) {
      ws['!views'] = [];
    }
    ws['!views'].push({ rightToLeft: true });

    // Set column widths dynamically
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      ws['!cols'] = keys.map((key) => {
        let maxLen = key.length;
        data.forEach((row) => {
          const valStr = String(row[key] || '');
          if (valStr.length > maxLen) maxLen = valStr.length;
        });
        return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
      });
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// Generate template Excel file matching user's input file.xlsx
export function generatePersonnelSampleExcel(): void {
  const sampleData = [
    {
      'کد پرسنلی': '1001',
      'نام': 'رضا',
      'نام خانوادگی': 'محمدی',
      'کد ملی': '0012345678',
      'خالص پرداختی': 320000000,
      'نوع استخدام': 'رسمی',
      'واحد سازمانی': 'معاونت آموزش ابتدایی',
    },
    {
      'کد پرسنلی': '1002',
      'نام': 'مریم',
      'نام خانوادگی': 'احمدی',
      'کد ملی': '0023456789',
      'خالص پرداختی': 275000000,
      'نوع استخدام': 'پیمانی',
      'واحد سازمانی': 'سیف الدوله (1)',
    },
    {
      'کد پرسنلی': '1003',
      'نام': 'امیر',
      'نام خانوادگی': 'حسینی',
      'کد ملی': '0034567890',
      'خالص پرداختی': 210000000,
      'نوع استخدام': 'آزمایشی',
      'واحد سازمانی': 'زینب کبری',
    },
    {
      'کد پرسنلی': '1004',
      'نام': 'سعید',
      'نام خانوادگی': 'کریمی',
      'کد ملی': '0045678901',
      'خالص پرداختی': 230000000,
      'نوع استخدام': 'پیمانی',
      'واحد سازمانی': 'شبانه روزی حاج رهبر',
    },
    {
      'کد پرسنلی': '1005',
      'نام': 'حمید',
      'نام خانوادگی': 'کاظمی',
      'کد ملی': '0056789012',
      'خالص پرداختی': 290000000,
      'نوع استخدام': 'بازنشسته',
      'واحد سازمانی': 'شهید رجائی (1)',
    },
  ];

  exportToExcel([{ sheetName: 'WorksheetName', data: sampleData }], 'فایل_نمونه_تغذیه_ماهانه_پرسنل');
}

// Parse uploaded Excel file for personnel feed (supports input file.xlsx columns)
export async function parsePersonnelExcel(
  file: File
): Promise<{ success: boolean; data?: Partial<Personnel>[]; error?: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

    if (!rawRows || rawRows.length === 0) {
      return { success: false, error: 'فایل اکسل خالی است یا سطر معتبری یافت نشد.' };
    }

    const parsed: Partial<Personnel>[] = rawRows.map((row) => {
      const personnelCode = cleanPersian(
        toEnglishDigits(String(row['کد پرسنلی'] || row['PersonnelCode'] || row['کد_پرسنلی'] || ''))
      );
      const nationalCode = cleanPersian(
        toEnglishDigits(String(row['کد ملی'] || row['NationalCode'] || row['کدملی'] || ''))
      );

      // Handle both separated (نام + نام خانوادگی) and combined (نام و نام خانوادگی)
      let fullName = '';
      if (row['نام و نام خانوادگی'] || row['FullName']) {
        fullName = cleanPersian(String(row['نام و نام خانوادگی'] || row['FullName']));
      } else {
        const firstName = cleanPersian(String(row['نام'] || row['FirstName'] || ''));
        const lastName = cleanPersian(String(row['نام خانوادگی'] || row['LastName'] || ''));
        fullName = `${firstName} ${lastName}`.trim();
      }

      const fatherName = cleanPersian(String(row['نام پدر'] || row['FatherName'] || ''));
      const employmentTypeRaw = cleanPersian(String(row['نوع استخدام'] || row['EmploymentType'] || 'رسمی'));
      const department = cleanPersian(String(row['واحد سازمانی'] || row['محل خدمت'] || row['Department'] || 'مدیریت آموزش و پرورش ملایر'));
      const jobTitle = cleanPersian(String(row['پست سازمانی'] || row['JobTitle'] || row['شغل'] || 'کارشناس'));

      // Net salary: support 'خالص پرداختی' and 'خالص دریافتی'
      const netSalaryRaw = row['خالص پرداختی'] ?? row['خالص پرداختی (ریال)'] ?? row['خالص دریافتی'] ?? row['خالص دریافتی (ریال)'] ?? row['NetSalary'] ?? 0;
      const netSalary = Number(toEnglishDigits(String(netSalaryRaw)));

      const phone = cleanPersian(String(row['شماره تماس'] || row['Phone'] || row['موبایل'] || ''));
      const accountNumber = cleanPersian(String(row['شماره حساب'] || row['AccountNumber'] || ''));

      let employmentType: any = 'رسمی';
      if (employmentTypeRaw.includes('پیمانی') || employmentTypeRaw.includes('پيماني')) employmentType = 'پیمانی';
      else if (employmentTypeRaw.includes('آزمایشی') || employmentTypeRaw.includes('ازمایشی')) employmentType = 'آزمایشی';
      else if (employmentTypeRaw.includes('بازنشسته')) employmentType = 'بازنشسته';

      return {
        personnelCode,
        nationalCode,
        fullName: fullName || 'پرسنل سازمانی',
        fatherName,
        birthDate: cleanPersian(String(row['تاریخ تولد'] || '1365/01/01')),
        hireDate: cleanPersian(String(row['تاریخ استخدام'] || '1395/01/01')),
        department,
        jobTitle,
        employmentType,
        netSalary: isNaN(netSalary) ? 0 : netSalary,
        phone,
        accountNumber,
      };
    });

    return { success: true, data: parsed };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در خواندن فایل اکسل' };
  }
}

// Export Certificates Report to Excel
export function exportCertificatesExcel(
  certificates: Certificate[],
  personnelMap: Map<string, Personnel>,
  settings: SystemSettings
) {
  const data = certificates.map((cert) => {
    const p = personnelMap.get(cert.personnelId);
    return {
      'کد رهگیری': cert.trackingCode,
      'شماره دبیرخانه': cert.certificateNo || 'در انتظار تأیید',
      'کد پرسنلی': p?.personnelCode || '',
      'نام و نام خانوادگی': p?.fullName || '',
      'کد ملی': p?.nationalCode || '',
      'نوع گواهی':
        cert.type === 'salary_deduction'
          ? 'کسر از حقوق'
          : cert.type === 'bank_guarantee'
          ? 'ضمانت‌نامه بانکی'
          : cert.type === 'inquiry_twopiece'
          ? 'استعلام بانکی (دو تکه)'
          : 'استعلام بانکی',
      'نام بانک': cert.bankName,
      'شعبه': cert.branchName,
      'مبلغ (ریال)': cert.loanAmount,
      'مبلغ نمایشی': formatCurrency(cert.loanAmount, settings.currency),
      'نوع گواهی اعتباری': cert.isSurplus ? 'مازاد' : 'عادی',
      'وضعیت':
        cert.status === 'approved'
          ? 'تأیید شده'
          : cert.status === 'pending'
          ? 'در انتظار تأیید'
          : cert.status === 'issued'
          ? 'صادر شده'
          : cert.status === 'settled'
          ? 'تسویه شده'
          : cert.status === 'cancelled'
          ? 'باطل شده'
          : 'رد شده',
      'وام‌گیرنده':
        cert.borrowerType === 'self'
          ? 'خود پرسنل'
          : `${cert.borrowerName || ''} (${cert.borrowerRelation || 'شخص ثالث'})`,
      'اپراتور صادرکننده': cert.operatorName,
      'تاریخ صدور': cert.createdAt,
      'نام تأییدکننده': cert.approverName || '-',
      'تاریخ تأیید': cert.approvedAt || '-',
      'اپراتور تسویه‌کننده': cert.settledBy || '-',
      'تاریخ تسویه': cert.settledAt || '-',
      'اپراتور باطل‌کننده': cert.cancelledBy || '-',
      'تاریخ ابطال': cert.cancelledAt || '-',
    };
  });

  exportToExcel([{ sheetName: 'گزارش گواهی‌ها', data }], `گزارش_گواهی_و_ضمانتنامه_${new Date().toISOString().slice(0, 10)}`);
}
