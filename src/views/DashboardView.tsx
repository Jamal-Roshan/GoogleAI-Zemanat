import React from 'react';
import { Certificate, Personnel, SystemSettings, SystemUser } from '../types';
import { formatCurrency, formatNumber, toPersianDigits } from '../utils/persianUtils';
import {
  FileText,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Coins,
  ArrowUpRight,
  PlusCircle,
  FileSpreadsheet,
  Building,
} from 'lucide-react';

interface DashboardViewProps {
  personnelList: Personnel[];
  certificates: Certificate[];
  settings: SystemSettings;
  currentUser: SystemUser;
  onNavigate: (view: string) => void;
  onViewCertificate: (cert: Certificate) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  personnelList,
  certificates,
  settings,
  currentUser,
  onNavigate,
  onViewCertificate,
}) => {
  const activePersonnel = personnelList.filter((p) => p.isActive);
  const blockedPersonnel = personnelList.filter((p) => !p.isActive);

  const pendingCerts = certificates.filter((c) => c.status === 'pending');
  const surplusCerts = certificates.filter((c) => c.isSurplus);
  const issuedCerts = certificates.filter((c) => c.status === 'issued' || c.status === 'approved');
  const settledCerts = certificates.filter((c) => c.status === 'settled');

  const totalActiveGuaranteeAmount = issuedCerts.reduce((acc, c) => acc + (c.loanAmount || 0), 0);
  const totalSalaryDeductions = certificates.filter((c) => c.type === 'salary_deduction').length;
  const totalBankGuarantees = certificates.filter((c) => c.type === 'bank_guarantee').length;
  const totalInquiries = certificates.filter(
    (c) => c.type === 'inquiry' || c.type === 'inquiry_twopiece'
  ).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-blue-700 via-indigo-700 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-white/20">
            <span>سامانه سازمانی صدور گواهی و ضمانت‌نامه</span>
            <span>•</span>
            <span>{settings.orgTitle}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-2">
            خوش‌آمدید، {currentUser.fullName}
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
            مدیریت هوشمند سقف اعتباری پرسنل، صدور آنی ضمانت‌نامه‌های بانکی، گواهی کسر از حقوق و کارتابل تأیید مازاد با رعایت دقیق قوانین استخدامی
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {(currentUser.role === 'admin' || currentUser.role === 'operator') && (
              <>
                <button
                  onClick={() => onNavigate('issue_certificate')}
                  className="flex items-center gap-2 bg-white text-blue-800 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-blue-700" />
                  <span>صدور گواهی / ضمانت‌نامه جدید</span>
                </button>
                <button
                  onClick={() => onNavigate('personnel')}
                  className="flex items-center gap-2 bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition border border-white/20 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>بارگذاری فایل ماهانه پرسنل</span>
                </button>
              </>
            )}
            {(currentUser.role === 'approver' || currentUser.role === 'admin') && pendingCerts.length > 0 && (
              <button
                onClick={() => onNavigate('approvals')}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>بررسی کارتابل ({toPersianDigits(pendingCerts.length)} در انتظار)</span>
              </button>
            )}
            {currentUser.role === 'employee' && (
              <button
                onClick={() => onNavigate('employee_portal')}
                className="flex items-center gap-2 bg-white text-blue-800 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>ورود به کارتابل پرسنلی من</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute left-[-40px] top-[-40px] w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-[-60px] w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Active Amount */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">مجموع تعهدات و ضمانت فعال</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-800 tracking-tight mb-1">
            {formatCurrency(totalActiveGuaranteeAmount, settings.currency)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            تعداد {toPersianDigits(issuedCerts.length)} فقره گواهی و ضمانت در گردش
          </div>
        </div>

        {/* Card 2: Pending Approvals */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">کارتابل در انتظار تأیید</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600 tracking-tight mb-1">
            {toPersianDigits(pendingCerts.length)} <span className="text-xs font-normal text-slate-500">درخواست</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            شامل {toPersianDigits(surplusCerts.filter(c => c.status === 'pending').length)} فقره گواهی مازاد
          </div>
        </div>

        {/* Card 3: Active Personnel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">پرسنل واجد شرایط (فعال)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 tracking-tight mb-1">
            {toPersianDigits(activePersonnel.length)} <span className="text-xs font-normal text-slate-500">نفر</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {toPersianDigits(blockedPersonnel.length)} نفر غیرفعال یا بازنشسته
          </div>
        </div>

        {/* Card 4: Settled Certificates */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">گواهی‌های تسویه‌شده</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 tracking-tight mb-1">
            {toPersianDigits(settledCerts.length)} <span className="text-xs font-normal text-slate-500">فقره</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            سقف ضمانت آنها به پرسنل بازگشته است
          </div>
        </div>
      </div>

      {/* Breakdown Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Type Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center justify-between">
            <span>تفکیک نوع اسناد صادره</span>
            <span className="text-xs font-normal text-slate-400">کل دوره</span>
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">گواهی کسر از حقوق</span>
                <span className="text-blue-700 font-bold">{toPersianDigits(totalSalaryDeductions)} فقره</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${certificates.length > 0 ? (totalSalaryDeductions / certificates.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">ضمانت‌نامه بانکی کارمندی</span>
                <span className="text-indigo-700 font-bold">{toPersianDigits(totalBankGuarantees)} فقره</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{
                    width: `${certificates.length > 0 ? (totalBankGuarantees / certificates.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">پاسخ به استعلام بانکی</span>
                <span className="text-emerald-700 font-bold">{toPersianDigits(totalInquiries)} فقره</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{
                    width: `${certificates.length > 0 ? (totalInquiries / certificates.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>ضریب مجاز خالص دریافتی:</span>
              <span className="font-bold text-slate-800">{toPersianDigits(settings.netSalaryRatio * 100)}٪</span>
            </div>
            <div className="flex justify-between">
              <span>وضعیت صدور مازاد:</span>
              <span className={`font-bold ${settings.allowSurplus ? 'text-emerald-600' : 'text-rose-600'}`}>
                {settings.allowSurplus ? 'مجاز با تأیید ویژه' : 'ممنوع'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>روال تأیید گواهی‌ها:</span>
              <span className="font-bold text-slate-800">
                {settings.approvalMode === 'all'
                  ? 'نیازمند تأیید همگانی'
                  : settings.approvalMode === 'surplus_only'
                  ? 'فقط گواهی‌های مازاد'
                  : 'صدور مستقیم و خودکار'}
              </span>
            </div>
          </div>
        </div>

        {/* Latest Certificates Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm">آخرین درخواست‌ها و گواهی‌های ثبتی</h3>
              <button
                onClick={() => onNavigate('archive')}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>مشاهده آرشیو کامل</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                    <th className="pb-3 pr-2">کد رهگیری</th>
                    <th className="pb-3">نام پرسنل</th>
                    <th className="pb-3">نوع گواهی</th>
                    <th className="pb-3">بانک عامل</th>
                    <th className="pb-3">مبلغ تسهیلات</th>
                    <th className="pb-3">وضعیت</th>
                    <th className="pb-3 pl-2 text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {certificates.slice(0, 5).map((cert) => {
                    const p = personnelList.find((x) => x.id === cert.personnelId);
                    return (
                      <tr key={cert.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 pr-2 font-mono font-bold text-slate-600">
                          {toPersianDigits(cert.trackingCode)}
                        </td>
                        <td className="py-3 font-semibold text-slate-900">
                          {p?.fullName || 'ناشناس'}
                        </td>
                        <td className="py-3 text-slate-600">
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
                        <td className="py-3 text-slate-600">{cert.bankName}</td>
                        <td className="py-3 font-bold text-slate-800">
                          {formatCurrency(cert.loanAmount, settings.currency)}
                        </td>
                        <td className="py-3">
                          {cert.status === 'approved' || cert.status === 'issued' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              صادر شده
                            </span>
                          ) : cert.status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                              در انتظار تأیید
                            </span>
                          ) : cert.status === 'settled' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                              تسویه شده
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                              رد شده
                            </span>
                          )}
                        </td>
                        <td className="py-3 pl-2 text-left">
                          <button
                            onClick={() => onViewCertificate(cert)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-[11px] underline cursor-pointer"
                          >
                            مشاهده / چاپ
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
