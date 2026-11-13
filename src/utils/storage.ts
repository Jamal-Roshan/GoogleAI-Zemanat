import {
  AgentBank,
  Certificate,
  LetterTemplate,
  Personnel,
  SystemSettings,
  SystemStampImage,
  SystemUser,
  UserPreferences,
} from '../types';
import { cleanPersian, formatCurrency, getTodayShamsi, toPersianDigits, generateSecureTrackingCode } from './persianUtils';
import { DEFAULT_TEMPLATES } from './templateDefaults';

const STORAGE_KEYS = {
  SETTINGS: 'govahi_settings_v3',
  PERSONNEL: 'govahi_personnel_v3',
  CERTIFICATES: 'govahi_certificates_v3',
  TEMPLATES: 'govahi_templates_v3',
  USERS: 'govahi_users_v3',
  CURRENT_USER: 'govahi_current_user_v3',
  LOCK_ISSUANCE: 'govahi_issuance_locked_v3',
  USER_PREFERENCES: 'govahi_user_preferences_v3',
  AGENT_BANKS: 'govahi_agent_banks_v3',
  STAMP_IMAGES: 'govahi_stamp_images_v3',
};

export const REGISTERED_BANKS = [
  'بانک ملی ایران',
  'بانک ملت',
  'بانک صادرات ایران',
  'بانک تجارت',
  'بانک سپه',
  'بانک مسکن',
  'بانک کشاورزی',
  'بانک رفاه کارگران',
  'بانک قرض‌الحسنه مهر ایران',
  'بانک قرض‌الحسنه رسالت',
  'بانک سامان',
  'بانک پاسارگاد',
  'بانک پارسیان',
  'بانک اقتصاد نوین',
  'بانک کارآفرین',
  'بانک شهر',
  'بانک سینا',
  'بانک دی',
  'بانک خاورمیانه',
  'بانک گردشگری',
  'بانک ایران زمین',
  'بانک سرمایه',
  'بانک توسعه صادرات',
  'بانک صنعت و معدن',
  'پست بانک ایران',
];

const DEFAULT_SETTINGS: SystemSettings = {
  currency: 'rial',
  orgTitle: 'مدیریت آموزش و پرورش ملایر',
  orgCode: 'ORG-104',
  orgAddress: 'ملایر، بلوار انقلاب',
  orgPostalCode: '۶۵۷۱۸-۵۳۱۱۱',
  orgPhone: '۰۸۱-۳۲۲۲۴۰۰۰',
  orgFax: '۰۸۱-۳۲۲۲۴۰۰۱',
  managingUnit: 'امور مالی و حسابداری',
  netSalaryRatio: 0.6, // ضریب ۶۰ درصد خالص دریافتی
  secretariatSuffix: '104', // پسوند شماره دبیرخانه
  secretariatCounter: 1, // شروع شماره دبیرخانه از ۱
  secretariatYear: '1403', // سال جاری دبیرخانه
  signerName: 'مدیر اداره آموزش و پرورش ملایر',
  signerRole: 'معاون مدیر کل و مدیر اداره',
  websiteUrl: window.location.origin,
  allowSurplus: true, // اجازه صدور گواهی مازاد
  forceChangePasswordFirstLogin: false, // پیش‌فرض غیرفعال طبق درخواست کاربر
  forcePasswordComplexity: false, // پیش‌فرض غیرفعال طبق درخواست کاربر
  approvalMode: 'surplus_only', // فقط گواهی‌های مازاد نیاز به تأیید دارند
  roleTitles: {
    admin: 'مدیر ارشد سامانه',
    operator: 'اپراتور صدور و استعلام',
    approver: 'تأییدکننده سازمانی',
    employee: 'پرسنل / کارمند',
  },
  certificateTypes: [
    { type: 'bank_guarantee', title: 'ضمانت‌نامه بانکی', description: 'تعهد ضمانت تسهیلات بانکی' },
    { type: 'salary_deduction', title: 'گواهی کسر از حقوق', description: 'گواهی تعهد کسر از حقوق' },
    { type: 'inquiry_twopiece', title: 'گواهی استعلام بانک (دو تکه)', description: 'استعلام دو تکه افقی A4' },
    { type: 'inquiry', title: 'گواهی استعلام بانک (تک برگ)', description: 'استعلام عمودی استاندارد' },
    { type: 'verification', title: 'برگه اصالت‌سنجی سند', description: 'تأییدیه الکترونیکی اصالت گواهی' },
  ],
  defaultTemplateIds: {
    salary_deduction: 'tpl_govahie',
    bank_guarantee: 'tpl_zemanatnameh',
    inquiry_twopiece: 'tpl_estelam_twopiece',
    inquiry: 'tpl_inquiry_standard',
    verification: 'tpl_verification',
  },
};

const DEFAULT_PREFERENCES: UserPreferences = {
  mode: 'light',
  color: 'blue',
  fontSize: 'base',
};

const INITIAL_USERS: SystemUser[] = [
  {
    id: 'usr_default_admin',
    username: 'admin',
    password: 'admin',
    fullName: 'کاربر پیش‌فرض مدیریت و پشتیبانی',
    role: 'admin',
    roles: ['admin', 'operator', 'approver', 'employee'],
    isActive: true,
    createdAt: '۱۴۰۳/۰۱/۰۱',
  },
  {
    id: 'usr_op1',
    username: 'operator1',
    password: '123',
    fullName: 'سارا رضایی',
    role: 'operator',
    roles: ['operator'],
    isActive: true,
    createdAt: '۱۴۰۳/۰۱/۱۵',
  },
  {
    id: 'usr_approver1',
    username: 'approver1',
    password: '123',
    fullName: 'دکتر محمدرضا شریفی',
    role: 'approver',
    roles: ['approver'],
    isActive: true,
    createdAt: '۱۴۰۳/۰۱/۱۵',
  },
  {
    id: 'usr_emp1',
    username: '1001',
    password: '1001',
    fullName: 'علیرضا حسینی مقدم',
    role: 'employee',
    roles: ['employee'],
    personnelCode: '1001',
    isActive: true,
    createdAt: '۱۴۰۳/۰۲/۰۱',
  },
  {
    id: 'usr_emp2',
    username: '1002',
    password: '1002',
    fullName: 'فاطمه احمدی‌پور',
    role: 'employee',
    roles: ['employee'],
    personnelCode: '1002',
    isActive: true,
    createdAt: '۱۴۰۳/۰۲/۰۱',
  },
];

