import React, { useRef } from 'react';
import { Certificate, Personnel, SystemSettings } from '../types';
import { renderLetterTemplate } from '../utils/templateRenderer';
import { StorageManager } from '../utils/storage';
import { toPersianDigits, formatCurrency } from '../utils/persianUtils';
import { generateBarcodeSvg, generateQrCodeSvg } from '../utils/barcodeUtils';
import { Printer, X, ShieldAlert, Scissors, CheckCircle2 } from 'lucide-react';

import { printElementById } from '../utils/printUtils';

interface OfficialPrintModalProps {
  certificate: Certificate;
  personnel: Personnel;
  settings: SystemSettings;
  onClose: () => void;
}

export const OfficialPrintModal: React.FC<OfficialPrintModalProps> = ({
  certificate,
  personnel,
  settings,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const templates = StorageManager.getTemplates();
  const isTwoPieceInquiry =
    certificate.type === 'inquiry' || certificate.type === 'inquiry_twopiece';

  // Cannot reprint settled or cancelled certificates
  const isSettleOrCancelled =
    certificate.status === 'settled' || certificate.status === 'cancelled';

  const template =
    templates.find((t) => t.type === certificate.type) ||
    templates.find((t) => t.type === (isTwoPieceInquiry ? 'inquiry_twopiece' : 'salary_deduction')) ||
    templates[0];

  const letterBody = renderLetterTemplate(template.content, certificate, personnel, settings);
  const bodyParts = letterBody.split(/--------------------------------------------------|\n-{3,}\n/);
  const part1 = bodyParts[0]?.trim() || '';
  const part2 = bodyParts[1]?.trim() || '';

  // Get digital signature / stamp image if configured
  const stampImages = StorageManager.getStampImages();
  const certStampImage = certificate.signatureImageId
    ? stampImages.find((img) => img.id === certificate.signatureImageId)
    : stampImages[0] || null;

  const certificateTypeTitle =
    certificate.type === 'salary_deduction'
      ? 'گواهی کسر از حقوق'
      : certificate.type === 'bank_guarantee'
      ? 'ضمانت‌نامه بانکی کارمندی'
      : 'پاسخ به استعلام بانکی';

  const handlePrint = () => {
    if (isSettleOrCancelled) {
      return;
    }
    const targetId = isTwoPieceInquiry ? 'printable-estelam-two-piece' : 'printable-certificate';
    printElementById(targetId, `چاپ رسمی ${certificateTypeTitle} - ${certificate.trackingCode}`);
  };

  const verificationUrl = `${window.location.origin}/?verify=${encodeURIComponent(certificate.trackingCode)}`;
  const barcodeSvg = generateBarcodeSvg(certificate.trackingCode, 36, 170);
  const qrSvg = generateQrCodeSvg(verificationUrl, 84);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto print-modal-overlay">
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ${
          isTwoPieceInquiry ? 'max-w-6xl' : 'max-w-4xl'
        } w-full my-8 flex flex-col max-h-[94vh] border border-slate-200 dark:border-slate-800 print-modal-content`}
      >
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 rounded-t-2xl no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  پیش‌نمایش چاپ رسمی: {certificateTypeTitle}
                </h3>
                {isTwoPieceInquiry && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    ورق A4 افقی دو تکه
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                کد رهگیری امنیتی: {toPersianDigits(certificate.trackingCode)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isSettleOrCancelled ? (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ نامه رسمی (Print / PDF)</span>
              </button>
            ) : (
              <span className="text-rose-600 font-bold text-xs bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                چاپ مجدد مسدود است (سند تسویه یا باطل شده)
              </span>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settled / Cancelled Warning Notice */}
        {isSettleOrCancelled && (
          <div className="m-4 p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
            <div>
              <strong>محدودیت قانونی چاپ مجدد:</strong> این سند در وضعیت{' '}
              {certificate.status === 'settled' ? '«تسویه شده»' : '«باطل شده»'} قرار دارد. طبق مقررات
              سیستم و جهت جلوگیری از سوءاستفاده‌های بانکی، امکان چاپ مجدد این برگه وجود ندارد.
            </div>
          </div>
        )}

        {/* Paper Container */}
        <div className="p-4 md:p-8 overflow-y-auto bg-slate-200/50 dark:bg-slate-950/70 flex justify-center">
          {/* CASE A: TWO-PIECE HORIZONTAL INQUIRY (A4 Landscape) */}
          {isTwoPieceInquiry ? (
            <div
              id="printable-estelam-two-piece"
              ref={printRef}
              className="w-full max-w-[297mm] min-h-[210mm] bg-white text-slate-900 p-6 md:p-8 shadow-md rounded-lg border border-slate-300 relative print:shadow-none print:border-none print:p-0 print:m-0"
            >
              <div className="grid grid-cols-2 gap-6 h-full relative">
                {/* Center Cut Line with Scissors */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-between py-4 pointer-events-none z-10">
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 border border-dashed border-slate-400 rounded-full text-[10px] text-slate-500 font-bold">
                    <Scissors className="w-3 h-3 rotate-90 text-slate-600" />
                    <span>محل برش (دو تکه)</span>
                  </div>
                  <div className="w-[1px] h-full border-r-2 border-dashed border-slate-400 my-2" />
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 border border-dashed border-slate-400 rounded-full text-[10px] text-slate-500 font-bold">
                    <Scissors className="w-3 h-3 rotate-90 text-slate-600" />
                  </div>
                </div>

                {/* Right Half: نسخه بانک / موسسه مالی */}
                <div className="p-4 border border-slate-200 rounded-xl flex flex-col justify-between text-xs space-y-4">
                  <div>
                    {/* Centered Header */}
                    <div className="text-center border-b border-slate-300 pb-2 mb-3">
                      <span className="text-xs font-bold text-slate-800 block">باسمه تعالی</span>
                      <h4 className="font-black text-slate-900 text-sm mt-0.5">{settings.orgTitle}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">{settings.managingUnit}</p>
                      <span className="text-[10px] text-blue-800 font-bold block mt-1">
                        پاسخ به استعلام بانکی (نسخه بانک)
                      </span>
                    </div>

                    {/* Metadata line */}
                    <div className="flex justify-between items-center text-[11px] mb-3 text-slate-700">
                      <div>
                        شماره دبیرخانه: <strong className="font-mono text-slate-900">{toPersianDigits(certificate.certificateNo || 'در نوبت')}</strong>
                      </div>
                      <div>
                        تاریخ صدور: <span className="font-mono">{toPersianDigits(certificate.approvedAt || certificate.createdAt)}</span>
                      </div>
                      <div>
                        پیوست: <span className="font-bold">ندارد</span>
                      </div>
                    </div>

                    {/* Barcode & QR Code & Tracking */}
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-300 mb-3">
                      <div>
                        <div className="text-[10px] font-mono text-slate-700">
                          کد رهگیری: <strong className="text-blue-800">{toPersianDigits(certificate.trackingCode)}</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="border border-slate-200 p-0.5 rounded bg-white shadow-2xs" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
                        <div className="w-8 h-8 border border-slate-200 p-0.5 rounded bg-white flex items-center justify-center shrink-0 shadow-2xs" dangerouslySetInnerHTML={{ __html: generateQrCodeSvg(verificationUrl, 30) }} />
                      </div>
                    </div>

                    {/* Letter Body */}
                    <div className="leading-7 text-justify text-slate-900 whitespace-pre-line text-xs font-normal">
                      {letterBody}
                    </div>
                  </div>

                  {/* Centered Footer & Signature */}
                  <div className="border-t border-slate-200 pt-3 text-center space-y-1">
                    <p className="font-bold text-slate-900 text-xs">{settings.signerName}</p>
                    <p className="text-[10px] text-slate-600">{settings.signerRole}</p>
                    {certStampImage ? (
                      <div className="my-1 flex justify-center">
                        <img
                          src={certStampImage.dataUrl}
                          alt="مهر و امضا"
                          className="h-14 max-w-[120px] object-contain"
                        />
                      </div>
                    ) : (
                      <div className="mt-2 inline-block px-3 py-1 border border-blue-600/70 rounded-lg text-blue-700 text-[9px] font-bold">
                        محل امضا و مهر اداره
                      </div>
                    )}
                    <div className="text-[9px] text-slate-400 mt-1 flex justify-between px-2">
                      <span>اپراتور صادرکننده: {certificate.operatorName}</span>
                      <span>اعتبار با مهر و امضای رسمی</span>
                    </div>
                  </div>
                </div>

                {/* Left Half: نسخه بایگانی اداره */}
                <div className="p-4 border border-slate-200 rounded-xl flex flex-col justify-between text-xs space-y-4">
                  <div>
                    {/* Centered Header */}
                    <div className="text-center border-b border-slate-300 pb-2 mb-3">
                      <span className="text-xs font-bold text-slate-800 block">باسمه تعالی</span>
                      <h4 className="font-black text-slate-900 text-sm mt-0.5">{settings.orgTitle}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">{settings.managingUnit}</p>
                      <span className="text-[10px] text-emerald-800 font-bold block mt-1">
                        پاسخ به استعلام بانکی (نسخه بایگانی اداره)
                      </span>
                    </div>

                    {/* Metadata line */}
                    <div className="flex justify-between items-center text-[11px] mb-3 text-slate-700">
                      <div>
                        شماره دبیرخانه: <strong className="font-mono text-slate-900">{toPersianDigits(certificate.certificateNo || 'در نوبت')}</strong>
                      </div>
                      <div>
                        تاریخ صدور: <span className="font-mono">{toPersianDigits(certificate.approvedAt || certificate.createdAt)}</span>
                      </div>
                      <div>
                        پیوست: <span className="font-bold">ندارد</span>
                      </div>
                    </div>

                    {/* Barcode & QR Code & Tracking */}
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-300 mb-3">
                      <div>
                        <div className="text-[10px] font-mono text-slate-700">
                          کد رهگیری: <strong className="text-blue-800">{toPersianDigits(certificate.trackingCode)}</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="border border-slate-200 p-0.5 rounded bg-white shadow-2xs" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
                        <div className="w-8 h-8 border border-slate-200 p-0.5 rounded bg-white flex items-center justify-center shrink-0 shadow-2xs" dangerouslySetInnerHTML={{ __html: generateQrCodeSvg(verificationUrl, 30) }} />
                      </div>
                    </div>

                    {/* Letter Body */}
                    <div className="leading-7 text-justify text-slate-900 whitespace-pre-line text-xs font-normal">
                      {letterBody}
                    </div>
                  </div>

                  {/* Centered Footer & Signature */}
                  <div className="border-t border-slate-200 pt-3 text-center space-y-1">
                    <p className="font-bold text-slate-900 text-xs">{settings.signerName}</p>
                    <p className="text-[10px] text-slate-600">{settings.signerRole}</p>
                    <div className="mt-2 inline-block px-3 py-1 border border-emerald-600/70 rounded-lg text-emerald-700 text-[9px] font-bold">
                      ثبت دبیرخانه و بایگانی پرونده پرسنلی
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 flex justify-between px-2">
                      <span>اپراتور صادرکننده: {certificate.operatorName}</span>
                      <span>نسخه بایگانی واحد رفاه</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* CASE B: STANDARD FULL A4 PORTRAIT */
            <div
              id="printable-certificate"
              ref={printRef}
              className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-6 md:p-10 shadow-md rounded-lg flex flex-col justify-between border border-slate-300 relative print:shadow-none print:border-none print:p-0 print:m-0"
            >
              <div>
                {/* 1. Top Letterhead */}
                <div className="border-b-2 border-slate-700 pb-3 mb-3">
                  <div className="text-center mb-1">
                    <span className="text-xs font-bold text-slate-800 block">باسمه تعالی</span>
                    <span className="text-[10px] text-slate-500 font-medium block">«جمهوری اسلامی ایران»</span>
                  </div>

                  <div className="flex items-end justify-between">
                    {/* Right: Organization & Document Type */}
                    <div className="space-y-0.5 text-right">
                      <h1 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                        {settings.orgTitle}
                      </h1>
                      <h2 className="text-xs font-semibold text-slate-700">
                        {settings.managingUnit}
                      </h2>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded text-[10px] font-bold">
                        {certificate.type === 'salary_deduction' ? 'گواهی کسر از حقوق' : 'ضمانت‌نامه بانکی کارمندی'}
                      </span>
                    </div>

                    {/* Left: Administrative Details with Perfect RTL Alignment */}
                    <div className="text-right space-y-1 text-xs">
                      <div className="flex items-center justify-end gap-1.5 text-slate-700">
                        <span className="font-medium">شماره دبیرخانه:</span>
                        <strong className="font-mono text-slate-900">
                          {toPersianDigits(certificate.certificateNo || 'در نوبت')}
                        </strong>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-slate-700">
                        <span className="font-medium">تاریخ صدور:</span>
                        <strong className="font-mono text-slate-900">
                          {toPersianDigits(certificate.approvedAt || certificate.createdAt)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-slate-700">
                        <span className="font-medium">پیوست:</span>
                        <span className="font-bold text-slate-900">ندارد</span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-slate-700">
                        <span className="font-medium">کد رهگیری:</span>
                        <strong className="font-mono text-blue-800">
                          {toPersianDigits(certificate.trackingCode)}
                        </strong>
                      </div>

                      {/* Scannable Barcode SVG */}
                      <div className="pt-1.5 flex flex-col items-end gap-1">
                        <div className="border border-slate-200 p-0.5 rounded bg-white shadow-2xs" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
                        <span className="font-mono text-[9px] text-slate-500 font-semibold tracking-wider">
                          {certificate.trackingCode}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important notice banner */}
                <div className="mb-3 p-2 bg-blue-50/80 border border-blue-200 rounded-lg text-blue-900 text-[11px] font-semibold leading-relaxed">
                  این گواهی با مهر و امضای اداره معتبر خواهد بود. لذا پس از چاپ با در دست داشتن این برگه و مدارک شناسایی معتبر، شخصاً به امور مالی و رفاهی اداره مراجعه فرمایید.
                </div>

                {/* 2. Part 1: تقاضا و وکالت‌نامه متقاضی / کارمند ضامن */}
                <div className="text-justify leading-7 text-slate-900 text-xs sm:text-[12.5px] whitespace-pre-line px-1 font-normal">
                  {part1}
                </div>

                {/* 3. تعهد، امضا و اثر انگشت متقاضی / ضامن در حضور مسئول اداره: زیر قسمت اول */}
                <div className="my-3 p-3 border border-slate-300 rounded-xl bg-slate-50/70">
                  <div className="text-xs font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                    <span>تعهد، امضا و اثر انگشت متقاضی / ضامن در حضور مسئول اداره:</span>
                    <span className="text-[10px] text-slate-500 font-normal">احراز هویت و اخذ تعهد با رویت مدارک شناسایی معتبر</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center pt-1">
                    <div className="border-r border-slate-200 pr-2">
                      <span className="text-[10px] text-slate-500 block">نام و نام خانوادگی:</span>
                      <span className="font-bold text-slate-900 text-xs mt-0.5 block">{personnel.fullName}</span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">کد پرسنلی: {toPersianDigits(personnel.personnelCode)}</span>
                    </div>
                    <div className="border-r border-slate-200 pr-2">
                      <span className="text-[10px] text-slate-500 block">امضای متعهد / ضامن:</span>
                      <div className="h-9 mt-0.5 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                        محل امضا
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">اثر انگشت:</span>
                      <div className="h-9 w-16 mx-auto mt-0.5 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                        اثر انگشت
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Part 2: تعهد بازپرداخت و گواهی / ضمانت رسمی اداره به بانک با شرایط پنج‌گانه */}
                {part2 && (
                  <>
                    <div className="my-2 border-b border-dashed border-slate-300" />
                    <div className="text-justify leading-7 text-slate-900 text-xs sm:text-[12.5px] whitespace-pre-line px-1 font-normal">
                      {part2}
                    </div>
                  </>
                )}
              </div>

              {/* 5. Bottom Signatures & Verification Area */}
              <div className="pt-4 mt-4 border-t border-slate-300">
                <div className="grid grid-cols-3 gap-3 items-end mb-3">
                  {/* QR Code and verification box pointing to real verification URL */}
                  <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <div
                      className="w-14 h-14 bg-white border border-slate-300 p-1 rounded-lg shrink-0 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                    <div className="text-[9px] text-slate-600 space-y-0.5">
                      <p className="font-bold text-slate-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        اصالت‌سنجی برخط
                      </p>
                      <p className="font-mono text-slate-500 text-[8px] truncate">
                        {toPersianDigits(certificate.trackingCode)}
                      </p>
                    </div>
                  </div>

                  {/* نام و امضای اپراتور صادرکننده */}
                  <div className="text-center border-r border-l border-slate-200 px-2">
                    <span className="text-[10px] text-slate-500 block">اپراتور صادرکننده:</span>
                    <p className="font-bold text-slate-900 text-xs mt-0.5">
                      {certificate.operatorName || 'کارشناس امور صدور و رفاه'}
                    </p>
                    <div className="mt-1 h-8 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-500">
                      امضای کارشناس
                    </div>
                  </div>

                  {/* Signer signature and position with actual stamp image if present */}
                  <div className="text-center min-w-[140px]">
                    <span className="text-[10px] text-slate-500 block">مقام تأییدکننده:</span>
                    <p className="font-bold text-slate-900 text-xs mt-0.5">{settings.signerName}</p>
                    <p className="text-[10px] text-slate-600">{settings.signerRole}</p>
                    {certStampImage ? (
                      <div className="mt-1 flex justify-center">
                        <img
                          src={certStampImage.dataUrl}
                          alt="مهر و امضا"
                          className="h-14 max-w-[120px] object-contain"
                        />
                      </div>
                    ) : (
                      <div className="mt-1 inline-block px-3 py-1 border border-blue-700/80 rounded-lg text-blue-700 text-[9px] font-bold">
                        مهر و امضای رسمی اداره
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Org Contact Details */}
                <div className="text-[9px] text-slate-500 border-t border-slate-200 pt-2 flex flex-wrap items-center justify-between gap-1">
                  <span>نشانی: {settings.orgAddress}</span>
                  <span>کد پستی: {toPersianDigits(settings.orgPostalCode)}</span>
                  <span>تلفن: {toPersianDigits(settings.orgPhone)}</span>
                  <span>اپراتور: <strong className="text-slate-700">{certificate.operatorName}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
