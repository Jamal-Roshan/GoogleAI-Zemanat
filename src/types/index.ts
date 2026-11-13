/**
 * Data models and types for the Certificate and Guarantee Issuance System
 */

export type UserRole = 'admin' | 'operator' | 'approver' | 'employee';

export type EmploymentType = 'رسمی' | 'پیمانی' | 'آزمایشی' | 'بازنشسته';

export type CertificateType =
  | 'salary_deduction'
  | 'bank_guarantee'
  | 'inquiry'
  | 'inquiry_twopiece'
  | 'verification';

export type CertificateStatus =
  | 'pending' // در انتظار تأیید
  | 'approved' // تأیید شده (آماده صدور و چاپ)
  | 'issued' // صادر شده
  | 'settled' // تسویه شده
  | 'cancelled' // باطل شده
  | 'rejected'; // رد شده

export type ThemeMode = 'light' | 'dark';
export type ThemeColor = 'blue' | 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';

export interface UserPreferences {
  mode: ThemeMode;
  color: ThemeColor;
  fontSize: FontSize;
}

export interface Personnel {
  id: string;
  personnelCode: string; // کد پرسنلی
  nationalCode: string; // کد ملی
  fullName: string; // نام و نام خانوادگی
  fatherName: string; // نام پدر
  birthDate: string; // تاریخ تولد
  hireDate: string; // تاریخ استخدام
  department: string; // اداره / معاونت / محل خدمت (WorkPlace)
  jobTitle: string; // پست سازمانی
  employmentType: EmploymentType; // نوع استخدام (رسمی، پیمانی، آزمایشی، بازنشسته)
  netSalary: number; // خالص دریافتی (ریال)
  isActive: boolean; // وضعیت فعالیت (۱ = فعال، ۰ = غیرفعال)
  blockTip: string; // دلیل مسدودی در صورت غیرفعال بودن
  phone: string; // شماره تماس
  accountNumber?: string; // شماره حساب
}

export interface Certificate {
  id: string;
  trackingCode: string; // کد رهگیری سیستمی
  certificateNo?: string; // شماره رسمی دبیرخانه (مثلاً 1/104 یا 1403/1/104)
  personnelId: string;
  type: CertificateType;
  bankName: string; // نام بانک
  branchName: string; // نام شعبه
  branchCode?: string; // کد شعبه
  loanAmount: number; // مبلغ وام / ضمانت (ریال)
  monthlyInstallment?: number; // مبلغ قسط ماهیانه (ریال - اختیاری)
  isSurplus: boolean; // آیا گواهی مازاد است؟
  status: CertificateStatus;
  borrowerType: 'self' | 'other'; // وام‌گیرنده: خود پرسنل یا شخص ثالث
  borrowerName?: string;
  borrowerNationalCode?: string;
  borrowerFatherName?: string;
  borrowerRelation?: string; // نسبت با متقاضی
  bankLetterNumber?: string; // شماره نامه بانک (جهت استعلام)
  bankLetterDate?: string; // تاریخ نامه بانک
  rejectionReason?: string; // علت رد درخواست
  operatorName: string; // نام اپراتور صادرکننده
  approverName?: string; // نام تأییدکننده
  createdAt: string; // تاریخ ثبت (شمسی)
  approvedAt?: string; // تاریخ تأیید (شمسی)
  settledAt?: string; // تاریخ تسویه
  settledBy?: string; // نام اپراتور تسویه‌کننده
  cancelledAt?: string; // تاریخ ابطال
  cancelledBy?: string; // نام اپراتور باطل‌کننده
  signatureImageId?: string; // شناسه تصویر امضا / مهر استفاده شده
  notes?: string;
}

export interface SystemStampImage {
  id: string;
  name: string;
  type: 'signature' | 'stamp';
  dataUrl: string;
  createdAt: string;
}

export interface AgentBank {
  id: string;
  name: string;
  code?: string;
  isDefault?: boolean;
}

export interface CertificateTypeConfig {
  type: CertificateType;
  title: string;
  description: string;
}

export interface SystemSettings {
  currency: 'rial' | 'toman';
  orgTitle: string; // عنوان سازمان
  orgCode: string; // کد سازمان
  orgAddress: string; // آدرس
  orgPostalCode: string; // کد پستی
  orgPhone: string; // تلفن
  orgFax: string; // تلفکس
  managingUnit: string; // واحد متولی صدور
  netSalaryRatio: number; // ضریب خالص دریافتی (مثلاً 0.60 یا 0.70)
  secretariatSuffix: string; // پسوند شماره دبیرخانه (پیش‌فرض: 104)
  secretariatCounter: number; // شمارنده کنونی دبیرخانه (شروع از 1)
  secretariatYear: string; // سال جاری دبیرخانه (مثلاً 1403)
  signerName: string; // نام و نام خانوادگی مسئول امضاکننده
  signerRole: string; // سمت مسئول امضاکننده
  websiteUrl: string; // آدرس وب‌سایت
  allowSurplus: boolean; // کلید اجازه صدور گواهی مازاد
  forceChangePasswordFirstLogin: boolean; // الزام تغییر رمز در اولین ورود (پیش‌فرض: غیرفعال)
  forcePasswordComplexity: boolean; // الزام به پیچیدگی رمز عبور (پیش‌فرض: غیرفعال)
  approvalMode: 'all' | 'surplus_only' | 'none'; // نحوه تأیید: همه، فقط مازاد، بدون نیاز
  roleTitles: Record<UserRole, string>; // عناوین سفارشی نقش‌ها
  certificateTypes: CertificateTypeConfig[]; // عناوین انواع گواهی‌ها
  defaultTemplateIds: Record<CertificateType, string>; // تمپلیت پیش‌فرض برای هر بخش
}

export interface LetterTemplate {
  id: string;
  type: CertificateType;
  title: string;
  description: string;
  content: string; // متن همراه با Placeholderها
  isDefault?: boolean;
  signatureImageId?: string; // تصویر مهر/امضا متصل به این تمپلیت
  lastUpdated: string;
}

export interface SystemUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole; // نقش اصلی
  roles: UserRole[]; // لیست تمام نقش‌های کاربر (یک کاربر می‌تواند چند نقش داشته باشد)
  password?: string; // کلمه عبور
  personnelCode?: string; // پیوند با رکورد پرسنلی
  email?: string;
  phone?: string;
  mustChangePassword?: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface PlaceholderInfo {
  tag: string;
  label: string;
  category: 'personnel' | 'bank' | 'loan' | 'org' | 'system';
  example: string;
}

