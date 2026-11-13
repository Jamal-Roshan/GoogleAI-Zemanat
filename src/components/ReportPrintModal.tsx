import React, { useRef } from 'react';
import { Certificate, Personnel, SystemSettings, SystemUser } from '../types';
import { formatCurrency, formatNumber, getTodayShamsi, getTodayShamsiDetailed, toPersianDigits, amountToPersianWords } from '../utils/persianUtils';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

import { printElementById } from '../utils/printUtils';

interface ReportPrintModalProps {
  certificates: Certificate[];
  personnelMap: Map<string, Personnel>;
  settings: SystemSettings;
  currentUser: SystemUser;
  filtersSummary?: {
    type: string;
    status: string;
    surplus: string;
    search?: string;
  };
  onClose: () => void;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  certificates,
  personnelMap,
  settings,
  currentUser,
  filtersSummary,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    printElementById('printable-report', 'چاپ رسمی گزارش جامع اسناد و گواهی‌ها');
  };

  const totalAmount = certificates.reduce((sum, c) => sum + (c.loanAmount || 0), 0);
  const activeCount = certificates.filter(
    (c) => c.status === 'issued' || c.status === 'approved'
  ).length;
  const settledCount = certificates.filter((c) => c.status === 'settled').length;
  const pendingCount = certificates.filter((c) => c.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto print-modal-overlay">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full my-6 flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800 print-modal-content">
        {/* Modal Toolbar (hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 rounded-t-2xl no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                پیش‌نمایش چاپ رسمی گزارش جامع اسناد
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                شامل {toPersianDigits(certificates.length)} گواهی و ضمانت‌نامه، آمار تفکیکی تسویه‌شده و مبالغ به تفکیک
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ رسمی گزارش (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Container (This prints directly via #printable-report) */}
        <div className="p-4 md:p-8 overflow-y-auto bg-slate-200/50 dark:bg-slate-950/70 flex justify-center">
          <div
            id="printable-report"
            ref={printRef}
            className="w-full max-w-[280mm] bg-white text-slate-900 p-6 md:p-10 shadow-md rounded-lg border border-slate-300 relative print:shadow-none print:border-none print:p-0 print:m-0"
            style={{ fontFamily: "'Vazir', sans-serif" }}
          >
            {/* 1. Official Report Header */}
            <div className="border-b-2 border-slate-800 pb-3 mb-4">
              <div className="text-center mb-1">
                <span className="text-[11px] font-bold text-slate-700 block">بسمه تعالی</span>
                <span className="text-[10px] text-slate-500 block">«جمهوری اسلامی ایران»</span>
              </div>

              <div className="flex items-end justify-between">
                <div className="space-y-0.5">
                  <h1 className="font-black text-slate-900 text-base">{settings.orgTitle}</h1>
                  <h2 className="text-xs font-bold text-slate-700">{settings.managingUnit}</h2>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-300 rounded text-[10px] font-bold">
                    گزارش رسمی و آماری گواهی‌های حقوقی و ضمانت‌نامه‌های بانکی
                  </span>
                </div>

                <div className="text-left space-y-1 text-xs">
                  <div className="flex justify-end gap-2 text-slate-700">
                    <span className="font-semibold">:تاریخ گزارش</span>
                    <span className="font-mono font-bold text-slate-900">
                      {toPersianDigits(getTodayShamsiDetailed())}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2 text-slate-700">
                    <span className="font-semibold">:تهیه کننده گزارش</span>
                    <span className="font-bold text-slate-900">{currentUser.fullName}</span>
                  </div>
                  <div className="flex justify-end gap-2 text-slate-700">
                    <span className="font-semibold">:تعداد اسناد گزارش</span>
                    <span className="font-mono font-bold text-slate-900">
                      {toPersianDigits(certificates.length)} رکورد
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Statistical KPI Summary Bar */}
            <div className="grid grid-cols-4 gap-2.5 mb-4 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-[10px] text-slate-500 block font-semibold">تعداد کل اسناد:</span>
                <span className="font-black text-slate-900 text-sm mt-0.5 block">
                  {toPersianDigits(certificates.length)} سند
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <span className="text-[10px] text-emerald-700 block font-semibold">اسناد جاری / معتبر:</span>
                <span className="font-black text-emerald-800 text-sm mt-0.5 block">
                  {toPersianDigits(activeCount)} فقره
                </span>
              </div>
              <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-center">
                <span className="text-[10px] text-purple-700 block font-semibold">اسناد تسویه شده (سقف آزاد):</span>
                <span className="font-black text-purple-800 text-sm mt-0.5 block">
                  {toPersianDigits(settledCount)} فقره
                </span>
              </div>
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <span className="text-[10px] text-blue-700 block font-semibold">مجموع کل مبالغ:</span>
                <span className="font-black text-blue-900 text-xs sm:text-sm mt-0.5 block">
                  {formatCurrency(totalAmount, settings.currency)}
                </span>
              </div>
            </div>

            {/* Total In Words Note */}
            <div className="mb-4 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-semibold flex items-center justify-between">
              <span>
                مجموع مبلغ اسناد مندرج به حروف: <strong>{amountToPersianWords(totalAmount, settings.currency)}</strong>
              </span>
              <span className="text-slate-500 font-normal">
                (واحد محاسبه: {settings.currency === 'rial' ? 'ریال' : 'تومان'})
              </span>
            </div>

            {/* 3. Official Tabular Report */}
            <div className="overflow-x-auto border border-slate-300 rounded-lg mb-6">
              <table className="w-full text-right text-[11px] border-collapse">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2 border-l border-slate-300 text-center w-8">ردیف</th>
                    <th className="p-2 border-l border-slate-300">شماره دبیرخانه</th>
                    <th className="p-2 border-l border-slate-300">کد رهگیری امن</th>
                    <th className="p-2 border-l border-slate-300">نام کارمند (کد پرسنلی)</th>
                    <th className="p-2 border-l border-slate-300">نوع گواهی</th>
                    <th className="p-2 border-l border-slate-300">بانک و شعبه</th>
                    <th className="p-2 border-l border-slate-300">مبلغ تسهیلات</th>
                    <th className="p-2 border-l border-slate-300">وام‌گیرنده</th>
                    <th className="p-2 border-l border-slate-300 text-center">وضعیت سند</th>
                    <th className="p-2 border-l border-slate-300">تاریخ صدور / تسویه</th>
                    <th className="p-2">اپراتور صادرکننده</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {certificates.map((cert, idx) => {
                    const p = personnelMap.get(cert.personnelId);
                    const isSettled = cert.status === 'settled';

                    return (
                      <tr
                        key={cert.id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                      >
                        <td className="p-2 border-l border-slate-300 text-center font-bold">
                          {toPersianDigits(idx + 1)}
                        </td>
                        <td className="p-2 border-l border-slate-300 font-mono font-bold text-slate-900">
                          {toPersianDigits(cert.certificateNo || '---')}
                        </td>
                        <td className="p-2 border-l border-slate-300 font-mono text-[10px] text-blue-900">
                          {toPersianDigits(cert.trackingCode)}
                        </td>
                        <td className="p-2 border-l border-slate-300">
                          <span className="font-bold text-slate-900 block">{p?.fullName || 'ناشناس'}</span>
                          <span className="text-[9px] text-slate-500 font-mono block">
                            کد: {toPersianDigits(p?.personnelCode)}
                          </span>
                        </td>
                        <td className="p-2 border-l border-slate-300 font-medium">
                          {cert.type === 'salary_deduction'
                            ? 'کسر از حقوق'
                            : cert.type === 'bank_guarantee'
                            ? 'ضمانت‌نامه'
                            : 'استعلام'}
                          {cert.isSurplus && (
                            <span className="mr-1 text-[8px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold">
                              مازاد
                            </span>
                          )}
                        </td>
                        <td className="p-2 border-l border-slate-300">
                          <span className="font-semibold block">{cert.bankName}</span>
                          <span className="text-[9px] text-slate-500">{cert.branchName}</span>
                        </td>
                        <td className="p-2 border-l border-slate-300 font-bold font-mono text-slate-900">
                          {formatCurrency(cert.loanAmount, settings.currency)}
                        </td>
                        <td className="p-2 border-l border-slate-300">
                          {cert.borrowerType === 'self' ? (
                            <span className="text-blue-800 font-semibold">خود پرسنل</span>
                          ) : (
                            <div>
                              <span>{cert.borrowerName}</span>
                              <span className="text-[9px] text-slate-500 block">
                                ({cert.borrowerRelation})
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-2 border-l border-slate-300 text-center font-bold">
                          {isSettled ? (
                            <span className="text-purple-700 font-bold">تسویه شده</span>
                          ) : cert.status === 'issued' || cert.status === 'approved' ? (
                            <span className="text-emerald-700">معتبر (جاری)</span>
                          ) : cert.status === 'pending' ? (
                            <span className="text-amber-700">در نوبت تأیید</span>
                          ) : (
                            <span className="text-slate-500">باطل شده</span>
                          )}
                        </td>
                        <td className="p-2 border-l border-slate-300 font-mono text-[10px]">
                          <div>صدور: {toPersianDigits(cert.approvedAt || cert.createdAt)}</div>
                          {cert.settledAt && (
                            <div className="text-purple-700 font-bold">
                              تسویه: {toPersianDigits(cert.settledAt)}
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-[10px]">
                          <div>{cert.operatorName}</div>
                          {cert.settledBy && (
                            <div className="text-purple-600 font-semibold text-[9px]">
                              تسویه: {cert.settledBy}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. Official Signatures Footer */}
            <div className="border-t-2 border-slate-800 pt-4 mt-6">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50">
                  <span className="text-[10px] text-slate-500 block font-semibold">
                    تهیه و تنظیم گزارش:
                  </span>
                  <p className="font-bold text-slate-900 text-xs mt-1">{currentUser.fullName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">اپراتور امور صدور و رفاه</p>
                  <div className="h-10 mt-2 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400">
                    امضای متصدی تنظیم گزارش
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50">
                  <span className="text-[10px] text-slate-500 block font-semibold">
                    بررسی و کنترل اسناد مالی:
                  </span>
                  <p className="font-bold text-slate-900 text-xs mt-1">امور مالی و اعتبارات</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">تطبیق با سقف و پرونده‌های تسویه</p>
                  <div className="h-10 mt-2 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400">
                    محل امضا و کنترل حسابداری
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50">
                  <span className="text-[10px] text-slate-500 block font-semibold">
                    مقام تأییدکننده و امضای رسمی:
                  </span>
                  <p className="font-bold text-slate-900 text-xs mt-1">{settings.signerName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{settings.signerRole}</p>
                  <div className="h-10 mt-2 border-2 border-blue-600/70 rounded flex items-center justify-center text-[9px] text-blue-700 font-bold">
                    مهر و امضای رسمی اداره
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-slate-500 mt-4 flex items-center justify-between border-t border-slate-200 pt-2">
                <span>نشانی: {settings.orgAddress}</span>
                <span>تلفن: {toPersianDigits(settings.orgPhone)}</span>
                <span>سامانه هوشمند صدور گواهی و ضمانت‌نامه - گزارش معتبر سازمانی</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