const INITIAL_PERSONNEL: Personnel[] = [
  {
    id: 'p_1001',
    personnelCode: '1001',
    nationalCode: '0012345678',
    fullName: 'علیرضا حسینی مقدم',
    fatherName: 'محمدرضا',
    birthDate: '1364/05/12',
    hireDate: '1391/03/10',
    department: 'معاونت توسعه فناوری و اطلاعات',
    jobTitle: 'کارشناس ارشد زیرساخت و شبکه',
    employmentType: 'رسمی',
    netSalary: 380000000, // 38 million tomans in Rials
    isActive: true,
    blockTip: '',
    phone: '09121234567',
    accountNumber: '01058291001',
  },
  {
    id: 'p_1002',
    personnelCode: '1002',
    nationalCode: '0023456789',
    fullName: 'فاطمه احمدی‌پور',
    fatherName: 'علی‌اکبر',
    birthDate: '1369/08/24',
    hireDate: '1396/07/01',
    department: 'سیف الدوله (1)',
    jobTitle: 'حسابدار ارشد اعتبارات',
    employmentType: 'پیمانی',
    netSalary: 310000000,
    isActive: true,
    blockTip: '',
    phone: '09122345678',
    accountNumber: '01058291002',
  },
  {
    id: 'p_1003',
    personnelCode: '1003',
    nationalCode: '0034567890',
    fullName: 'مهدی صادقی نژاد',
    fatherName: 'غلامحسین',
    birthDate: '1373/02/15',
    hireDate: '1402/01/15',
    department: 'زینب کبری',
    jobTitle: 'کارشناس حقوقی',
    employmentType: 'آزمایشی',
    netSalary: 245000000,
    isActive: true,
    blockTip: '',
    phone: '09123456789',
    accountNumber: '01058291003',
  },
  {
    id: 'p_1004',
    personnelCode: '1004',
    nationalCode: '0045678901',
    fullName: 'حمیدرضا پیروزفر',
    fatherName: 'اسدالله',
    birthDate: '1342/10/01',
    hireDate: '1369/06/01',
    department: 'شهید رجائی (1)',
    jobTitle: 'مشاور ارشد (بازنشسته)',
    employmentType: 'بازنشسته',
    netSalary: 290000000,
    isActive: false,
    blockTip: 'غیرفعال سیستمی: پرسنل بازنشسته شده است و طبق مقررات صدور گواهی و ضمانت مسدود می‌باشد.',
    phone: '09124567890',
    accountNumber: '01058291004',
  },
  {
    id: 'p_1005',
    personnelCode: '1005',
    nationalCode: '0056789012',
    fullName: 'زهرا کاظمی دهکردی',
    fatherName: 'عباس',
    birthDate: '1370/11/04',
    hireDate: '1397/09/01',
    department: 'معاونت آموزش ابتدایی',
    jobTitle: 'مدرس و برنامه‌ریز آموزشی',
    employmentType: 'رسمی',
    netSalary: 340000000,
    isActive: true,
    blockTip: '',
    phone: '09125678901',
    accountNumber: '01058291005',
  },
  {
    id: 'p_1006',
    personnelCode: '1006',
    nationalCode: '0067890123',
    fullName: 'کامران رستمی (دریافتی زیر حداقل مجاز)',
    fatherName: 'منصور',
    birthDate: '1375/04/18',
    hireDate: '1400/02/10',
    department: 'شبانه روزی حاج رهبر',
    jobTitle: 'کارشناس رسانه و انتشارات',
    employmentType: 'پیمانی',
    netSalary: 95000000, // 9.5M Tomans -> below minNetSalary (12M)!
    isActive: true,
    blockTip: '',
    phone: '09126789012',
    accountNumber: '01058291006',
  },
];

const INITIAL_CERTIFICATES: Certificate[] = [
  {
    id: 'cert_101',
    trackingCode: 'TRK-8K4E-9P2M-7W3Q',
    certificateNo: '1/104',
    personnelId: 'p_1001',
    type: 'salary_deduction',
    bankName: 'بانک ملی ایران',
    branchName: 'شعبه مرکزی',
    branchCode: '0101',
    loanAmount: 150000000,
    isSurplus: false,
    status: 'issued',
    borrowerType: 'self',
    operatorName: 'سارا رضایی',
    approverName: 'دکتر شریفی',
    createdAt: '۱۴۰۳/۰۷/۱۵',
    approvedAt: '۱۴۰۳/۰۷/۱۶',
    notes: 'تسهیلات خرید کالا - صادر و تحویل گردید.',
  },
  {
    id: 'cert_102',
    trackingCode: 'TRK-5H7Y-3A9B-2F6R',
    certificateNo: '2/104',
    personnelId: 'p_1001',
    type: 'bank_guarantee',
    bankName: 'بانک مسکن',
    branchName: 'شعبه بهارستان',
    branchCode: '0420',
    loanAmount: 50000000,
    isSurplus: false,
    status: 'issued',
    borrowerType: 'other',
    borrowerName: 'رضا حسینی مقدم',
    borrowerFatherName: 'محمدرضا',
    borrowerNationalCode: '0071239999',
    borrowerRelation: 'برادر',
    operatorName: 'سارا رضایی',
    approverName: 'دکتر شریفی',
    createdAt: '۱۴۰۳/۰۸/۰۱',
    approvedAt: '۱۴۰۳/۰۸/۰۲',
    notes: 'ضمانت وام ودیعه مسکن برادر پرسنل',
  },
  {
    id: 'cert_103',
    trackingCode: 'TRK-4M8X-6D2N-9V5P',
    personnelId: 'p_1002',
    type: 'salary_deduction',
    bankName: 'بانک ملت',
    branchName: 'شعبه ونک',
    branchCode: '0512',
    loanAmount: 220000000,
    isSurplus: true,
    status: 'pending',
    borrowerType: 'self',
    operatorName: 'سارا رضایی',
    createdAt: '۱۴۰۳/۰۸/۱۸',
    notes: 'درخواست تسهیلات مازاد ضروری درمان - در انتظار تأیید کارتابل مدیر',
  },
  {
    id: 'cert_104',
    trackingCode: 'TRK-7T3W-8L5J-4K9E',
    certificateNo: '3/104',
    personnelId: 'p_1003',
    type: 'inquiry_twopiece',
    bankName: 'بانک قرض‌الحسنه مهر ایران',
    branchName: 'شعبه طالقانی',
    branchCode: '0310',
    loanAmount: 80000000,
    isSurplus: false,
    status: 'issued',
    borrowerType: 'self',
    bankLetterNumber: 'م/۱۴۰۳/۸۸',
    bankLetterDate: '۱۴۰۳/۰۸/۱۰',
    operatorName: 'سارا رضایی',
    approverName: 'دکتر شریفی',
    createdAt: '۱۴۰۳/۰۸/۱۲',
    approvedAt: '۱۴۰۳/۰۸/۱۳',
    notes: 'پاسخ استعلام تسهیلات در قطع دو تکه افقی A4',
  },
];

