import React, { useState, useEffect } from 'react';
import { Certificate, Personnel, SystemSettings } from '../types';
import { StorageManager } from '../utils/storage';
import { cleanPersian, formatCurrency, toPersianDigits, normalizeTrackingCode, toEnglishDigits } from '../utils/persianUtils';
import { renderLetterTemplate } from '../utils/templateRenderer';
import { generateBarcodeSvg, generateQrCodeSvg } from '../utils/barcodeUtils';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Printer,
  FileText,
  Building2,
  Calendar,
  AlertTriangle,
  Lock,
  Timer,
  KeyRound,
} from 'lucide-react';

interface VerificationViewProps {
  settings: SystemSettings;
  personnelList: Personnel[];
  certificates: Certificate[];
  initialTrackingCode?: string;
  onPrintCertificate?: (cert: Certificate) => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  settings,
  personnelList,
  certificates,
  initialTrackingCode = '',
  onPrintCertificate,
}) => {
  const [trackingCodeInput, setTrackingCodeInput] = useState(initialTrackingCode);
  const [searchedCode, setSearchedCode] = useState(initialTrackingCode);

  // Security & Anti-Guessing Protection State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number>(0);
  const [remainingLockSeconds, setRemainingLockSeconds] = useState(0);
  const [captchaNum1, setCaptchaNum1] = useState(3);
  const [captchaNum2, setCaptchaNum2] = useState(5);
  const [captchaAnswerInput, setCaptchaAnswerInput] = useState('');
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);

  // Regenerate security captcha
  const resetCaptcha = () => {
    setCaptchaNum1(Math.floor(2 + Math.random() * 7));
    setCaptchaNum2(Math.floor(1 + Math.random() * 8));
    setCaptchaAnswerInput('');
  };

  useEffect(() => {
    // Check URL query param ?verify=...
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('verify') || urlParams.get('code');
    if (codeFromUrl) {
      setTrackingCodeInput(codeFromUrl);
      setSearchedCode(codeFromUrl);
    }
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutUntil <= Date.now()) {
      setRemainingLockSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      const diff = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (diff <= 0) {
        setRemainingLockSeconds(0);
        clearInterval(interval);
      } else {
        setRemainingLockSeconds(diff);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const normalizedInput = normalizeTrackingCode(searchedCode);

  const foundCert = certificates.find((c) => {
    const cClean = normalizeTrackingCode(c.trackingCode);
    const noClean = c.certificateNo ? c.certificateNo.replace(/\s+/g, '') : '';
    const searchNo = searchedCode.trim();

    return (
      (cClean && cClean === normalizedInput) ||
      (c.trackingCode.toLowerCase() === searchedCode.trim().toLowerCase()) ||
      (noClean && (noClean === searchNo || noClean === toEnglishDigits(searchNo)))
    );
  });

  const foundPersonnel = foundCert
    ? personnelList.find((p) => p.id === foundCert.personnelId)
    : null;

  const templates = StorageManager.getTemplates();
  const verificationTemplate =
    templates.find((t) => t.type === 'verification') || templates[0];

  const renderedContent =
    foundCert && foundPersonnel
      ? renderLetterTemplate(
          verificationTemplate.content,
          foundCert,
          foundPersonnel,
          settings
        )
      : '';

  const barcodeSvg = foundCert ? generateBarcodeSvg(foundCert.trackingCode, 38, 190) : '';
  const qrSvg = foundCert
    ? generateQrCodeSvg(`${window.location.origin}/?verify=${encodeURIComponent(foundCert.trackingCode)}`, 90)
    : '';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    // 1. Check if currently locked out
    if (Date.now() < lockoutUntil) {
      const waitSec = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setSecurityMessage(`استعلام موقتاً مسدود است. لطفاً ${toPersianDigits(waitSec)} ثانیه شکیبا باشید.`);
      return;
    }

    // 2. If already had failed attempts >= 3, require captcha check
    if (failedAttempts >= 3) {
      const expected = captchaNum1 + captchaNum2;
      const parsedAns = parseInt(toEnglishDigits(captchaAnswerInput.trim()), 10);
      if (isNaN(parsedAns) || parsedAns !== expected) {
        setSecurityMessage('پاسخ معادله امنیتی صحیح نیست. لطفاً مجدداً محاسبه فرمایید.');
        resetCaptcha();
        return;
      }
    }

    const query = trackingCodeInput.trim();
    if (!query) {
      setSecurityMessage('لطفاً کد رهگیری یا شماره ثبت دبیرخانه را وارد فرمایید.');
      return;
    }

    setSearchedCode(query);

    // Check if query matches any certificate
    const norm = normalizeTrackingCode(query);
    const matched = certificates.find((c) => {
      const cClean = normalizeTrackingCode(c.trackingCode);
      const noClean = c.certificateNo ? c.certificateNo.replace(/\s+/g, '') : '';
      return (
        (cClean && cClean === norm) ||
        c.trackingCode.toLowerCase() === query.toLowerCase() ||
        (noClean && (noClean === query || noClean === toEnglishDigits(query)))
      );
    });

    if (!matched) {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      if (nextFail >= 3) {
        const lockDurationMs = 15000;
        setLockoutUntil(Date.now() + lockDurationMs);
        setRemainingLockSeconds(15);
        resetCaptcha();
        setSecurityMessage('به دلیل ۳ تلاش ناموفق متوالی، استعلام به مدت ۱۵ ثانیه مسدود گردید.');
      } else {
        setSecurityMessage(`کد رهگیری وارد شده در سامانه یافت نشد. (تلاش ناموفق ${toPersianDigits(nextFail)} از ۳)`);
      }
    } else {
      // Success: reset failed attempts
      setFailedAttempts(0);
      setSecurityMessage(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
                سامانه اصالت‌سنجی و استعلام برخط گواهی و ضمانت‌نامه
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تأییدیه رسمی اصالت اسناد اداری و حقوقی صادره از {settings.orgTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                disabled={remainingLockSeconds > 0}
                placeholder="کد رهگیری یا شماره ثبت دبیرخانه را وارد کنید..."
                value={trackingCodeInput}
                onChange={(e) => setTrackingCodeInput(e.target.value)}
                className="w-full pr-9 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={remainingLockSeconds > 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {remainingLockSeconds > 0 ? (
                <>
                  <Timer className="w-3.5 h-3.5 animate-spin" />
                  <span>{toPersianDigits(remainingLockSeconds)} ثانیه</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>استعلام سند</span>
                </>
              )}
            </button>
          </div>

          {/* Security Captcha (appears if 3 failed attempts) */}
          {failedAttempts >= 3 && remainingLockSeconds === 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                <span>حفاظت امنیتی (تأیید هویت کاربر): حاصل جمع {toPersianDigits(captchaNum1)} + {toPersianDigits(captchaNum2)} چقدر است؟</span>
              </div>
              <input
                type="text"
                value={captchaAnswerInput}
                onChange={(e) => setCaptchaAnswerInput(e.target.value)}
                placeholder="پاسخ عددی"
                className="w-24 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-center font-bold text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {securityMessage && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{securityMessage}</span>
            </div>
          )}
        </form>
      </div>

      {/* Result Section */}
      {searchedCode && (
        <>
          {foundCert && foundPersonnel ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Authenticity Certificate Header */}
              <div
                className={`p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  foundCert.status === 'issued' || foundCert.status === 'approved'
                    ? 'bg-gradient-to-l from-emerald-600 to-teal-700'
                    : foundCert.status === 'settled'
                    ? 'bg-gradient-to-l from-purple-600 to-indigo-700'
                    : 'bg-gradient-to-l from-rose-600 to-red-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base">اصالت سند تأیید گردید</h3>
                    <p className="text-xs text-white/80">
                      این سند در دفاتر رسمی {settings.orgTitle} به ثبت رسیده است.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-900 shadow-xs">
                    وضعیت: {foundCert.status === 'issued' || foundCert.status === 'approved'
                      ? 'صادر شده و معتبر'
                      : foundCert.status === 'settled'
                      ? 'تسویه شده'
                      : 'باطل شده'}
                  </span>
                  {onPrintCertificate && foundCert.status !== 'settled' && foundCert.status !== 'cancelled' && (
                    <button
                      onClick={() => onPrintCertificate(foundCert)}
                      className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>چاپ مجدد</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Printable Verification Sheet */}
              <div className="p-6 md:p-8 space-y-6">
                {/* Official Letterhead */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">باسمه تعالی</span>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                      {settings.orgTitle}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{settings.managingUnit}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      تأییدیه الکترونیکی اصالت سند اداری
                    </span>
                  </div>

                  <div className="text-right text-xs space-y-1">
                    <div>
                      <span className="text-slate-500">شماره دبیرخانه: </span>
                      <strong className="font-mono text-slate-900 dark:text-slate-100">
                        {toPersianDigits(foundCert.certificateNo || 'در نوبت')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">تاریخ صدور: </span>
                      <strong className="font-mono">
                        {toPersianDigits(foundCert.approvedAt || foundCert.createdAt)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">شناسه رهگیری: </span>
                      <strong className="font-mono text-blue-700">
                        {toPersianDigits(foundCert.trackingCode)}
                      </strong>
                    </div>
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <div className="border border-slate-200 dark:border-slate-700 p-0.5 rounded bg-white shadow-2xs" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
                      <div className="w-11 h-11 border border-slate-200 dark:border-slate-700 p-0.5 rounded bg-white flex items-center justify-center shrink-0 shadow-2xs" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                    </div>
                  </div>
                </div>

                {/* Key Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 block mb-0.5">نام همکار متعهد</span>
                    <strong className="text-slate-800 dark:text-slate-100">{foundPersonnel.fullName}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 block mb-0.5">بانک و شعبه مقصد</span>
                    <strong className="text-slate-800 dark:text-slate-100">{foundCert.bankName}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 block mb-0.5">مبلغ تعهد تسهیلات</span>
                    <strong className="text-slate-800 dark:text-slate-100">
                      {formatCurrency(foundCert.loanAmount, settings.currency)}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 block mb-0.5">کارشناس صادرکننده</span>
                    <strong className="text-slate-800 dark:text-slate-100">{foundCert.operatorName}</strong>
                  </div>
                </div>

                {/* Body Text */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-justify leading-7 whitespace-pre-line text-slate-800 dark:text-slate-200">
                  {renderedContent}
                </div>

                {/* Footer and Seals */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                  <div className="text-slate-500 text-[11px] space-y-0.5">
                    <div>نشانی: {settings.orgAddress}</div>
                    <div>تارنمای استعلام: {settings.websiteUrl}</div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{settings.signerName}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">{settings.signerRole}</p>
                    <span className="inline-block mt-1 px-3 py-1 rounded-lg border border-blue-600 text-blue-700 text-[10px] font-bold">
                      امضای دیجیتال و تأییدیه سیستمی
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                <XCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-rose-800 dark:text-rose-200 text-base">
                سندی با این کد رهگیری در سامانه یافت نشد
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-300 max-w-md mx-auto">
                شناسه «{searchedCode}» در پایگاه داده مدیریت آموزش و پرورش ثبت نگردیده است یا ممکن است باطل شده باشد.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
