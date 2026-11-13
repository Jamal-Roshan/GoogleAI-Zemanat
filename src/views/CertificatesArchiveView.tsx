import React, { useState } from 'react';
import {
  Certificate,
  CertificateStatus,
  CertificateType,
  Personnel,
  SystemSettings,
  SystemUser,
} from '../types';
import {
  formatCurrency,
  toPersianDigits,
  cleanPersian,
} from '../utils/persianUtils';
import { StorageManager } from '../utils/storage';
import { exportCertificatesExcel } from '../utils/excelUtils';
import { ReportPrintModal } from '../components/ReportPrintModal';
import {
  Archive,
  Search,
  Filter,
  Download,
  Printer,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CheckCheck,
  Ban,
  X,
} from 'lucide-react';

interface CertificatesArchiveViewProps {
  certificates: Certificate[];
  personnelList: Personnel[];
  settings: SystemSettings;
  currentUser: SystemUser;
  onRefresh: () => void;
  onViewCertificate: (cert: Certificate) => void;
}

export const CertificatesArchiveView: React.FC<CertificatesArchiveViewProps> = ({
  certificates,
  personnelList,
  settings,
  currentUser,
  onRefresh,
  onViewCertificate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [surplusFilter, setSurplusFilter] = useState<string>('all');
  const [showReportPrintModal, setShowReportPrintModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // In-App Confirmation Modal States (eliminates dependency on window.confirm/alert)
  const [settleModalCert, setSettleModalCert] = useState<Certificate | null>(null);
  const [cancelModalCert, setCancelModalCert] = useState<Certificate | null>(null);
  const [deleteModalCert, setDeleteModalCert] = useState<Certificate | null>(null);

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const userRoles = currentUser.roles || [currentUser.role];
  const isAdmin = userRoles.includes('admin');
  const isOperator = userRoles.includes('operator');
  const canOperate = isAdmin || isOperator;

  const personnelMap = new Map<string, Personnel>();
  personnelList.forEach((p) => personnelMap.set(p.id, p));

  const filtered = certificates.filter((cert) => {
    const p = personnelMap.get(cert.personnelId);
    const cleanedSearch = cleanPersian(searchTerm.toLowerCase());

    const matchesSearch =
      cleanPersian(p?.fullName || '').toLowerCase().includes(cleanedSearch) ||
      (p?.personnelCode || '').includes(cleanedSearch) ||
      (p?.nationalCode || '').includes(cleanedSearch) ||
      cert.trackingCode.toLowerCase().includes(cleanedSearch) ||
      cleanPersian(cert.certificateNo || '').toLowerCase().includes(cleanedSearch) ||
      cleanPersian(cert.bankName).toLowerCase().includes(cleanedSearch);

    const matchesType = typeFilter === 'all' || cert.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
    const matchesSurplus =
      surplusFilter === 'all' ||
      (surplusFilter === 'surplus' && cert.isSurplus) ||
      (surplusFilter === 'regular' && !cert.isSurplus);

    return matchesSearch && matchesType && matchesStatus && matchesSurplus;
  });

  // Pagination calculation
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = filtered.slice(
    (validCurrentPage - 1) * pageSize,
    validCurrentPage * pageSize
  );

  // Execute Settle
  const handleConfirmSettle = () => {
    if (!settleModalCert) return;
    const res = StorageManager.settleCertificate(
      settleModalCert.id,
      'settled',
      currentUser.fullName
    );
    setSettleModalCert(null);
    setActionMessage({ text: res.message, type: 'success' });
    onRefresh();
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Execute Cancel
  const handleConfirmCancel = () => {
    if (!cancelModalCert) return;
    const res = StorageManager.settleCertificate(
      cancelModalCert.id,
      'cancelled',
      currentUser.fullName
    );
    setCancelModalCert(null);
    setActionMessage({ text: res.message, type: 'success' });
    onRefresh();
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Execute Delete (Admin only)
  const handleConfirmDelete = () => {
    if (!deleteModalCert) return;
    const res = StorageManager.deleteCertificate(deleteModalCert.id, currentUser);
    setDeleteModalCert(null);
    if (res.success) {
      setActionMessage({ text: res.message, type: 'success' });
      onRefresh();
      setTimeout(() => setActionMessage(null), 4000);
    } else {
      setActionMessage({ text: res.message, type: 'error' });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleExportExcel = () => {
    exportCertificatesExcel(filtered, personnelMap, settings);
  };

  const getStatusBadge = (status: CertificateStatus) => {
    switch (status) {
      case 'issued':
      case 'approved':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
            صادر شده (معتبر)
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
            در انتظار تأیید
          </span>
        );
      case 'settled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300">
            تسویه شده
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            باطل شده
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
            رد شده
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              بایگانی و مدیریت اسناد، گواهی‌ها و ضمانت‌نامه‌ها
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              {toPersianDigits(filtered.length)} سند
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تسویه پرونده‌ها، آزادسازی سقف ضمانت، چاپ رسمی گزارش و خروجی اکسل استاندارد
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Print Report Button */}
          <button
            onClick={() => setShowReportPrintModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            title="چاپ رسمی گزارش فیلترشده در قطع اداری"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ گزارش (Print / PDF)</span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>خروجی استاندارد اکسل (RTL)</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter, Search, and Page Size Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="جستجو با نام پرسنل، کد رهگیری، شماره دبیرخانه..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <span>نوع:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold px-2 py-1.5 text-slate-700 dark:text-slate-200"
            >
              <option value="all">همه انواع</option>
              <option value="salary_deduction">کسر از حقوق</option>
              <option value="bank_guarantee">ضمانت‌نامه</option>
              <option value="inquiry_twopiece">استعلام (دو تکه)</option>
              <option value="inquiry">استعلام استاندارد</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>وضعیت:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold px-2 py-1.5 text-slate-700 dark:text-slate-200"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="issued">صادر شده (معتبر)</option>
              <option value="pending">در انتظار تأیید</option>
              <option value="settled">تسویه شده</option>
              <option value="cancelled">باطل شده</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>تعداد در صفحه:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold px-2 py-1.5 text-slate-700 dark:text-slate-200"
            >
              <option value={50}>۵۰ سطر</option>
              <option value={100}>۱۰۰ سطر</option>
              <option value={200}>۲۰۰ سطر</option>
              <option value={500}>۵۰۰ سطر</option>
            </select>
          </div>
        </div>
      </div>

      {/* Certificates Archive Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 pr-4">کد رهگیری / دبیرخانه</th>
                <th className="py-3.5">نام پرسنل</th>
                <th className="py-3.5">نوع سند</th>
                <th className="py-3.5">بانک عامل</th>
                <th className="py-3.5">مبلغ وام / تعهد</th>
                <th className="py-3.5">وام‌گیرنده</th>
                <th className="py-3.5">صادرکننده</th>
                <th className="py-3.5">وضعیت</th>
                <th className="py-3.5">تاریخ صدور / تسویه</th>
                <th className="py-3.5 pl-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    هیچ سندی با فیلترهای انتخابی یافت نشد.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((cert) => {
                  const p = personnelMap.get(cert.personnelId);
                  const isSettled = cert.status === 'settled';
                  const isCancelled = cert.status === 'cancelled';
                  const canReprint = !isSettled && !isCancelled;
                  const canSettleOrCancel = !isSettled && !isCancelled;

                  return (
                    <tr
                      key={cert.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="py-4 pr-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {toPersianDigits(cert.trackingCode)}
                        </div>
                        <div className="text-[11px] font-mono text-blue-700 dark:text-blue-400 font-bold">
                          {cert.certificateNo || 'در نوبت شماره‌گذاری'}
                        </div>
                      </td>
                      <td className="py-4 font-bold text-slate-900 dark:text-slate-100">
                        <div>{p?.fullName || 'ناشناس'}</div>
                        <div className="text-[11px] font-normal text-slate-400">
                          کد پرسنلی: {toPersianDigits(p?.personnelCode)}
                        </div>
                      </td>
                      <td className="py-4 text-slate-700 dark:text-slate-300">
                        <span className="font-semibold block">
                          {cert.type === 'salary_deduction'
                            ? 'کسر از حقوق'
                            : cert.type === 'bank_guarantee'
                            ? 'ضمانت‌نامه'
                            : 'استعلام بانکی'}
                        </span>
                        {cert.isSurplus && (
                          <span className="inline-block mt-0.5 px-2 py-0.2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded text-[9px] font-bold border border-amber-300 dark:border-amber-700">
                            مازاد
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
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {cert.borrowerName}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              نسبت: {cert.borrowerRelation}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-slate-600 dark:text-slate-300 text-[11px]">
                        <div>{cert.operatorName}</div>
                        {cert.approverName && (
                          <div className="text-[10px] text-slate-400">تأیید: {cert.approverName}</div>
                        )}
                      </td>
                      <td className="py-4">{getStatusBadge(cert.status)}</td>
                      <td className="py-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        <div>صدور: {toPersianDigits(cert.approvedAt || cert.createdAt)}</div>
                        {cert.settledAt && (
                          <div className="text-purple-600 dark:text-purple-400 font-semibold">
                            تسویه: {toPersianDigits(cert.settledAt)}
                            {cert.settledBy && (
                              <span className="block text-[9px] text-slate-400">
                                توسط: {cert.settledBy}
                              </span>
                            )}
                          </div>
                        )}
                        {cert.cancelledAt && (
                          <div className="text-slate-500 font-semibold">
                            ابطال: {toPersianDigits(cert.cancelledAt)}
                            {cert.cancelledBy && (
                              <span className="block text-[9px] text-slate-400">
                                توسط: {cert.cancelledBy}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 pl-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reprint only available for active / valid certs */}
                          {canReprint ? (
                            <button
                              onClick={() => onViewCertificate(cert)}
                              className="bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                              title="چاپ نامه رسمی"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>چاپ</span>
                            </button>
                          ) : (
                            <span
                              className="text-slate-400 text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded"
                              title="امکان چاپ مجدد برای گواهی تسویه یا باطل شده وجود ندارد"
                            >
                              چاپ مسدود
                            </span>
                          )}

                          {/* Settle and Cancel buttons: available for Operators and Admins */}
                          {canSettleOrCancel && canOperate && (
                            <>
                              <button
                                onClick={() => setSettleModalCert(cert)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition shadow-2xs cursor-pointer flex items-center gap-1"
                                title="تسویه حساب بانکی و آزادسازی فوری سقف ضمانت"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>تسویه</span>
                              </button>
                              <button
                                onClick={() => setCancelModalCert(cert)}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                title="ابطال سند"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Admin Only Delete button for settled or cancelled certificates */}
                          {isAdmin && (isSettled || isCancelled || cert.status === 'rejected') && (
                            <button
                              onClick={() => setDeleteModalCert(cert)}
                              className="text-slate-400 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="حذف کامل رکورد (دسترسی ویژه مدیر)"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div>
            نمایش ردیف‌های{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {toPersianDigits(totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1)}
            </strong>{' '}
            تا{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {toPersianDigits(Math.min(validCurrentPage * pageSize, totalItems))}
            </strong>{' '}
            از کل{' '}
            <strong className="text-slate-800 dark:text-slate-200">{toPersianDigits(totalItems)}</strong> سند
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold">
              صفحه {toPersianDigits(validCurrentPage)} از {toPersianDigits(totalPages)}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Settle Confirmation Modal */}
      {settleModalCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-base">
                <CheckCheck className="w-5 h-5" />
                <span>تأیید رسمی تسویه گواهی و ضمانت‌نامه</span>
              </div>
              <button
                onClick={() => setSettleModalCert(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <p className="leading-relaxed">
                آیا از ثبت قطعی تسویه این سند اطمینان دارید؟ با اعمال تسویه، مبالغ این گواهی از سرجمع تعهدات کسر شده و سقف ضمانت کارمند فوراً آزاد خواهد شد:
              </p>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">کد رهگیری سند:</span>
                  <strong className="font-mono text-purple-900 dark:text-purple-300">
                    {toPersianDigits(settleModalCert.trackingCode)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">بانک و شعبه:</span>
                  <span className="font-bold">{settleModalCert.bankName} - {settleModalCert.branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">مبلغ کل تسهیلات:</span>
                  <strong className="font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(settleModalCert.loanAmount, settings.currency)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ثبت‌کننده تسویه:</span>
                  <span className="font-bold">{currentUser.fullName}</span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200 text-[11px]">
                توجه: طبق مقررات اداری، پس از تسویه امکان چاپ مجدد این برگه مسدود می‌شود.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSettleModalCert(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmSettle}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                تأیید و اعمال تسویه
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <Ban className="w-5 h-5" />
                <span>تأیید ابطال سند و گواهی</span>
              </div>
              <button
                onClick={() => setCancelModalCert(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <p className="leading-relaxed">
                آیا از ابطال گواهی با کد رهگیری <strong className="font-mono text-slate-900 dark:text-white">{toPersianDigits(cancelModalCert.trackingCode)}</strong> اطمینان دارید؟ با ابطال این سند، از چرخه اعتباری خارج خواهد شد:
              </p>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">شماره دبیرخانه:</span>
                  <span className="font-mono font-bold">{toPersianDigits(cancelModalCert.certificateNo || 'ندارد')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">مبلغ سند:</span>
                  <strong className="font-bold">{formatCurrency(cancelModalCert.loanAmount, settings.currency)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">اپراتور باطل‌کننده:</span>
                  <span className="font-bold">{currentUser.fullName}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalCert(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                تأیید و ابطال گواهی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Admin Only) */}
      {deleteModalCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
              <Trash2 className="w-5 h-5" />
              <span>حذف دائم رکورد از پایگاه داده</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              هشدار: آیا از حذف کامل گواهی با کد رهگیری <strong className="font-mono text-slate-900 dark:text-white">{toPersianDigits(deleteModalCert.trackingCode)}</strong> از سیستم اطمینان دارید؟ این عملیات غیرقابل بازگشت است.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalCert(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                حذف قطعی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Report Print Modal */}
      {showReportPrintModal && (
        <ReportPrintModal
          certificates={filtered}
          personnelMap={personnelMap}
          settings={settings}
          currentUser={currentUser}
          filtersSummary={{
            type: typeFilter,
            status: statusFilter,
            surplus: surplusFilter,
            search: searchTerm,
          }}
          onClose={() => setShowReportPrintModal(false)}
        />
      )}
    </div>
  );
};
