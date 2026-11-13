import React, { useState } from 'react';
import { Certificate, Personnel, SystemSettings, SystemUser } from '../types';
import { StorageManager } from '../utils/storage';
import { cleanPersian, formatCurrency, formatNumber, toPersianDigits } from '../utils/persianUtils';
import {
  UserCheck,
  CreditCard,
  FileText,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Clock,
  Printer,
  ShieldAlert,
  Coins,
  History,
  Building,
} from 'lucide-react';

interface EmployeePortalViewProps {
  currentUser: SystemUser;
  personnelList: Personnel[];
  certificates: Certificate[];
  settings: SystemSettings;
  onRefresh: () => void;
  onViewCertificate: (cert: Certificate) => void;
  onNavigateToIssue: () => void;
}

export const EmployeePortalView: React.FC<EmployeePortalViewProps> = ({
  currentUser,
  personnelList,
  certificates,
  settings,
  onRefresh,
  onViewCertificate,
  onNavigateToIssue,
}) => {
  // Find linked personnel record (by personnelCode or match by name/id)
  const myPersonnel =
    personnelList.find((p) => p.personnelCode === currentUser.personnelCode) ||
    personnelList[0]; // fallback for demo if admin checks portal

  const myCertificates = myPersonnel
    ? certificates.filter((c) => c.personnelId === myPersonnel.id)
    : [];

  const creditSummary = myPersonnel
    ? StorageManager.getPersonnelCreditSummary(myPersonnel.id)
    : null;

  return (
    <div className="space-y-6">
      {/* Profile & Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm shadow-blue-500/20 shrink-0">
              <UserCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-800">
                  {myPersonnel ? myPersonnel.fullName : currentUser.fullName}
                </h2>
                {myPersonnel?.isActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>شاغل و فعال (مجاز به دریافت تسهیلات)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>غیرفعال / مسدود</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
                <span>کد پرسنلی: <strong className="text-slate-800 font-mono">{toPersianDigits(myPersonnel?.personnelCode)}</strong></span>
                <span>•</span>
                <span>کد ملی: <strong className="text-slate-800 font-mono">{toPersianDigits(myPersonnel?.nationalCode)}</strong></span>
                <span>•</span>
                <span>نوع استخدام: <strong className="text-blue-700">{myPersonnel?.employmentType}</strong></span>
                <span>•</span>
                <span>واحد: <strong className="text-slate-800">{myPersonnel?.department}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Request Button */}
          {myPersonnel?.isActive && (
            <button
              onClick={onNavigateToIssue}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ثبت درخواست جدید گواهی یا ضمانت</span>
            </button>
          )}
        </div>

        {/* Block notification if blocked */}
        {myPersonnel && !myPersonnel.isActive && (
          <div className="mt-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>علت مسدودی پرونده پرسنلی (BlockTip):</span>
            </span>
            <p className="text-[11px] leading-relaxed pr-6">
              {myPersonnel.blockTip || 'دسترسی شما به دریافت گواهی‌های اداری مسدود است. لطفاً به امور اداری مراجعه فرمایید.'}
            </p>
          </div>
        )}
      </div>

      {/* Credit Summary Gauge Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">سقف مجاز تعهدات ماهانه</span>
            <Coins className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mb-1">
            {formatCurrency(creditSummary?.allowedMonthlyLimit || 0, settings.currency)}
          </div>
          <div className="text-[11px] text-slate-400">
            معادل {toPersianDigits(settings.netSalaryRatio * 100)}٪ از حقوق خالص دریافتی
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">مجموع تعهدات در گردش</span>
            <CreditCard className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-600 mb-1">
            {formatCurrency(creditSummary?.totalActiveMonthlyCommitment || 0, settings.currency)}
          </div>
          <div className="text-[11px] text-slate-400">
            از {toPersianDigits(creditSummary?.activeCount || 0)} فقره گواهی و ضمانت فعال
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">سقف قابل تعهد آزاد</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 mb-1">
            {formatCurrency(creditSummary?.remainingQuota || 0, settings.currency)}
          </div>
          <div className="text-[11px] text-slate-400">
            سقف آماده جهت صدور ضمانت جدید
          </div>
        </div>
      </div>

      {/* History of Certificates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-3 p-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              تاریخچه و سوابق گواهی‌ها و ضمانت‌نامه‌های من
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            مجموع {toPersianDigits(myCertificates.length)} فقره ثبت‌شده
          </span>
        </div>

        {myCertificates.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            تاکنون هیچ گواهی یا ضمانت‌نامه‌ای برای شما ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 pr-3">کد رهگیری</th>
                  <th className="py-3">شماره دبیرخانه</th>
                  <th className="py-3">نوع گواهی</th>
                  <th className="py-3">بانک تسهیلات‌دهنده</th>
                  <th className="py-3">مبلغ تعهد</th>
                  <th className="py-3">وام‌گیرنده</th>
                  <th className="py-3">وضعیت گواهی</th>
                  <th className="py-3">تاریخ صدور</th>
                  <th className="py-3 pl-3 text-left">مشاهده و چاپ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 pr-3 font-mono font-bold text-slate-800">
                      {toPersianDigits(cert.trackingCode)}
                    </td>
                    <td className="py-3 font-mono text-blue-700 font-bold">
                      {cert.certificateNo || 'در نوبت شماره‌گذاری'}
                    </td>
                    <td className="py-3 text-slate-700">
                      {cert.type === 'salary_deduction'
                        ? 'کسر از حقوق'
                        : cert.type === 'bank_guarantee'
                        ? 'ضمانت‌نامه'
                        : cert.type === 'inquiry_twopiece'
                        ? 'استعلام (دو تکه)'
                        : 'استعلام'}
                      {cert.isSurplus && (
                        <span className="mr-1.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                          مازاد
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-700">
                      {cert.bankName} - {cert.branchName}
                    </td>
                    <td className="py-3 font-bold text-slate-900">
                      {formatCurrency(cert.loanAmount, settings.currency)}
                    </td>
                    <td className="py-3 text-slate-600">
                      {cert.borrowerType === 'self' ? 'خودم' : cert.borrowerName}
                    </td>
                    <td className="py-3">
                      {cert.status === 'approved' || cert.status === 'issued' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          صادر شده (آماده چاپ)
                        </span>
                      ) : cert.status === 'pending' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          در انتظار تأیید
                        </span>
                      ) : cert.status === 'settled' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                          تسویه شده
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          رد شده
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-slate-500">
                      {toPersianDigits(cert.approvedAt || cert.createdAt)}
                    </td>
                    <td className="py-3 pl-3 text-left">
                      {(cert.status === 'approved' || cert.status === 'issued') ? (
                        <button
                          onClick={() => onViewCertificate(cert)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>چاپ سربرگ رسمی</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
