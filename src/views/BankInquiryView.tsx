import React, { useState } from 'react';
import { Certificate, CertificateType, Personnel, SystemSettings, SystemUser } from '../types';
import { cleanPersian, formatCurrency, toPersianDigits, toEnglishDigits, getTodayShamsi } from '../utils/persianUtils';
import { StorageManager } from '../utils/storage';
import { AgentBanksModal } from '../components/AgentBanksModal';
import {
  Scissors,
  Search,
  Filter,
  FileCheck2,
  Building2,
  Printer,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  FileText,
  User,
} from 'lucide-react';

interface BankInquiryViewProps {
  personnelList: Personnel[];
  certificates: Certificate[];
  settings: SystemSettings;
  currentUser: SystemUser;
  onRefresh: () => void;
  onViewCertificate: (cert: Certificate) => void;
}

export const BankInquiryView: React.FC<BankInquiryViewProps> = ({
  personnelList,
  certificates,
  settings,
  currentUser,
  onRefresh,
  onViewCertificate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [selectedBaseCert, setSelectedBaseCert] = useState<Certificate | null>(null);

  // Inquiry form states
  const [inquiryType, setInquiryType] = useState<'inquiry_twopiece' | 'inquiry'>('inquiry_twopiece');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('شعبه مرکزی');
  const [bankLetterNumber, setBankLetterNumber] = useState('');
  const [bankLetterDate, setBankLetterDate] = useState(getTodayShamsi());
  const [loanAmount, setLoanAmount] = useState<number>(100000000);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerFatherName, setBorrowerFatherName] = useState('');
  const [notes, setNotes] = useState('');
  const [isBanksModalOpen, setIsBanksModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const agentBanks = StorageManager.getAgentBanks();

  // Filter personnel based on search: name, family, personnel code, national code, or certificate number
  const filteredPersonnel = personnelList.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = cleanPersian(searchTerm.toLowerCase());

    // Also check if any certificate number matches
    const hasMatchingCert = certificates.some(
      (c) =>
        c.personnelId === p.id &&
        (cleanPersian(c.certificateNo || '').includes(term) ||
          c.trackingCode.toLowerCase().includes(term))
    );

    return (
      cleanPersian(p.fullName).toLowerCase().includes(term) ||
      p.personnelCode.includes(term) ||
      p.nationalCode.includes(term) ||
      cleanPersian(p.department).toLowerCase().includes(term) ||
      hasMatchingCert
    );
  });

  const handleStartInquiry = (p: Personnel) => {
    setSelectedPersonnel(p);
    // Find the latest active certificate for this person if any
    const personCerts = certificates.filter(
      (c) => c.personnelId === p.id && (c.status === 'issued' || c.status === 'approved')
    );
    const base = personCerts[0] || null;
    setSelectedBaseCert(base);

    if (base) {
      setBankName(base.bankName);
      setBranchName(base.branchName || 'شعبه مرکزی');
      setLoanAmount(base.loanAmount);
      setBorrowerName(base.borrowerName || p.fullName);
      setBorrowerFatherName(base.borrowerFatherName || p.fatherName);
    } else {
      setBankName(agentBanks[0]?.name || 'بانک ملی ایران');
      setBranchName('شعبه مرکزی');
      setBorrowerName(p.fullName);
      setBorrowerFatherName(p.fatherName);
    }

    setBankLetterNumber('');
    setBankLetterDate(getTodayShamsi());
    setNotes('');
    setFormError('');
  };

  const handleIssueInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonnel) return;

    if (!bankName.trim()) {
      setFormError('لطفاً نام بانک استعلام‌کننده را وارد فرمایید.');
      return;
    }

    if (!bankLetterNumber.trim()) {
      setFormError('لطفاً شماره نامه استعلام بانک را وارد فرمایید.');
      return;
    }

    if (!bankLetterDate.trim()) {
      setFormError('لطفاً تاریخ نامه استعلام بانک را وارد فرمایید.');
      return;
    }

    if (!loanAmount || loanAmount < 10000) {
      setFormError('مبلغ تسهیلات موضوع استعلام باید حداقل ۱۰,۰۰۰ ریال یا بیشتر باشد.');
      return;
    }

    const res = StorageManager.issueCertificate({
      personnelId: selectedPersonnel.id,
      type: inquiryType,
      bankName: cleanPersian(bankName),
      branchName: cleanPersian(branchName),
      loanAmount,
      borrowerType: borrowerName.trim() === selectedPersonnel.fullName ? 'self' : 'other',
      borrowerName: cleanPersian(borrowerName) || selectedPersonnel.fullName,
      borrowerFatherName: cleanPersian(borrowerFatherName) || selectedPersonnel.fatherName,
      borrowerRelation: borrowerName.trim() === selectedPersonnel.fullName ? 'خود پرسنل' : 'متقاضی وام',
      bankLetterNumber: cleanPersian(bankLetterNumber),
      bankLetterDate: cleanPersian(bankLetterDate),
      operatorName: currentUser.fullName,
      notes: cleanPersian(notes) || 'صدور پاسخ به استعلام بانکی',
    });

    if (!res.success) {
      setFormError(res.message);
      return;
    }

    onRefresh();
    if (res.certificate) {
      onViewCertificate(res.certificate);
    }
    setSelectedPersonnel(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              کارتابل تخصصی استعلام بانکی (اپراتور)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              ویژه اپراتور
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            جستجوی پرسنل بر اساس مشخصات یا شماره گواهی قبلی، تکمیل فرم استعلام و چاپ رسمی دو تکه افقی A4
          </p>
        </div>

        <button
          onClick={() => setIsBanksModalOpen(true)}
          className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>مدیریت بانک‌های عامل</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="جستجو با نام، نام خانوادگی، شماره پرسنلی، شماره ملی یا شماره گواهی..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Personnel List for Inquiry */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 pr-4">کد پرسنلی</th>
                <th className="py-3.5">نام و نام خانوادگی</th>
                <th className="py-3.5">کد ملی</th>
                <th className="py-3.5">محل خدمت</th>
                <th className="py-3.5">نوع استخدام</th>
                <th className="py-3.5">گواهی‌های فعال قبلی</th>
                <th className="py-3.5 pl-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPersonnel.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    پرسنلی با این مشخصات یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredPersonnel.map((p) => {
                  const personCerts = certificates.filter((c) => c.personnelId === p.id);
                  const activeCount = personCerts.filter(
                    (c) => c.status === 'issued' || c.status === 'approved'
                  ).length;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 pr-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {toPersianDigits(p.personnelCode)}
                      </td>
                      <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">
                        {p.fullName}
                        <span className="text-[11px] font-normal text-slate-400 mr-2">فرزند: {p.fatherName}</span>
                      </td>
                      <td className="py-3.5 font-mono text-slate-600 dark:text-slate-300">
                        {toPersianDigits(p.nationalCode)}
                      </td>
                      <td className="py-3.5 text-slate-600 dark:text-slate-300">{p.department}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {p.employmentType}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-600 dark:text-slate-300">
                        {activeCount > 0 ? (
                          <span className="text-emerald-600 font-bold">
                            {toPersianDigits(activeCount)} فقره گواهی در گردش
                          </span>
                        ) : (
                          <span className="text-slate-400">فاقد گواهی قبلی</span>
                        )}
                      </td>
                      <td className="py-3.5 pl-4 text-left">
                        <button
                          onClick={() => handleStartInquiry(p)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          <span>صدور استعلام بانک</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiry Issuance Modal Form */}
      {selectedPersonnel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  فرم رسمی پاسخ به استعلام بانکی
                </h3>
              </div>
              <button
                onClick={() => setSelectedPersonnel(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Personnel Badge */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100">{selectedPersonnel.fullName}</span>
                <span className="text-slate-500 mr-2">فرزند: {selectedPersonnel.fatherName}</span>
                <span className="text-slate-500 mr-2">کد پرسنلی: {toPersianDigits(selectedPersonnel.personnelCode)}</span>
              </div>
              <span className="text-blue-700 dark:text-blue-300 font-bold">{selectedPersonnel.employmentType}</span>
            </div>

            <form onSubmit={handleIssueInquiry} noValidate className="space-y-4 text-xs">
              {/* Template Choice */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
                  قالب استعلام چاپی:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      inquiryType === 'inquiry_twopiece'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="inquiryType"
                      checked={inquiryType === 'inquiry_twopiece'}
                      onChange={() => setInquiryType('inquiry_twopiece')}
                      className="text-blue-600"
                    />
                    <span>دو تکه افقی A4 (پیش‌فرض اداری)</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      inquiryType === 'inquiry'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="inquiryType"
                      checked={inquiryType === 'inquiry'}
                      onChange={() => setInquiryType('inquiry')}
                      className="text-blue-600"
                    />
                    <span>تک‌برگ عمودی استاندارد</span>
                  </label>
                </div>
              </div>

              {/* Bank letter info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    شماره نامه استعلام بانک <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: ۹۸۴/ص/۱۲"
                    value={bankLetterNumber}
                    onChange={(e) => setBankLetterNumber(cleanPersian(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    تاریخ نامه استعلام بانک <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="۱۴۰۳/۰۸/۱۵"
                    value={bankLetterDate}
                    onChange={(e) => setBankLetterDate(cleanPersian(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              {/* Bank Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    نام بانک استعلام‌کننده <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="نام بانک"
                    value={bankName}
                    onChange={(e) => setBankName(cleanPersian(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">نام شعبه</label>
                  <input
                    type="text"
                    placeholder="شعبه مرکزی"
                    value={branchName}
                    onChange={(e) => setBranchName(cleanPersian(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
                  />
                </div>
              </div>

              {/* Loan Amount and Borrower */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    مبلغ تسهیلات موضوع استعلام (ریال)
                  </label>
                  <input
                    type="number"
                    step="10000000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    نام وام‌گیرنده اصلی
                  </label>
                  <input
                    type="text"
                    placeholder="نام وام‌گیرنده"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(cleanPersian(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPersonnel(null)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>ثبت و مشاهده پیش‌نمایش چاپ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agent Banks Modal */}
      <AgentBanksModal
        isOpen={isBanksModalOpen}
        onClose={() => setIsBanksModalOpen(false)}
      />
    </div>
  );
};
