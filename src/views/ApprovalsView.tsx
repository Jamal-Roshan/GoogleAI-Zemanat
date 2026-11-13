import React, { useState } from 'react';
import { Certificate, Personnel, SystemSettings, SystemUser } from '../types';
import { formatCurrency, formatNumber, toPersianDigits, cleanPersian } from '../utils/persianUtils';
import { StorageManager } from '../utils/storage';
import { exportCertificatesExcel } from '../utils/excelUtils';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Printer,
  AlertTriangle,
  Clock,
  Filter,
  CheckSquare,
  Square,
  Eye,
  X,
  FileSpreadsheet,
  Calendar,
  UserCheck,
  Search,
} from 'lucide-react';

interface ApprovalsViewProps {
  certificates: Certificate[];
  personnelList: Personnel[];
  settings: SystemSettings;
  currentUser: SystemUser;
  onRefresh: () => void;
  onViewCertificate: (cert: Certificate) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  certificates,
  personnelList,
  settings,
  currentUser,
  onRefresh,
  onViewCertificate,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectModalCert, setRejectModalCert] = useState<Certificate | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [filterSurplusOnly, setFilterSurplusOnly] = useState<boolean>(false);

  // History Filter states
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [approverFilter, setApproverFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  const isAdmin =
    currentUser.role === 'admin' ||
    (currentUser.roles && currentUser.roles.includes('admin'));

  const personnelMap = new Map<string, Personnel>();
  personnelList.forEach((p) => personnelMap.set(p.id, p));

  // Pending certificates
  const pendingCerts = certificates.filter((c) => {
    if (c.status !== 'pending') return false;
    if (filterSurplusOnly) return c.isSurplus;
    return true;
  });

  // Approved certificates history
  const approvedHistoryCerts = certificates.filter((c) => {
    if (c.status !== 'approved' && c.status !== 'issued' && c.status !== 'settled') return false;

    // Approvers can view what they approved (or admin sees all)
    if (!isAdmin && c.approverName && !c.approverName.includes(currentUser.fullName)) {
      return false;
    }

    if (approverFilter !== 'all' && c.approverName !== approverFilter) {
      return false;
    }

    if (dateFilter && c.approvedAt && !c.approvedAt.includes(dateFilter)) {
      return false;
    }

    if (historySearchTerm.trim()) {
      const term = cleanPersian(historySearchTerm.toLowerCase());
      const p = personnelMap.get(c.personnelId);
      const matches =
        cleanPersian(p?.fullName || '').includes(term) ||
        (p?.personnelCode || '').includes(term) ||
        c.trackingCode.toLowerCase().includes(term) ||
        cleanPersian(c.bankName).includes(term);
      if (!matches) return false;
    }

    return true;
  });

  // Unique list of approvers for admin filter
  const approverNames = Array.from(
    new Set(certificates.map((c) => c.approverName).filter(Boolean))
  ) as string[];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingCerts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingCerts.map((c) => c.id));
    }
  };

  // Single Approve
  const handleApproveSingle = (cert: Certificate) => {
    const res = StorageManager.approveCertificate(cert.id, currentUser.fullName);
    if (res.success) {
      onRefresh();
    }
  };

  // Batch Approve
  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      StorageManager.approveCertificate(id, currentUser.fullName);
    });
    setSelectedIds([]);
    onRefresh();
  };

  // Reject Submit
  const handleConfirmReject = () => {
    if (!rejectModalCert) return;
    StorageManager.rejectCertificate(rejectModalCert.id, rejectionReason);
    setRejectModalCert(null);
    setRejectionReason('');
    setSelectedIds((prev) => prev.filter((x) => x !== rejectModalCert.id));
    onRefresh();
  };

  const handleExportApprovedExcel = () => {
    exportCertificatesExcel(approvedHistoryCerts, personnelMap, settings);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              کارتابل بررسی و سوابق تأیید گواهی‌ها
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
              {toPersianDigits(pendingCerts.length)} درخواست در انتظار
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            بررسی پرونده‌های تسهیلات، اعتبارسنجی اسناد مازاد و گزارش‌گیری اختصاصی از گواهی‌های تأییدشده
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>در انتظار تأیید ({toPersianDigits(pendingCerts.length)})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>سوابق تأییدشده ({toPersianDigits(approvedHistoryCerts.length)})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PENDING CARTEABLE */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={filterSurplusOnly}
                onChange={(e) => setFilterSurplusOnly(e.target.checked)}
                className="text-amber-600 rounded"
              />
              <span>فقط گواهی‌های مازاد بر سقف</span>
            </label>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBatchApprove}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>تأیید گروهی ({toPersianDigits(selectedIds.length)} مورد)</span>
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            {pendingCerts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">کارتابل در انتظار خالی است</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  در حال حاضر هیچ درخواست تأیید نشده‌ای وجود ندارد. تمام گواهی‌ها بررسی و تعیین وضعیت شده‌اند.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-3.5 pr-4 w-10">
                        <button
                          onClick={toggleSelectAll}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {selectedIds.length === pendingCerts.length && pendingCerts.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3.5">کد رهگیری</th>
                      <th className="py-3.5">نام متقاضی / ضامن</th>
                      <th className="py-3.5">نوع سند</th>
                      <th className="py-3.5">بانک و شعبه</th>
                      <th className="py-3.5">مبلغ وام / تعهد</th>
                      <th className="py-3.5">وام‌گیرنده</th>
                      <th className="py-3.5">تحلیل سقف اعتباری</th>
                      <th className="py-3.5">تاریخ ثبت</th>
                      <th className="py-3.5 pl-4 text-left">عملیات تصمیم‌گیری</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendingCerts.map((cert) => {
                      const p = personnelList.find((x) => x.id === cert.personnelId);
                      const credit = p ? StorageManager.getPersonnelCreditSummary(p.id) : null;
                      const isSelected = selectedIds.includes(cert.id);

                      return (
                        <tr
                          key={cert.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                            isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <td className="py-4 pr-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(cert.id)}
                              className="rounded text-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {toPersianDigits(cert.trackingCode)}
                          </td>
                          <td className="py-4 font-bold text-slate-900 dark:text-slate-100">
                            <div>{p?.fullName || 'نامشخص'}</div>
                            <div className="text-[11px] font-normal text-slate-400">
                              {p?.employmentType} - کدملی: {toPersianDigits(p?.nationalCode)}
                            </div>
                          </td>
                          <td className="py-4 text-slate-700 dark:text-slate-300">
                            <span className="font-semibold block">
                              {cert.type === 'salary_deduction'
                                ? 'کسر از حقوق'
                                : cert.type === 'bank_guarantee'
                                ? 'ضمانت‌نامه'
                                : 'استعلام'}
                            </span>
                            {cert.isSurplus && (
                              <span className="inline-block mt-0.5 px-2 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold border border-amber-300">
                                مازاد بر سقف مجاز
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-slate-700 dark:text-slate-300">
                            <div className="font-semibold">{cert.bankName}</div>
                            <div className="text-[10px] text-slate-400">{cert.branchName}</div>
                          </td>
                          <td className="py-4 font-black text-slate-900 dark:text-slate-100">
                            {formatCurrency(cert.loanAmount, settings.currency)}
                          </td>
                          <td className="py-4 text-slate-600 dark:text-slate-300">
                            {cert.borrowerType === 'self' ? (
                              <span className="font-bold text-blue-700 dark:text-blue-400">خود پرسنل</span>
                            ) : (
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{cert.borrowerName}</span>
                                <span className="block text-[10px] text-slate-400">
                                  نسبت: {cert.borrowerRelation}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-4">
                            <div className="text-[11px] space-y-0.5">
                              <div>
                                سقف مجاز:{' '}
                                <span className="font-bold">
                                  {formatCurrency(credit?.allowedMonthlyLimit || 0, settings.currency)}
                                </span>
                              </div>
                              <div className="text-slate-400">
                                تعهد قبلی: {formatCurrency(credit?.totalActiveMonthlyCommitment || 0, settings.currency)}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 font-mono text-slate-500">
                            {toPersianDigits(cert.createdAt)}
                          </td>
                          <td className="py-4 pl-4 text-left">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveSingle(cert)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition shadow-xs flex items-center gap-1 cursor-pointer"
                                title="تأیید و شماره‌گذاری دبیرخانه"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>تأیید</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalCert(cert);
                                  setRejectionReason('');
                                }}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer"
                                title="رد درخواست"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>رد</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: APPROVED HISTORY & EXCEL EXPORT */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* History Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="جستجو با نام پرسنل، کد رهگیری..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap text-xs">
              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">تأییدکننده:</span>
                  <select
                    value={approverFilter}
                    onChange={(e) => setApproverFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold px-2 py-1.5 text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">همه تأییدکنندگان</option>
                    {approverNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">تاریخ تأیید:</span>
                <input
                  type="text"
                  placeholder="مثال: ۱۴۰۳/۰۸"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs px-2 py-1.5 font-mono text-slate-700 dark:text-slate-200 w-28"
                />
              </div>

              <button
                onClick={handleExportApprovedExcel}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold transition shadow-xs cursor-pointer ml-auto"
                title="تولید خروجی اکسل از موارد تأییدشده"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>خروجی اکسل سوابق</span>
              </button>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3.5 pr-4">کد رهگیری / دبیرخانه</th>
                    <th className="py-3.5">نام پرسنل</th>
                    <th className="py-3.5">نوع سند</th>
                    <th className="py-3.5">بانک عامل</th>
                    <th className="py-3.5">مبلغ وام</th>
                    <th className="py-3.5">نام تأییدکننده</th>
                    <th className="py-3.5">تاریخ تأیید</th>
                    <th className="py-3.5">وضعیت</th>
                    <th className="py-3.5 pl-4 text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {approvedHistoryCerts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        سابقه‌ای مطابق با فیلترها یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    approvedHistoryCerts.map((cert) => {
                      const p = personnelMap.get(cert.personnelId);
                      const isSettled = cert.status === 'settled';

                      return (
                        <tr key={cert.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                          <td className="py-3.5 pr-4">
                            <span className="font-mono font-bold block">{toPersianDigits(cert.trackingCode)}</span>
                            <span className="text-[11px] font-mono text-blue-700 font-bold">
                              {cert.certificateNo || 'در نوبت'}
                            </span>
                          </td>
                          <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">
                            {p?.fullName || 'نامشخص'}
                          </td>
                          <td className="py-3.5 text-slate-700 dark:text-slate-300">
                            {cert.type === 'salary_deduction'
                              ? 'کسر از حقوق'
                              : cert.type === 'bank_guarantee'
                              ? 'ضمانت‌نامه'
                              : 'استعلام'}
                          </td>
                          <td className="py-3.5 text-slate-700 dark:text-slate-300">{cert.bankName}</td>
                          <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(cert.loanAmount, settings.currency)}
                          </td>
                          <td className="py-3.5 font-bold text-purple-700 dark:text-purple-300">
                            {cert.approverName || '-'}
                          </td>
                          <td className="py-3.5 font-mono text-slate-600 dark:text-slate-400">
                            {toPersianDigits(cert.approvedAt || cert.createdAt)}
                          </td>
                          <td className="py-3.5">
                            {isSettled ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                تسویه شده
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                معتبر
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 pl-4 text-left">
                            {!isSettled && (
                              <button
                                onClick={() => onViewCertificate(cert)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer"
                              >
                                مشاهده / چاپ
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                رد درخواست گواهی: {rejectModalCert.trackingCode}
              </h3>
              <button
                onClick={() => setRejectModalCert(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                شما در حال رد درخواست گواهی با مبلغ{' '}
                <strong className="text-slate-900 dark:text-slate-100 font-bold">
                  {formatCurrency(rejectModalCert.loanAmount, settings.currency)}
                </strong>{' '}
                می‌باشید.
              </p>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  دلیل رد درخواست:
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(cleanPersian(e.target.value))}
                  placeholder="علت رد درخواست را وارد نمایید..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setRejectModalCert(null)}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmReject}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
              >
                تأیید رد درخواست
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
