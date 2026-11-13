import React, { useState } from 'react';
import { EmploymentType, Personnel, SystemSettings, SystemUser, Certificate } from '../types';
import { formatCurrency, toPersianDigits, cleanPersian } from '../utils/persianUtils';
import { StorageManager } from '../utils/storage';
import { generatePersonnelSampleExcel, parsePersonnelExcel } from '../utils/excelUtils';
import {
  Users,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldAlert,
  UserCheck,
  UserX,
  CreditCard,
  FileText,
  X,
  FolderOpen,
  CheckCheck,
} from 'lucide-react';

interface PersonnelViewProps {
  personnelList: Personnel[];
  settings: SystemSettings;
  currentUser: SystemUser;
  onRefresh: () => void;
  onSelectPersonnelForCert?: (personnel: Personnel) => void;
}

export const PersonnelView: React.FC<PersonnelViewProps> = ({
  personnelList,
  settings,
  currentUser,
  onRefresh,
  onSelectPersonnelForCert,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Status Modal State
  const [selectedPersonnelForStatus, setSelectedPersonnelForStatus] = useState<Personnel | null>(null);
  const [targetActiveState, setTargetActiveState] = useState<boolean>(false);
  const [blockTipInput, setBlockTipInput] = useState<string>('');
  const [statusError, setStatusError] = useState<string>('');

  // Personnel Dossier / History Modal
  const [dossierPersonnel, setDossierPersonnel] = useState<Personnel | null>(null);
  const [settleConfirmCert, setSettleConfirmCert] = useState<Certificate | null>(null);
  const [cancelConfirmCert, setCancelConfirmCert] = useState<Certificate | null>(null);

  // Excel Modal State
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    updatedCount: number;
    insertedCount: number;
    skippedCount: number;
    errors: string[];
  } | null>(null);

  // Filtered list
  const filtered = personnelList.filter((p) => {
    const cleanedSearch = cleanPersian(searchTerm.toLowerCase());
    const matchesSearch =
      cleanPersian(p.fullName).toLowerCase().includes(cleanedSearch) ||
      p.nationalCode.includes(cleanedSearch) ||
      p.personnelCode.includes(cleanedSearch) ||
      cleanPersian(p.department).toLowerCase().includes(cleanedSearch);

    const matchesType = typeFilter === 'all' || p.employmentType === typeFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.isActive) ||
      (statusFilter === 'blocked' && !p.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Open Block / Unblock Modal
  const handleOpenStatusModal = (p: Personnel) => {
    setSelectedPersonnelForStatus(p);
    setTargetActiveState(!p.isActive);
    setBlockTipInput(p.blockTip || '');
    setStatusError('');
  };

  // Submit Status Change
  const handleSaveStatus = () => {
    if (!selectedPersonnelForStatus) return;

    if (!targetActiveState && !blockTipInput.trim()) {
      setStatusError('ذکر دلیل مسدودی در فیلد (BlockTip) الزامی است.');
      return;
    }

    const res = StorageManager.updatePersonnelStatus(
      selectedPersonnelForStatus.id,
      targetActiveState,
      blockTipInput
    );

    if (!res.success) {
      setStatusError(res.message);
      return;
    }

    setSelectedPersonnelForStatus(null);
    onRefresh();
  };

  // Direct settle from dossier modal
  const handleDirectSettle = (cert: Certificate) => {
    const res = StorageManager.settleCertificate(cert.id, 'settled', currentUser.fullName);
    if (res.success) {
      setSettleConfirmCert(null);
      onRefresh();
    }
  };

  // Direct cancel from dossier modal
  const handleDirectCancel = (cert: Certificate) => {
    const res = StorageManager.settleCertificate(cert.id, 'cancelled', currentUser.fullName);
    if (res.success) {
      setCancelConfirmCert(null);
      onRefresh();
    }
  };

  // Upload Excel File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadResult(null);

    const parseRes = await parsePersonnelExcel(file);
    if (!parseRes.success || !parseRes.data) {
      alert(parseRes.error || 'خطا در خواندن فایل اکسل');
      setUploadLoading(false);
      return;
    }

    const processRes = await StorageManager.processMonthlyPersonnelFeed(parseRes.data);
    setUploadLoading(false);
    setUploadResult(processRes);
    onRefresh();
  };

  const dossierCerts = dossierPersonnel
    ? StorageManager.getCertificates().filter((c) => c.personnelId === dossierPersonnel.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              بانک اطلاعات و مدیریت پرسنل
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              {toPersianDigits(filtered.length)} پرسنل
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مشاهده سقف اعتباری، بارگذاری تغذیه ماهانه از فایل اکسل و کنترل پرونده گواهی‌ها
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => generatePersonnelSampleExcel()}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            title="دانلود فایل اکسل نمونه جهت تطبیق ستون‌ها"
          >
            <Download className="w-3.5 h-3.5" />
            <span>دانلود قالب نمونه اکسل</span>
          </button>

          <button
            onClick={() => {
              setIsExcelModalOpen(true);
              setUploadResult(null);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>بارگذاری و تغذیه فایل ماهانه پرسنل</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="جستجو با نام، کدملی یا کد پرسنلی..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>نوع استخدام:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold px-2 py-1.5 text-slate-700 dark:text-slate-200"
            >
              <option value="all">همه انواع</option>
              <option value="رسمی">رسمی</option>
              <option value="پیمانی">پیمانی</option>
              <option value="آزمایشی">آزمایشی</option>
              <option value="بازنشسته">بازنشسته</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span>وضعیت:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold px-2 py-1.5 text-slate-700 dark:text-slate-200"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فقط فعال</option>
              <option value="blocked">غیرفعال / مسدود</option>
            </select>
          </div>
        </div>
      </div>

      {/* Personnel Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 pr-4">کد پرسنلی</th>
                <th className="py-3.5">نام و نام خانوادگی</th>
                <th className="py-3.5">کد ملی</th>
                <th className="py-3.5">واحد سازمانی / سمت</th>
                <th className="py-3.5">نوع استخدام</th>
                <th className="py-3.5">خالص دریافتی</th>
                <th className="py-3.5">سقف ضمانت و تعهدات</th>
                <th className="py-3.5">وضعیت</th>
                <th className="py-3.5 pl-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((p) => {
                const credit = StorageManager.getPersonnelCreditSummary(p.id);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-4 pr-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {toPersianDigits(p.personnelCode)}
                    </td>
                    <td className="py-4 font-bold text-slate-900 dark:text-slate-100">
                      <div>{cleanPersian(p.fullName)}</div>
                      <div className="text-[11px] font-normal text-slate-400">نام پدر: {p.fatherName}</div>
                    </td>
                    <td className="py-4 font-mono text-slate-600 dark:text-slate-400">
                      {toPersianDigits(p.nationalCode)}
                    </td>
                    <td className="py-4 text-slate-700 dark:text-slate-300">
                      <div className="font-medium">{p.department}</div>
                      <div className="text-[10px] text-slate-400">{p.jobTitle}</div>
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          p.employmentType === 'رسمی'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : p.employmentType === 'پیمانی'
                            ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                            : p.employmentType === 'آزمایشی'
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                        }`}
                      >
                        {p.employmentType}
                      </span>
                    </td>
                    <td className="py-4 font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(p.netSalary, settings.currency)}
                    </td>
                    <td className="py-4">
                      <div className="space-y-1 min-w-[130px]">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">سقف مجاز:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(credit?.allowedMonthlyLimit || 0, settings.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">تعهدات جاری:</span>
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            {formatCurrency(credit?.totalActiveMonthlyCommitment || 0, settings.currency)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              (credit?.remainingQuota || 0) > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{
                              width: `${
                                credit?.allowedMonthlyLimit
                                  ? Math.min(
                                      100,
                                      ((credit.totalActiveMonthlyCommitment || 0) /
                                        credit.allowedMonthlyLimit) *
                                        100
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      {p.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>فعال (مجاز)</span>
                        </span>
                      ) : (
                        <div className="group relative inline-block">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 cursor-help">
                            <UserX className="w-3.5 h-3.5" />
                            <span>مسدود / غیرفعال</span>
                          </span>
                          {p.blockTip && (
                            <div className="hidden group-hover:block absolute bottom-full mb-1 right-0 w-64 p-2 bg-slate-800 dark:bg-slate-700 text-white text-[11px] rounded-lg shadow-lg z-20 leading-relaxed font-normal">
                              <span className="font-bold text-amber-400 block mb-0.5">علت مسدودی:</span>
                              {p.blockTip}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 pl-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDossierPersonnel(p)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="مشاهده پرونده و گواهی‌های پرسنل"
                        >
                          <FolderOpen className="w-4 h-4 text-blue-600" />
                        </button>

                        {p.isActive && onSelectPersonnelForCert && (
                          <button
                            onClick={() => onSelectPersonnelForCert(p)}
                            className="bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer"
                          >
                            صدور گواهی
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenStatusModal(p)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            p.isActive
                              ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                          }`}
                          title={p.isActive ? 'مسدودسازی پرسنل' : 'فعال‌سازی پرسنل'}
                        >
                          {p.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Personnel Dossier & Settle Modal */}
      {dossierPersonnel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  پرونده و سوابق گواهی‌های: {dossierPersonnel.fullName} ({toPersianDigits(dossierPersonnel.personnelCode)})
                </h3>
              </div>
              <button
                onClick={() => setDossierPersonnel(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Credit summary overview */}
            {(() => {
              const cr = StorageManager.getPersonnelCreditSummary(dossierPersonnel.id);
              return (
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">خالص دریافتی ماهانه:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {formatCurrency(dossierPersonnel.netSalary, settings.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">سقف مجاز ماهانه:</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(cr?.allowedMonthlyLimit || 0, settings.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">مجموع تعهدات جاری:</span>
                    <span className="font-bold text-rose-600">
                      {formatCurrency(cr?.totalActiveMonthlyCommitment || 0, settings.currency)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Certificates table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                لیست گواهی‌ها و ضمانت‌نامه‌ها ({toPersianDigits(dossierCerts.length)} فقره):
              </h4>

              {dossierCerts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  هیچ گواهی یا ضمانت‌نامه‌ای برای این پرسنل ثبت نشده است.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-2.5 pr-3">کد رهگیری</th>
                        <th className="py-2.5">نوع</th>
                        <th className="py-2.5">بانک و شعبه</th>
                        <th className="py-2.5">مبلغ وام</th>
                        <th className="py-2.5">وضعیت</th>
                        <th className="py-2.5 pl-3 text-left">تسویه</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {dossierCerts.map((c) => {
                        const canSettle = c.status === 'issued' || c.status === 'approved';
                        return (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-2.5 pr-3 font-mono font-bold">{toPersianDigits(c.trackingCode)}</td>
                            <td className="py-2.5">
                              {c.type === 'salary_deduction' ? 'کسر از حقوق' : c.type === 'bank_guarantee' ? 'ضمانت‌نامه بانکی' : 'استعلام'}
                            </td>
                            <td className="py-2.5">{c.bankName}</td>
                            <td className="py-2.5 font-bold">{formatCurrency(c.loanAmount, settings.currency)}</td>
                            <td className="py-2.5">
                              {c.status === 'settled' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                  تسویه شده ({c.settledBy})
                                </span>
                              ) : c.status === 'cancelled' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700">
                                  باطل شده
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                                  جاری / معتبر
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pl-3 text-left">
                              {canSettle && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSettleConfirmCert(c)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold transition shadow-2xs cursor-pointer"
                                    title="تسویه سند"
                                  >
                                    تسویه
                                  </button>
                                  <button
                                    onClick={() => setCancelConfirmCert(c)}
                                    className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                    title="ابطال سند"
                                  >
                                    ابطال
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDossierPersonnel(null)}
                className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settle Confirmation Modal */}
      {settleConfirmCert && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-purple-700 dark:text-purple-400">
              <CheckCheck className="w-6 h-6" />
              <h3 className="font-bold text-base">تأیید تسویه رسمی گواهی</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا از تسویه گواهی با شماره رهگیری <strong className="font-mono text-slate-900 dark:text-white">{toPersianDigits(settleConfirmCert.trackingCode)}</strong> و خارج شدن آن از سقف تعهدات پرسنل اطمینان دارید؟
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
              توجه: طبق دستورالعمل اداری، پس از تسویه امکان چاپ مجدد این برگه وجود نخواهد داشت و به عنوان سند مختومه بایگانی می‌شود.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSettleConfirmCert(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                انصراف
              </button>
              <button
                onClick={() => handleDirectSettle(settleConfirmCert)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                تأیید و اعمال تسویه
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirmCert && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base">تأیید ابطال رسمی گواهی</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا از ابطال گواهی با شماره رهگیری <strong className="font-mono text-slate-900 dark:text-white">{toPersianDigits(cancelConfirmCert.trackingCode)}</strong> و خارج شدن آن از تعهدات پرسنل اطمینان دارید؟
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelConfirmCert(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                انصراف
              </button>
              <button
                onClick={() => handleDirectCancel(cancelConfirmCert)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                تأیید و ابطال گواهی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Excel Sync Modal */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  بارگذاری و تغذیه فایل ماهانه پرسنل (Excel Sync)
                </h3>
              </div>
              <button
                onClick={() => setIsExcelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5 text-xs text-blue-900 dark:text-blue-200 mb-4 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>قوانین پردازش و اعتبارسنجی سازمانی:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px] pr-2">
                <li>
                  پرسنلی که در فایل جدید وجود ندارند، با پیام سیستمی بازنشستگی مسدود می‌گردند.
                </li>
                <li>
                  صرفاً پرسنل با نوع استخدام <strong>«رسمی»، «پیمانی» یا «آزمایشی»</strong> فعال (isActive = ۱) شده و مجوز دریافت ضمانت‌نامه پیدا می‌کنند.
                </li>
                <li>
                  برای تمام پرسنل جدید یا بروزرسانی‌شده، حساب کاربری با نام کاربری و رمز اولیه «کد پرسنلی» ثبت می‌گردد (کلمه عبور کاربران فعلی دست‌نخورده باقی می‌ماند).
                </li>
              </ul>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-800/40 transition">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                فایل اکسل ماهانه پرسنل (.xlsx) را انتخاب یا اینجا رها کنید
              </p>
              <p className="text-[11px] text-slate-400 mb-4">
                شامل ستون‌های: کد پرسنلی، کد ملی، نام، نام پدر، نوع استخدام، خالص دریافتی
              </p>

              <label className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition shadow-sm">
                <span>انتخاب فایل اکسل</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  disabled={uploadLoading}
                  className="hidden"
                />
              </label>
            </div>

            {uploadLoading && (
              <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 font-bold animate-pulse">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>در حال قفل ثبت گواهی، اعتبارسنجی رکوردهای اکسل و تطبیق پرسنل...</span>
              </div>
            )}

            {uploadResult && (
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs space-y-2">
                <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>عملیات تغذیه ماهانه با موفقیت انجام شد:</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800">
                    <span className="text-[10px] text-slate-500 block">بروزرسانی شده</span>
                    <span className="font-black text-emerald-700 dark:text-emerald-400 text-base">
                      {toPersianDigits(uploadResult.updatedCount)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800">
                    <span className="text-[10px] text-slate-500 block">پرسنل جدید درج شده</span>
                    <span className="font-black text-blue-700 dark:text-blue-400 text-base">
                      {toPersianDigits(uploadResult.insertedCount)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800">
                    <span className="text-[10px] text-slate-500 block">غیرمجاز / بدون تغییر</span>
                    <span className="font-black text-amber-700 dark:text-amber-400 text-base">
                      {toPersianDigits(uploadResult.skippedCount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsExcelModalOpen(false)}
                className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personnel Status Edit Modal */}
      {selectedPersonnelForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                تغییر وضعیت فعالیت پرسنل: {selectedPersonnelForStatus.fullName}
              </h3>
              <button
                onClick={() => setSelectedPersonnelForStatus(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedPersonnelForStatus.employmentType === 'بازنشسته' && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  قانون سیستمی: پرسنل بازنشسته به صورت قطعی مسدود است و امکان صدور گواهی ندارد.
                </span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">وضعیت مورد نظر:</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="activeState"
                      checked={targetActiveState}
                      onChange={() => setTargetActiveState(true)}
                      disabled={selectedPersonnelForStatus.employmentType === 'بازنشسته'}
                      className="text-blue-600"
                    />
                    <span>فعال (مجاز به دریافت گواهی و ضمانت)</span>
                  </label>
                  <label className="flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="activeState"
                      checked={!targetActiveState}
                      onChange={() => setTargetActiveState(false)}
                      className="text-rose-600"
                    />
                    <span>مسدود / غیرفعال</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  دلیل وضعیت / توضیح مسدودی (BlockTip)
                  {!targetActiveState && <span className="text-rose-500 mr-1">* (الزامی)</span>}
                </label>
                <textarea
                  rows={3}
                  value={blockTipInput}
                  onChange={(e) => setBlockTipInput(e.target.value)}
                  placeholder="علت مسدودسازی دستی یا توضیحات مربوط به محدودیت اعتباری را وارد کنید..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              {statusError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-xs">
                  {statusError}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedPersonnelForStatus(null)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveStatus}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
              >
                ثبت و اعمال تغییرات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
