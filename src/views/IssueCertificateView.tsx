import React, { useState, useMemo } from 'react';
import { Certificate, CertificateType, Personnel, SystemSettings, SystemUser } from '../types';
import {
  amountToPersianWords,
  cleanPersian,
  formatCurrency,
  toEnglishDigits,
  toPersianDigits,
} from '../utils/persianUtils';
import { StorageManager } from '../utils/storage';
import { AgentBanksModal } from '../components/AgentBanksModal';
import {
  FileCheck,
  Building2,
  User,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Coins,
  ShieldAlert,
  Send,
  Search,
  PlusCircle,
  FileText,
} from 'lucide-react';

interface IssueCertificateViewProps {
  personnelList: Personnel[];
  settings: SystemSettings;
  currentUser: SystemUser;
  preSelectedPersonnel?: Personnel | null;
  onSuccess: (cert: Certificate) => void;
  onNavigate: (view: string) => void;
}

export const IssueCertificateView: React.FC<IssueCertificateViewProps> = ({
  personnelList,
  settings,
  currentUser,
  preSelectedPersonnel,
  onSuccess,
  onNavigate,
}) => {
  const [certType, setCertType] = useState<'salary_deduction' | 'bank_guarantee'>('salary_deduction');
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>(
    preSelectedPersonnel ? preSelectedPersonnel.id : personnelList[0]?.id || ''
  );
  const [personnelSearchTerm, setPersonnelSearchTerm] = useState('');

  // Form Fields
  const [bankName, setBankName] = useState<string>('');
  const [branchName, setBranchName] = useState<string>('شعبه مرکزی');
  const [branchCode, setBranchCode] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<number>(100000000); // Default 100M Rials
  const [loanAmountInput, setLoanAmountInput] = useState<string>('100000000');
  const [borrowerType, setBorrowerType] = useState<'self' | 'other'>('self');
  const [borrowerName, setBorrowerName] = useState<string>('');
  const [borrowerFatherName, setBorrowerFatherName] = useState<string>('');
  const [borrowerNationalCode, setBorrowerNationalCode] = useState<string>('');
  const [borrowerRelation, setBorrowerRelation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedSignatureImageId, setSelectedSignatureImageId] = useState<string>('');

  // Persian Validation Errors Map
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');
  const [bankSuggestions, setBankSuggestions] = useState<string[]>([]);
  const [isBanksModalOpen, setIsBanksModalOpen] = useState(false);

  const stampImages = StorageManager.getStampImages();
  const agentBanks = StorageManager.getAgentBanks();
  const isLocked = StorageManager.isIssuanceLocked();

  // Filtered personnel list for search
  const filteredPersonnel = useMemo(() => {
    if (!personnelSearchTerm.trim()) return personnelList;
    const term = cleanPersian(personnelSearchTerm.toLowerCase());
    return personnelList.filter(
      (p) =>
        cleanPersian(p.fullName).toLowerCase().includes(term) ||
        p.personnelCode.includes(term) ||
        p.nationalCode.includes(term) ||
        cleanPersian(p.department).toLowerCase().includes(term)
    );
  }, [personnelList, personnelSearchTerm]);

  const activePersonnel = personnelList.find((p) => p.id === selectedPersonnelId);
  const creditSummary = selectedPersonnelId
    ? StorageManager.getPersonnelCreditSummary(selectedPersonnelId)
    : null;

  // Real-time Surplus evaluation
  const isSurplus = (creditSummary?.remainingQuota || 0) < loanAmount;

  // Switch type and adjust default borrower
  const handleTypeChange = (type: 'salary_deduction' | 'bank_guarantee') => {
    setCertType(type);
    if (type === 'salary_deduction') {
      setBorrowerType('self');
    } else {
      setBorrowerType('other');
    }
    setErrors({});
  };

  // Auto-suggest banks as user types
  const handleBankInputChange = (val: string) => {
    const cleaned = cleanPersian(val);
    setBankName(cleaned);
    if (errors.bankName) {
      setErrors((prev) => ({ ...prev, bankName: '' }));
    }
    if (cleaned.length > 0) {
      const matched = agentBanks
        .map((b) => b.name)
        .filter((name) => cleanPersian(name).includes(cleaned));
      setBankSuggestions(matched.slice(0, 6));
    } else {
      setBankSuggestions([]);
    }
  };

  const handleSelectBank = (bank: string) => {
    setBankName(bank);
    setBankSuggestions([]);
    if (errors.bankName) {
      setErrors((prev) => ({ ...prev, bankName: '' }));
    }
  };

  const handleLoanAmountChange = (val: string) => {
    const engVal = toEnglishDigits(val).replace(/[^0-9]/g, '');
    setLoanAmountInput(engVal);
    const num = Number(engVal) || 0;
    setLoanAmount(num);
    if (errors.loanAmount && num >= 10000) {
      setErrors((prev) => ({ ...prev, loanAmount: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedPersonnelId || !activePersonnel) {
      newErrors.personnel = 'لطفاً پرسنل مورد نظر را انتخاب نمایید.';
    }

    if (activePersonnel && !activePersonnel.isActive) {
      newErrors.personnel = `امکان صدور برای پرسنل مسدود وجود ندارد: ${activePersonnel.blockTip || 'دسترسی مسدود است'}`;
    }

    if (!bankName.trim()) {
      newErrors.bankName = 'لطفاً نام بانک عامل را وارد نمایید.';
    }

    if (!branchName.trim()) {
      newErrors.branchName = 'لطفاً نام شعبه بانک را وارد نمایید.';
    }

    if (!loanAmount || loanAmount < 10000) {
      newErrors.loanAmount = 'مبلغ درخواستی برای تسهیلات باید حداقل ۱۰,۰۰۰ یا بیشتر باشد.';
    }

    if (borrowerType === 'other') {
      if (!borrowerName.trim()) {
        newErrors.borrowerName = 'لطفاً نام و نام خانوادگی وام‌گیرنده شخص ثالث را وارد نمایید.';
      }
      if (!borrowerNationalCode.trim()) {
        newErrors.borrowerNationalCode = 'لطفاً کد ملی وام‌گیرنده را وارد نمایید.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (isLocked) {
      setFormError('فرآیند بارگذاری ماهانه فعال است؛ ثبت گواهی جدید موقتاً مسدود می‌باشد.');
      return;
    }

    if (!validateForm()) {
      setFormError('لطفاً فیلدهای اجباری مشخص‌شده را با مقادیر معتبر تکمیل فرمایید.');
      return;
    }

    if (!activePersonnel) return;

    if (isSurplus && !settings.allowSurplus) {
      setFormError('مبلغ گواهی بیش از سقف مجاز بوده و طبق تنظیمات سازمان صدور گواهی مازاد ممنوع است.');
      return;
    }

    const res = StorageManager.issueCertificate({
      personnelId: activePersonnel.id,
      type: certType,
      bankName: cleanPersian(bankName),
      branchName: cleanPersian(branchName),
      branchCode: cleanPersian(branchCode),
      loanAmount,
      borrowerType,
      borrowerName: borrowerType === 'self' ? activePersonnel.fullName : cleanPersian(borrowerName),
      borrowerFatherName:
        borrowerType === 'self' ? activePersonnel.fatherName : cleanPersian(borrowerFatherName),
      borrowerNationalCode:
        borrowerType === 'self' ? activePersonnel.nationalCode : cleanPersian(borrowerNationalCode),
      borrowerRelation: borrowerType === 'self' ? 'خود پرسنل' : cleanPersian(borrowerRelation),
      operatorName: currentUser.fullName,
      notes: cleanPersian(notes),
      signatureImageId: selectedSignatureImageId || undefined,
    });

    if (!res.success) {
      setFormError(res.message);
      return;
    }

    setFormSuccess(res.message);
    if (res.certificate) {
      onSuccess(res.certificate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              صدور گواهی کسر از حقوق و ضمانت‌نامه بانکی
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ثبت مشخصات بانک، بررسی خودکار سقف اعتباری پرسنل و تولید شناسه امنیتی رهگیری
            </p>
          </div>

          {/* Type Selector Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('salary_deduction')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                certType === 'salary_deduction'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>گواهی کسر از حقوق</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('bank_guarantee')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                certType === 'bank_guarantee'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>ضمانت‌نامه بانکی</span>
            </button>
          </div>
        </div>
      </div>

      {isLocked && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-2xl text-rose-800 dark:text-rose-200 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold block">سامانه در حال بروزرسانی ماهانه پرسنل است</span>
            <span className="text-[11px]">جهت جلوگیری از مغایرت‌های مالی، ثبت گواهی جدید موقتاً مسدود می‌باشد.</span>
          </div>
        </div>
      )}

      {/* Main Form and Side Credit Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* 1. Personnel Selection with Search Filter */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  انتخاب پرسنل متقاضی / ضامن <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {toPersianDigits(filteredPersonnel.length)} پرسنل یافت شد
                </span>
              </div>

              {/* Quick Search */}
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="جستجوی سریع پرسنل با نام، کد پرسنلی یا کد ملی..."
                  value={personnelSearchTerm}
                  onChange={(e) => setPersonnelSearchTerm(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedPersonnelId}
                onChange={(e) => {
                  setSelectedPersonnelId(e.target.value);
                  if (errors.personnel) {
                    setErrors((prev) => ({ ...prev, personnel: '' }));
                  }
                }}
                className={`w-full p-2.5 rounded-xl border ${
                  errors.personnel
                    ? 'border-rose-400 dark:border-rose-600 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                } text-slate-800 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
              >
                {filteredPersonnel.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} - کد پرسنلی: {toPersianDigits(p.personnelCode)} ({p.employmentType}) -{' '}
                    خالص: {formatCurrency(p.netSalary, settings.currency)} -{' '}
                    {p.isActive ? 'فعال' : `مسدود: ${p.blockTip.slice(0, 30)}`}
                  </option>
                ))}
              </select>
              {errors.personnel && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {errors.personnel}
                </p>
              )}
            </div>

            {/* 2. Bank Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative sm:col-span-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    نام بانک عامل <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsBanksModalOpen(true)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                    title="مدیریت و افزودن بانک‌های عامل"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>بانک‌ها</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="مثال: بانک ملی، ملت، سپه..."
                  value={bankName}
                  onChange={(e) => handleBankInputChange(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    errors.bankName
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                  } text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.bankName && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {errors.bankName}
                  </p>
                )}
                {bankSuggestions.length > 0 && (
                  <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-30 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                    {bankSuggestions.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleSelectBank(b)}
                        className="w-full text-right px-3 py-2 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition block cursor-pointer"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
                  نام شعبه <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="شعبه مرکزی"
                  value={branchName}
                  onChange={(e) => {
                    setBranchName(cleanPersian(e.target.value));
                    if (errors.branchName) setErrors((prev) => ({ ...prev, branchName: '' }));
                  }}
                  className={`w-full p-2.5 rounded-xl border ${
                    errors.branchName
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                  } text-slate-800 dark:text-slate-100 text-xs font-medium`}
                />
                {errors.branchName && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {errors.branchName}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">کد شعبه</label>
                <input
                  type="text"
                  placeholder="۰۱۰۱"
                  value={branchCode}
                  onChange={(e) => setBranchCode(toEnglishDigits(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono"
                />
              </div>
            </div>

            {/* 3. Borrower Specifications */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {certType === 'bank_guarantee' ? 'مشخصات وام‌گیرنده اصلی (ضمانت‌شونده):' : 'مشخصات وام‌گیرنده:'}
                </span>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="borrowerType"
                      checked={borrowerType === 'self'}
                      onChange={() => setBorrowerType('self')}
                      className="text-blue-600"
                    />
                    <span className="dark:text-slate-200">خود پرسنل</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="borrowerType"
                      checked={borrowerType === 'other'}
                      onChange={() => setBorrowerType('other')}
                      className="text-blue-600"
                    />
                    <span className="dark:text-slate-200">شخص ثالث (ضمانت دیگران)</span>
                  </label>
                </div>
              </div>

              {borrowerType === 'other' ? (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      نام و نام خانوادگی وام‌گیرنده <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="نام کامل وام‌گیرنده"
                      value={borrowerName}
                      onChange={(e) => {
                        setBorrowerName(cleanPersian(e.target.value));
                        if (errors.borrowerName) setErrors((prev) => ({ ...prev, borrowerName: '' }));
                      }}
                      className={`w-full p-2 rounded-lg border ${
                        errors.borrowerName
                          ? 'border-rose-400 dark:border-rose-600 bg-rose-50/50'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      } text-slate-800 dark:text-slate-100 text-xs`}
                    />
                    {errors.borrowerName && (
                      <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                        {errors.borrowerName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      نام پدر وام‌گیرنده
                    </label>
                    <input
                      type="text"
                      placeholder="نام پدر"
                      value={borrowerFatherName}
                      onChange={(e) => setBorrowerFatherName(cleanPersian(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      کد ملی وام‌گیرنده <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="۱۰ رقم"
                      value={borrowerNationalCode}
                      onChange={(e) => {
                        setBorrowerNationalCode(toEnglishDigits(e.target.value));
                        if (errors.borrowerNationalCode) setErrors((prev) => ({ ...prev, borrowerNationalCode: '' }));
                      }}
                      className={`w-full p-2 rounded-lg border ${
                        errors.borrowerNationalCode
                          ? 'border-rose-400 dark:border-rose-600 bg-rose-50/50'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      } text-slate-800 dark:text-slate-100 text-xs font-mono`}
                    />
                    {errors.borrowerNationalCode && (
                      <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                        {errors.borrowerNationalCode}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      نسبت با کارمند ضامن
                    </label>
                    <select
                      value={borrowerRelation}
                      onChange={(e) => setBorrowerRelation(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
                    >
                      <option value="">انتخاب نسبت...</option>
                      <option value="فرزند">فرزند</option>
                      <option value="همسر">همسر</option>
                      <option value="برادر">برادر</option>
                      <option value="خواهر">خواهر</option>
                      <option value="پدر">پدر</option>
                      <option value="مادر">مادر</option>
                      <option value="همکار">همکار</option>
                      <option value="سایر بستگان">سایر بستگان</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/20 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                  تسهیلات متعلق به خود پرسنل متقاضی ({activePersonnel?.fullName}) صادر خواهد شد.
                </div>
              )}
            </div>

            {/* 4. Financial Amount: Valid from 10,000 and above */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  مبلغ کل وام / تعهد تسهیلات (ریال) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  حداقل مجاز: ۱۰,۰۰۰ ریال به بالا
                </span>
              </div>
              <input
                type="text"
                value={loanAmountInput}
                onChange={(e) => handleLoanAmountChange(e.target.value)}
                placeholder="حداقل ۱۰,۰۰۰ ریال به بالا"
                className={`w-full p-2.5 rounded-xl border ${
                  errors.loanAmount
                    ? 'border-rose-400 dark:border-rose-600 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                } text-slate-900 dark:text-slate-100 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.loanAmount && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {errors.loanAmount}
                </p>
              )}
              <div className="mt-1.5 p-2 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-lg text-blue-900 dark:text-blue-200 text-xs font-medium">
                <span className="font-bold text-blue-800 dark:text-blue-300">معادل به حروف: </span>
                {loanAmount >= 10000
                  ? amountToPersianWords(loanAmount, settings.currency)
                  : 'مبلغ باید از ۱۰,۰۰۰ به بالا باشد'}
              </div>
            </div>

            {/* Optional Stamp / Signature Image Picker */}
            {stampImages.length > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
                  انتخاب مهر و امضای دیجیتالی رسمی سند
                </label>
                <select
                  value={selectedSignatureImageId}
                  onChange={(e) => setSelectedSignatureImageId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
                >
                  <option value="">امضا و مهر پیش‌فرض سامانه</option>
                  {stampImages.map((img) => (
                    <option key={img.id} value={img.id}>
                      {img.name} ({img.type === 'signature' ? 'امضای دیجیتال' : 'مهر رسمی'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
                توضیحات و یادداشت اداری (اختیاری)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(cleanPersian(e.target.value))}
                placeholder="توضیحات تکمیلی..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
              />
            </div>

            {/* Notifications */}
            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => onNavigate('archive')}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                انصراف و بازگشت
              </button>
              <button
                type="submit"
                disabled={isLocked || (activePersonnel && !activePersonnel.isActive)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>ثبت نهایی و صدور سند</span>
              </button>
            </div>
          </form>
        </div>

        {/* Side Credit Status & Surplus Analyzer (1 col) */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>تحلیلگر سقف اعتباری</span>
            </h3>

            {activePersonnel && creditSummary ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">کارمند متقاضی:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{activePersonnel.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">نوع استخدام:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-400">{activePersonnel.employmentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">خالص دریافتی ماهانه:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(activePersonnel.netSalary, settings.currency)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      سقف مجاز ({toPersianDigits(settings.netSalaryRatio * 100)}٪):
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(creditSummary.allowedMonthlyLimit, settings.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">مجموع تعهدات جاری:</span>
                    <span className="font-bold text-rose-600">
                      {formatCurrency(creditSummary.totalActiveMonthlyCommitment, settings.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800 font-bold">
                    <span className="text-slate-700 dark:text-slate-300">باقی‌مانده سقف قابل تعهد:</span>
                    <span
                      className={`${
                        creditSummary.remainingQuota > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(creditSummary.remainingQuota, settings.currency)}
                    </span>
                  </div>
                </div>

                {/* Surplus Badge Alert */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    isSurplus
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {isSurplus ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>
                      {isSurplus ? 'تشخیص: گواهی مازاد بر سقف' : 'تشخیص: گواهی عادی و استاندارد'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {isSurplus
                      ? 'مبلغ تعهد بیش از سقف مجاز پرسنل است. این درخواست به کارتابل تأیید ارجاع داده خواهد شد.'
                      : 'این درخواست درون سقف قانونی پرسنل قرار دارد و مشمول صدور مستقیم است.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">
                پرسنل مورد نظر را انتخاب فرمایید
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent Banks Management Modal */}
      <AgentBanksModal
        isOpen={isBanksModalOpen}
        onClose={() => setIsBanksModalOpen(false)}
      />
    </div>
  );
};