// Helper to safely read and write LocalStorage
function getItem<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function setItem<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

// Storage Manager Service
export const StorageManager = {
  // Settings
  getSettings(): SystemSettings {
    const s = getItem<SystemSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    if (!s.secretariatSuffix) {
      s.secretariatSuffix = '104';
    }
    if (s.secretariatCounter === undefined || s.secretariatCounter === null) {
      s.secretariatCounter = 1;
    }
    if (!s.secretariatYear) {
      s.secretariatYear = '1403';
    }
    if (!s.roleTitles) {
      s.roleTitles = { ...DEFAULT_SETTINGS.roleTitles };
    }
    if (!s.certificateTypes || s.certificateTypes.length === 0) {
      s.certificateTypes = [...DEFAULT_SETTINGS.certificateTypes];
    }
    if (!s.defaultTemplateIds) {
      s.defaultTemplateIds = { ...DEFAULT_SETTINGS.defaultTemplateIds };
    }
    return s;
  },
  saveSettings(settings: SystemSettings): void {
    setItem(STORAGE_KEYS.SETTINGS, settings);
  },

  // Reset secretariat counter at year change
  resetSecretariatCounter(year: string, startFrom: number = 1): void {
    const s = this.getSettings();
    s.secretariatYear = year;
    s.secretariatCounter = startFrom;
    this.saveSettings(s);
  },

  // Format Secretariat Number: {Counter}/{Suffix}
  generateSecretariatNumber(): string {
    const s = this.getSettings();
    const certNo = `${s.secretariatCounter}/${s.secretariatSuffix}`;
    s.secretariatCounter += 1;
    this.saveSettings(s);
    return certNo;
  },

  // Preferences (Theme, Font, Color)
  getUserPreferences(): UserPreferences {
    return getItem<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES, DEFAULT_PREFERENCES);
  },
  saveUserPreferences(pref: UserPreferences): void {
    setItem(STORAGE_KEYS.USER_PREFERENCES, pref);
  },

  // Personnel
  getPersonnel(): Personnel[] {
    return getItem<Personnel[]>(STORAGE_KEYS.PERSONNEL, INITIAL_PERSONNEL);
  },
  savePersonnel(list: Personnel[]): void {
    setItem(STORAGE_KEYS.PERSONNEL, list);
  },
  getPersonnelById(id: string): Personnel | undefined {
    return this.getPersonnel().find((p) => p.id === id);
  },
  getPersonnelByCode(code: string): Personnel | undefined {
    return this.getPersonnel().find((p) => p.personnelCode === code);
  },
  updatePersonnelStatus(id: string, isActive: boolean, blockTip: string): { success: boolean; message: string } {
    const list = this.getPersonnel();
    const target = list.find((p) => p.id === id);
    if (!target) return { success: false, message: 'پرسنل یافت نشد.' };

    // SYSTEM RULE: Retirees cannot be manually activated by operators!
    if (target.employmentType === 'بازنشسته' && isActive) {
      return {
        success: false,
        message: 'خطای سیستمی: پرسنل بازنشسته به صورت قطعی مسدود است و امکان فعال‌سازی آن وجود ندارد.',
      };
    }

    if (!isActive && !blockTip.trim()) {
      return { success: false, message: 'درج دلیل مسدودی (BlockTip) الزامی است.' };
    }

    target.isActive = isActive;
    target.blockTip = cleanPersian(blockTip);
    this.savePersonnel(list);
    return { success: true, message: isActive ? 'پرسنل فعال شد.' : 'پرسنل غیرفعال گردید.' };
  },

  // Filter retired personnel with NO active certificates for safe cleanup
  getDeletableRetiredPersonnel(): Personnel[] {
    const personnelList = this.getPersonnel();
    const certs = this.getCertificates();

    return personnelList.filter((p) => {
      if (p.employmentType !== 'بازنشسته') return false;
      const personCerts = certs.filter((c) => c.personnelId === p.id);
      const hasActiveCerts = personCerts.some(
        (c) => c.status === 'issued' || c.status === 'approved' || c.status === 'pending'
      );
      return !hasActiveCerts;
    });
  },

  // Delete retired personnel along with all their past certificates and records
  deleteRetiredPersonnelAndHistory(personnelId: string): { success: boolean; message: string } {
    const personnelList = this.getPersonnel();
    const pIndex = personnelList.findIndex((p) => p.id === personnelId);
    if (pIndex === -1) {
      return { success: false, message: 'پرسنل مورد نظر یافت نشد.' };
    }

    const p = personnelList[pIndex];
    if (p.employmentType !== 'بازنشسته') {
      return { success: false, message: 'تنها پرسنل بازنشسته و بدون تعهد فعال قابل حذف قطعی هستند.' };
    }

    const certs = this.getCertificates();
    const hasActiveCerts = certs.some(
      (c) =>
        c.personnelId === personnelId &&
        (c.status === 'issued' || c.status === 'approved' || c.status === 'pending')
    );
    if (hasActiveCerts) {
      return { success: false, message: 'این پرسنل دارای تعهد فعال است و امکان حذف آن وجود ندارد.' };
    }

    // Remove all associated certificates (settled / cancelled / rejected)
    const remainingCerts = certs.filter((c) => c.personnelId !== personnelId);
    this.saveCertificates(remainingCerts);

    // Remove associated user if any
    const users = this.getUsers().filter((u) => u.personnelCode !== p.personnelCode);
    this.saveUsers(users);

    // Remove personnel
    personnelList.splice(pIndex, 1);
    this.savePersonnel(personnelList);

    return {
      success: true,
      message: `اطلاعات و سوابق پرسنل بازنشسته «${p.fullName}» با موفقیت از سیستم پاکسازی شد.`,
    };
  },

  // Certificates
  getCertificates(): Certificate[] {
    const list = getItem<Certificate[]>(STORAGE_KEYS.CERTIFICATES, INITIAL_CERTIFICATES);
    // Upgrade any legacy sequential short tracking codes to unguessable cryptographic tracking codes
    let hasLegacy = false;
    const upgraded = list.map((c) => {
      if (c.trackingCode && /^TRK-\d{4}$/.test(c.trackingCode)) {
        hasLegacy = true;
        return { ...c, trackingCode: generateSecureTrackingCode() };
      }
      return c;
    });
    if (hasLegacy) {
      setItem(STORAGE_KEYS.CERTIFICATES, upgraded);
      return upgraded;
    }
    return list;
  },
  saveCertificates(list: Certificate[]): void {
    setItem(STORAGE_KEYS.CERTIFICATES, list);
  },

  // Delete certificate (Admin only)
  deleteCertificate(id: string, currentUser: SystemUser): { success: boolean; message: string } {
    const isAdmin =
      currentUser.role === 'admin' || (currentUser.roles && currentUser.roles.includes('admin'));
    if (!isAdmin) {
      return {
        success: false,
        message: 'خطای دسترسی: فقط مدیر ارشد سیستم مجاز به حذف گواهی‌ها است.',
      };
    }

    const list = this.getCertificates();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) {
      return { success: false, message: 'گواهی یافت نشد.' };
    }

    const cert = list[idx];
    list.splice(idx, 1);
    this.saveCertificates(list);

    return {
      success: true,
      message: `گواهی با کد رهگیری ${cert.trackingCode} با موفقیت حذف گردید.`,
    };
  },

  // Calculate personnel financial ceiling and current active obligations
  getPersonnelCreditSummary(personnelId: string) {
    const personnel = this.getPersonnelById(personnelId);
    const settings = this.getSettings();
    if (!personnel) return null;

    const allowedMonthlyLimit = Math.floor(personnel.netSalary * settings.netSalaryRatio);

    // Sum active loan amounts - SETTLED and CANCELLED CERTIFICATES ARE STRICTLY EXCLUDED
    const allCerts = this.getCertificates().filter((c) => c.personnelId === personnelId);
    const activeCerts = allCerts.filter(
      (c) => c.status === 'issued' || c.status === 'approved' || c.status === 'pending'
    );

    const totalActiveLoanAmount = activeCerts.reduce((sum, c) => sum + (c.loanAmount || 0), 0);
    const totalActiveMonthlyCommitment = activeCerts.reduce(
      (sum, c) => sum + (c.loanAmount || 0),
      0
    );

    const remainingQuota = Math.max(0, allowedMonthlyLimit - totalActiveMonthlyCommitment);

    return {
      personnel,
      allowedMonthlyLimit,
      totalActiveLoanAmount,
      totalActiveMonthlyCommitment,
      remainingQuota,
      activeCount: activeCerts.length,
      allCount: allCerts.length,
    };
  },

  // Agent Banks CRUD
  getAgentBanks(): AgentBank[] {
    const stored = getItem<AgentBank[] | null>(STORAGE_KEYS.AGENT_BANKS, null);
    if (stored && stored.length > 0) return stored;

    // Seed defaults
    const defaults: AgentBank[] = REGISTERED_BANKS.map((name, index) => ({
      id: `bank_${index + 1}`,
      name,
      isDefault: true,
    }));
    setItem(STORAGE_KEYS.AGENT_BANKS, defaults);
    return defaults;
  },
  saveAgentBanks(banks: AgentBank[]): void {
    setItem(STORAGE_KEYS.AGENT_BANKS, banks);
  },
  addAgentBank(name: string, code?: string): AgentBank {
    const cleaned = cleanPersian(name.trim());
    const banks = this.getAgentBanks();
    const existing = banks.find((b) => cleanPersian(b.name) === cleaned);
    if (existing) return existing;

    const newBank: AgentBank = {
      id: `bank_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: cleaned,
      code,
      isDefault: false,
    };
    banks.push(newBank);
    this.saveAgentBanks(banks);
    return newBank;
  },
  updateAgentBank(id: string, name: string, code?: string): boolean {
    const banks = this.getAgentBanks();
    const bank = banks.find((b) => b.id === id);
    if (!bank) return false;
    bank.name = cleanPersian(name.trim());
    if (code !== undefined) bank.code = code.trim();
    this.saveAgentBanks(banks);
    return true;
  },
  deleteAgentBank(id: string): boolean {
    const banks = this.getAgentBanks();
    const filtered = banks.filter((b) => b.id !== id);
    if (filtered.length === banks.length) return false;
    this.saveAgentBanks(filtered);
    return true;
  },
  ensureAgentBankExists(name: string): void {
    if (!name || !name.trim()) return;
    const cleaned = cleanPersian(name.trim());
    const banks = this.getAgentBanks();
    const exists = banks.some((b) => cleanPersian(b.name).toLowerCase() === cleaned.toLowerCase());
    if (!exists) {
      this.addAgentBank(cleaned);
    }
  },

  // Stamp & Digital Signature Images
  getStampImages(): SystemStampImage[] {
    return getItem<SystemStampImage[]>(STORAGE_KEYS.STAMP_IMAGES, []);
  },
  saveStampImage(image: SystemStampImage): { success: boolean; message: string } {
    const images = this.getStampImages();
    const idx = images.findIndex((img) => img.id === image.id);
    if (idx >= 0) {
      // Check if image is used in any certificate
      const isUsed = this.getCertificates().some((c) => c.signatureImageId === image.id);
      if (isUsed) {
        return {
          success: false,
          message:
            'این تصویر در یک یا چند گواهی ثبت‌شده استفاده شده است و به دلایل امنیت اسناد امکان ویرایش آن وجود ندارد.',
        };
      }
      images[idx] = image;
    } else {
      images.push(image);
    }
    setItem(STORAGE_KEYS.STAMP_IMAGES, images);
    return { success: true, message: 'تصویر مهر / امضا با موفقیت ذخیره شد.' };
  },
  deleteStampImage(id: string): { success: boolean; message: string } {
    const isUsed = this.getCertificates().some((c) => c.signatureImageId === id);
    if (isUsed) {
      return {
        success: false,
        message:
          'این تصویر در یک یا چند گواهی صادره استفاده شده و به دلایل امنیتی و اصالت‌سنجی سند، امکان حذف آن وجود ندارد.',
      };
    }
    const images = this.getStampImages().filter((img) => img.id !== id);
    setItem(STORAGE_KEYS.STAMP_IMAGES, images);
    return { success: true, message: 'تصویر با موفقیت حذف گردید.' };
  },

  // Create or request new certificate
  issueCertificate(
    certData: Omit<Certificate, 'id' | 'trackingCode' | 'isSurplus' | 'status' | 'createdAt'>
  ): {
    success: boolean;
    certificate?: Certificate;
    message: string;
  } {
    if (this.isIssuanceLocked()) {
      return {
        success: false,
        message: 'سامانه در حال بارگذاری و تطبیق ماهانه فایل پرسنل است؛ ثبت گواهی موقتاً مسدود می‌باشد.',
      };
    }

    const personnel = this.getPersonnelById(certData.personnelId);
    if (!personnel) {
      return { success: false, message: 'پرسنل انتخاب‌شده در سیستم معتبر نیست.' };
    }

    if (!personnel.isActive) {
      return {
        success: false,
        message: `پرسنل غیرفعال است: ${personnel.blockTip || 'دسترسی مسدود است.'}`,
      };
    }

    // Auto-register bank name in agent banks list
    if (certData.bankName) {
      this.ensureAgentBankExists(certData.bankName);
    }

    if (!certData.loanAmount || certData.loanAmount < 10000) {
      return {
        success: false,
        message: 'مبلغ درخواستی برای تسهیلات باید حداقل ۱۰,۰۰۰ یا بیشتر باشد.',
      };
    }

    const settings = this.getSettings();
    const credit = this.getPersonnelCreditSummary(personnel.id);
    const requestedCommitment = certData.loanAmount;

    // Check surplus logic
    const isSurplus = requestedCommitment > (credit?.remainingQuota || 0);

    if (isSurplus && !settings.allowSurplus) {
      return {
        success: false,
        message: 'مبلغ درخواستی بیش از سقف مجاز است و طبق تنظیمات سامانه صدور گواهی مازاد غیرفعال می‌باشد.',
      };
    }

    // Determine initial status based on approvalMode and surplus
    let status: Certificate['status'] = 'pending';
    let certNo: string | undefined = undefined;
    let approvedAt: string | undefined = undefined;
    let approverName: string | undefined = undefined;

    if (settings.approvalMode === 'none' || certData.type === 'inquiry' || certData.type === 'inquiry_twopiece') {
      status = 'approved';
      certNo = this.generateSecretariatNumber();
      approvedAt = getTodayShamsi();
      approverName = certData.operatorName || 'اپراتور صدور';
    } else if (settings.approvalMode === 'surplus_only' && !isSurplus) {
      status = 'approved';
      certNo = this.generateSecretariatNumber();
      approvedAt = getTodayShamsi();
      approverName = 'صدور مستقیم سازمانی';
    }

    const newCert: Certificate = {
      ...certData,
      id: `cert_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      trackingCode: generateSecureTrackingCode(), // Cryptographically random and unguessable
      certificateNo: certNo,
      isSurplus,
      status,
      approvedAt,
      approverName,
      createdAt: getTodayShamsi(),
      bankName: cleanPersian(certData.bankName),
      branchName: cleanPersian(certData.branchName),
      borrowerName: cleanPersian(certData.borrowerName),
      borrowerFatherName: cleanPersian(certData.borrowerFatherName),
      borrowerRelation: cleanPersian(certData.borrowerRelation),
      notes: cleanPersian(certData.notes),
    };

    const list = this.getCertificates();
    list.unshift(newCert);
    this.saveCertificates(list);

    const msg = isSurplus
      ? 'گواهی به علت مازاد بودن بر سقف اعتباری، جهت تأیید به کارتابل مدیران ارسال شد.'
      : status === 'approved'
      ? `گواهی با شماره دبیرخانه ${certNo} صادر و آماده چاپ گردید.`
      : 'درخواست با موفقیت ثبت شد و در صف تأیید قرار گرفت.';

    return { success: true, certificate: newCert, message: msg };
  },

  // Approver action
  approveCertificate(id: string, approverName: string): { success: boolean; message: string } {
    const list = this.getCertificates();
    const cert = list.find((c) => c.id === id);
    if (!cert) return { success: false, message: 'گواهی یافت نشد.' };

    cert.status = 'approved';
    cert.certificateNo = this.generateSecretariatNumber();
    cert.approvedAt = getTodayShamsi();
    cert.approverName = approverName;

    this.saveCertificates(list);

    return {
      success: true,
      message: `گواهی با شماره دبیرخانه ${cert.certificateNo} تأیید گردید و آماده چاپ است.`,
    };
  },

  // Reject action
  rejectCertificate(id: string, reason: string): { success: boolean; message: string } {
    const list = this.getCertificates();
    const cert = list.find((c) => c.id === id);
    if (!cert) return { success: false, message: 'گواهی یافت نشد.' };

    cert.status = 'rejected';
    cert.rejectionReason = cleanPersian(reason) || 'عدم احراز شرایط اعتباری و سازمانی';
    this.saveCertificates(list);

    return { success: true, message: 'درخواست گواهی رد شد.' };
  },

  // Settle or cancel certificate
  settleCertificate(
    id: string,
    action: 'settled' | 'cancelled',
    operatorName?: string
  ): { success: boolean; message: string } {
    const list = this.getCertificates();
    const cert = list.find((c) => c.id === id);
    if (!cert) return { success: false, message: 'گواهی یافت نشد.' };

    const op = operatorName || this.getCurrentUser().fullName;
    cert.status = action;

    if (action === 'settled') {
      cert.settledAt = getTodayShamsi();
      cert.settledBy = op;
    } else {
      cert.cancelledAt = getTodayShamsi();
      cert.cancelledBy = op;
    }

    this.saveCertificates(list);

    return {
      success: true,
      message:
        action === 'settled'
          ? 'گواهی با موفقیت تسویه گردید؛ این گواهی از سرجمع تعهدات کسر شده و سقف ضمانت کارمند آزاد شد.'
          : 'گواهی با موفقیت ابطال گردید و از تعهدات خارج شد.',
    };
  },

  // Monthly Personnel Feed Sync
  async processMonthlyPersonnelFeed(
    excelRows: Partial<Personnel>[]
  ): Promise<{ updatedCount: number; insertedCount: number; skippedCount: number; errors: string[] }> {
    this.setIssuanceLocked(true);

    try {
      const currentList = this.getPersonnel();
      const userList = this.getUsers();

      // Step 1: Deactivate all existing records with the exact requested text
      const defaultBlockTip =
        'غیرفعال سیستمی: پرسنل بازنشسته شده است و طبق مقررات صدور گواهی و ضمانت مسدود است. اطلاعات پرسنل در فایل جدید بارگذاری شده موجود نیست';

      currentList.forEach((p) => {
        p.isActive = false;
        p.blockTip = defaultBlockTip;
      });

      let updatedCount = 0;
      let insertedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      const validEmploymentTypes = ['رسمی', 'پیمانی', 'آزمایشی'];

      for (const row of excelRows) {
        if (!row.personnelCode || !row.nationalCode) {
          skippedCount++;
          continue;
        }

        const isValidType = validEmploymentTypes.includes(row.employmentType || '');
        const existing = currentList.find(
          (p) => p.personnelCode === row.personnelCode || p.nationalCode === row.nationalCode
        );

        if (existing) {
          existing.fullName = row.fullName || existing.fullName;
          existing.fatherName = row.fatherName || existing.fatherName;
          existing.department = row.department || existing.department;
          existing.jobTitle = row.jobTitle || existing.jobTitle;
          existing.employmentType = (row.employmentType as any) || existing.employmentType;
          existing.netSalary = row.netSalary !== undefined ? row.netSalary : existing.netSalary;
          existing.phone = row.phone || existing.phone;
          existing.accountNumber = row.accountNumber || existing.accountNumber;

          if (isValidType) {
            existing.isActive = true;
            existing.blockTip = '';
            updatedCount++;
          } else {
            existing.isActive = false;
            existing.blockTip = `نوع استخدام «${row.employmentType}» فاقد مجوز دریافت گواهی و ضمانت است.`;
            skippedCount++;
          }
        } else {
          const newPersonnel: Personnel = {
            id: `p_${row.personnelCode}_${Date.now()}`,
            personnelCode: row.personnelCode,
            nationalCode: row.nationalCode,
            fullName: cleanPersian(row.fullName || 'بدون نام'),
            fatherName: cleanPersian(row.fatherName || ''),
            birthDate: row.birthDate || '1365/01/01',
            hireDate: row.hireDate || '1395/01/01',
            department: cleanPersian(row.department || 'ستاد مدیریت آموزش و پرورش ملایر'),
            jobTitle: cleanPersian(row.jobTitle || 'کارشناس'),
            employmentType: (row.employmentType as any) || 'رسمی',
            netSalary: row.netSalary || 200000000,
            isActive: isValidType,
            blockTip: isValidType
              ? ''
              : `نوع استخدام «${row.employmentType}» فاقد مجوز دریافت گواهی است.`,
            phone: row.phone || '',
            accountNumber: row.accountNumber || '',
          };

          currentList.push(newPersonnel);
          if (isValidType) {
            insertedCount++;
          } else {
            skippedCount++;
          }

          // Auto-create user account with personnelCode as initial password
          const existingUser = userList.find((u) => u.username === row.personnelCode);
          if (!existingUser) {
            userList.push({
              id: `usr_${row.personnelCode}`,
              username: row.personnelCode,
              password: row.personnelCode,
              fullName: newPersonnel.fullName,
              role: 'employee',
              roles: ['employee'],
              personnelCode: row.personnelCode,
              isActive: isValidType,
              createdAt: getTodayShamsi(),
            });
          }
        }
      }

      this.savePersonnel(currentList);
      this.saveUsers(userList);

      return { updatedCount, insertedCount, skippedCount, errors };
    } finally {
      this.setIssuanceLocked(false);
    }
  },

  // Lock status
  isIssuanceLocked(): boolean {
    return getItem<boolean>(STORAGE_KEYS.LOCK_ISSUANCE, false);
  },
  setIssuanceLocked(locked: boolean): void {
    setItem(STORAGE_KEYS.LOCK_ISSUANCE, locked);
  },

  // Templates
  getTemplates(): LetterTemplate[] {
    return getItem<LetterTemplate[]>(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
  },
  saveTemplate(tpl: LetterTemplate): void {
    const list = this.getTemplates();
    const idx = list.findIndex((t) => t.id === tpl.id);
    if (idx >= 0) {
      list[idx] = tpl;
    } else {
      list.push(tpl);
    }
    setItem(STORAGE_KEYS.TEMPLATES, list);
  },
  resetTemplatesToDefault(): void {
    setItem(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
  },

  // Users & Default Admin Auto-sync
  getUsers(): SystemUser[] {
    const rawUsers = getItem<SystemUser[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    return this.syncDefaultAdminStatus(rawUsers);
  },

  // Sync default admin status according to business rules:
  // "با تعیین نقش «مدیر» برای سایر کاربران، این کاربر پیشفرض و ورود آن غیرفعال شود.
  // اگر نقش مدیر از همه مدیران گرفته شد، این کاربر پیشفرض مجدد با همان نقش ها فعال شود"
  syncDefaultAdminStatus(users: SystemUser[]): SystemUser[] {
    const otherAdmins = users.filter(
      (u) =>
        u.username !== 'admin' &&
        (u.role === 'admin' || (u.roles && u.roles.includes('admin'))) &&
        u.isActive
    );

    let defaultAdmin = users.find((u) => u.username === 'admin');
    if (!defaultAdmin) {
      defaultAdmin = {
        id: 'usr_default_admin',
        username: 'admin',
        password: 'admin',
        fullName: 'کاربر پیش‌فرض مدیریت و پشتیبانی',
        role: 'admin',
        roles: ['admin', 'operator', 'approver', 'employee'],
        isActive: otherAdmins.length === 0,
        createdAt: '۱۴۰۳/۰۱/۰۱',
      };
      users.unshift(defaultAdmin);
    } else {
      if (otherAdmins.length > 0) {
        defaultAdmin.isActive = false;
      } else {
        defaultAdmin.isActive = true;
        if (!defaultAdmin.roles || defaultAdmin.roles.length === 0) {
          defaultAdmin.roles = ['admin', 'operator', 'approver', 'employee'];
        }
      }
    }
    return users;
  },

  saveUsers(users: SystemUser[]): void {
    const synced = this.syncDefaultAdminStatus(users);
    setItem(STORAGE_KEYS.USERS, synced);
  },

  getCurrentUser(): SystemUser {
    return getItem<SystemUser>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  },
  setCurrentUser(user: SystemUser): void {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  // Reset user password to personnelCode / username
  resetUserPassword(
    userId: string,
    currentOperator: SystemUser
  ): { success: boolean; defaultPassword: string; message: string } {
    const users = this.getUsers();
    const target = users.find((x) => x.id === userId);
    if (!target) return { success: false, defaultPassword: '', message: 'کاربر یافت نشد.' };

    const isCurrentAdmin =
      currentOperator.role === 'admin' ||
      (currentOperator.roles && currentOperator.roles.includes('admin'));
    const isTargetAdminOrOp =
      target.role === 'admin' ||
      target.role === 'operator' ||
      (target.roles && (target.roles.includes('admin') || target.roles.includes('operator')));

    if (isTargetAdminOrOp && !isCurrentAdmin) {
      return {
        success: false,
        defaultPassword: '',
        message: 'فقط مدیر سامانه می‌تواند رمز سایر مدیران یا اپراتورها را بازنشانی کند.',
      };
    }

    const defaultPassword = target.personnelCode || target.username;
    target.password = defaultPassword;
    target.mustChangePassword = false;
    this.saveUsers(users);

    return {
      success: true,
      defaultPassword,
      message: `رمز عبور کاربر «${target.fullName}» به «${defaultPassword}» بازنشانی شد.`,
    };
  },

  // Change password by user
  changeUserPassword(
    userId: string,
    newPass: string
  ): { success: boolean; message: string } {
    const users = this.getUsers();
    const target = users.find((x) => x.id === userId);
    if (!target) return { success: false, message: 'کاربر یافت نشد.' };

    const settings = this.getSettings();
    if (settings.forcePasswordComplexity && newPass.length < 6) {
      return { success: false, message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' };
    }

    target.password = newPass;
    target.mustChangePassword = false;
    this.saveUsers(users);

    return { success: true, message: 'رمز عبور با موفقیت تغییر یافت.' };
  },

  // Complete system wipe and reset
  wipeAllSystemData(restoreDefaults: boolean): void {
    if (restoreDefaults) {
      setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      setItem(STORAGE_KEYS.PERSONNEL, INITIAL_PERSONNEL);
      setItem(STORAGE_KEYS.CERTIFICATES, INITIAL_CERTIFICATES);
      setItem(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
      setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
      setItem(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
      setItem(STORAGE_KEYS.AGENT_BANKS, REGISTERED_BANKS.map((name, i) => ({ id: `bank_${i + 1}`, name, isDefault: true })));
      setItem(STORAGE_KEYS.STAMP_IMAGES, []);
    } else {
      // Empty system completely
      setItem(STORAGE_KEYS.CERTIFICATES, []);
      setItem(STORAGE_KEYS.PERSONNEL, []);
      const defaultAdminOnly: SystemUser[] = [
        {
          id: 'usr_default_admin',
          username: 'admin',
          password: 'admin',
          fullName: 'کاربر پیش‌فرض مدیریت و پشتیبانی',
          role: 'admin',
          roles: ['admin', 'operator', 'approver', 'employee'],
          isActive: true,
          createdAt: getTodayShamsi(),
        },
      ];
      setItem(STORAGE_KEYS.USERS, defaultAdminOnly);
      setItem(STORAGE_KEYS.CURRENT_USER, defaultAdminOnly[0]);
      setItem(STORAGE_KEYS.STAMP_IMAGES, []);
      const emptySettings = { ...DEFAULT_SETTINGS, secretariatCounter: 1 };
      setItem(STORAGE_KEYS.SETTINGS, emptySettings);
    }
  },

  // Data Migration from Legacy SQL Server Table `Govahies`
  importLegacyGovahies(
    legacyData: Array<Record<string, any>>
  ): { importedCount: number; errors: string[] } {
    const certList = this.getCertificates();
    const personnelList = this.getPersonnel();
    const errors: string[] = [];
    let importedCount = 0;

    for (const item of legacyData) {
      const pCode = String(item.Code || item.personnelCode || '').trim();
      if (!pCode) {
        errors.push(`ردیف با شناسه ${item.RowID || item.oldId || 'نامشخص'} فاقد کد پرسنلی است.`);
        continue;
      }

      const p = personnelList.find((x) => x.personnelCode === pCode);
      if (!p) {
        errors.push(`پرسنل با کد پرسنلی ${pCode} در جدول پرسنل جدید یافت نشد.`);
        continue;
      }

      let type: Certificate['type'] = 'salary_deduction';
      const gType = item.GovahiTypeID !== undefined ? Number(item.GovahiTypeID) : item.type;
      if (gType === 2 || String(gType).includes('ضمانت') || gType === 'bank_guarantee') {
        type = 'bank_guarantee';
      } else if (gType === 3 || String(gType).includes('استعلام') || gType === 'inquiry' || gType === 'inquiry_twopiece') {
        type = 'inquiry_twopiece';
      }

      let status: Certificate['status'] = 'issued';
      const isSettled =
        item.StateId === 2 ||
        item.status === 'تسویه' ||
        item.status === 'settled' ||
        Boolean(item.TasviyehDate) ||
        Boolean(item.settledAt);

      if (isSettled) {
        status = 'settled';
      } else if (item.StateId === 3 || item.status === 'باطل' || item.status === 'cancelled') {
        status = 'cancelled';
      } else if (item.status === 'رد' || item.status === 'rejected') {
        status = 'rejected';
      }

      const rawBorrowerName =
        item.borrowerName ||
        [item.LoanOwner_FirstName, item.LoanOwner_LastName].filter(Boolean).join(' ').trim();
      const borrowerFatherName = item.borrowerFatherName || item.LoanOwner_FatherName || '';
      const borrowerNationalCode = item.borrowerNationalCode || item.LoanOwner_NID || '';

      const relativeId = item.RelativeId !== undefined ? Number(item.RelativeId) : null;
      let borrowerRelation = item.borrowerRelation;
      if (!borrowerRelation && relativeId !== null) {
        switch (relativeId) {
          case 1:
            borrowerRelation = 'خود پرسنل';
            break;
          case 2:
            borrowerRelation = 'فرزند';
            break;
          case 3:
            borrowerRelation = 'همسر';
            break;
          case 4:
            borrowerRelation = 'برادر';
            break;
          case 5:
            borrowerRelation = 'خواهر';
            break;
          case 6:
            borrowerRelation = 'پدر';
            break;
          case 7:
            borrowerRelation = 'مادر';
            break;
          default:
            borrowerRelation = 'سایر بستگان';
            break;
        }
      }

      const borrowerType: 'self' | 'other' =
        relativeId === 1 || (!rawBorrowerName && !borrowerNationalCode) ? 'self' : 'other';

      const isSurplus = Boolean(item.isSurplus || item.Vaziyat_Soudur === 2);
      const shomareh = item.Shomareh || item.certificateNo || `${this.generateSecretariatNumber()}`;

      const createDate = item.createdAt || item.DateOfCreate || getTodayShamsi();
      const settledDate = item.settledAt || item.TasviyehDate || (isSettled ? getTodayShamsi() : undefined);
      const settledBy = item.settledBy || item.Tasviyehby || (isSettled ? 'اپراتور تسویه دیتابیس قدیمی' : undefined);

      const migratedCert: Certificate = {
        id: `migrated_${item.RowID || item.oldId || Date.now()}_${Math.random().toString(36).substring(7)}`,
        trackingCode: generateSecureTrackingCode(),
        certificateNo: String(shomareh),
        personnelId: p.id,
        type,
        bankName: cleanPersian(item.BankFullname || item.bankName || 'بانک عامل'),
        branchName: cleanPersian(item.branchName || 'شعبه مرکزی'),
        loanAmount: Number(item.LoanAmount || item.loanAmount) || 100000000,
        monthlyInstallment: item.monthlyInstallment ? Number(item.monthlyInstallment) : undefined,
        isSurplus,
        status,
        borrowerType,
        borrowerName: cleanPersian(rawBorrowerName) || (borrowerType === 'self' ? p.fullName : undefined),
        borrowerFatherName: cleanPersian(borrowerFatherName) || (borrowerType === 'self' ? p.fatherName : undefined),
        borrowerNationalCode: borrowerNationalCode || (borrowerType === 'self' ? p.nationalCode : undefined),
        borrowerRelation: cleanPersian(borrowerRelation) || (borrowerType === 'self' ? 'خود پرسنل' : 'شخص ثالث'),
        operatorName: cleanPersian(item.Sader_Konandeh || item.operatorName || 'انتقال دیتابیس قدیمی SQL Server'),
        approverName: cleanPersian(item.approverName || 'ثبت در دیتابیس Zemanatnameh'),
        createdAt: typeof createDate === 'string' ? createDate.slice(0, 10) : getTodayShamsi(),
        approvedAt: typeof createDate === 'string' ? createDate.slice(0, 10) : getTodayShamsi(),
        settledAt: settledDate ? (typeof settledDate === 'string' ? settledDate.slice(0, 10) : getTodayShamsi()) : undefined,
        settledBy: cleanPersian(settledBy),
        bankLetterNumber: item.Shomareh_Nameh_Estelam_Bank || item.bankLetterNumber,
        bankLetterDate: item.Tarikh_Nameh_Estelam_Bank || item.bankLetterDate,
        notes: `انتقال سابقه از جدول Govahies دیتابیس قدیمی (شناسه رکورد: ${item.RowID || item.oldId || '---'})`,
      };

      certList.push(migratedCert);
      importedCount++;
    }

    this.saveCertificates(certList);
    return { importedCount, errors };
  },
};

