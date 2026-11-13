import React, { useState } from 'react';
import {
  CertificateType,
  LetterTemplate,
  PlaceholderInfo,
  SystemSettings,
  SystemStampImage,
} from '../types';
import { SYSTEM_PLACEHOLDERS } from '../utils/templateDefaults';
import { StorageManager } from '../utils/storage';
import { renderLetterTemplate } from '../utils/templateRenderer';
import { cleanPersian } from '../utils/persianUtils';
import {
  FileCode,
  Tag,
  Plus,
  RotateCcw,
  Save,
  CheckCircle2,
  Eye,
  Building,
  Image,
  Check,
} from 'lucide-react';

interface TemplateEditorViewProps {
  settings: SystemSettings;
  onRefresh: () => void;
}

export const TemplateEditorView: React.FC<TemplateEditorViewProps> = ({
  settings,
  onRefresh,
}) => {
  const [templates, setTemplates] = useState<LetterTemplate[]>(StorageManager.getTemplates());
  const [selectedType, setSelectedType] = useState<CertificateType>('salary_deduction');
  const [placeholders, setPlaceholders] = useState<PlaceholderInfo[]>(SYSTEM_PLACEHOLDERS);
  const [stampImages] = useState<SystemStampImage[]>(StorageManager.getStampImages());

  const [notification, setNotification] = useState<string>('');

  const currentTemplate =
    templates.find((t) => t.type === selectedType) || templates[0];

  const handleContentChange = (val: string) => {
    const updated = templates.map((t) =>
      t.id === currentTemplate.id ? { ...t, content: val } : t
    );
    setTemplates(updated);
  };

  const handleTitleChange = (val: string) => {
    const updated = templates.map((t) =>
      t.id === currentTemplate.id ? { ...t, title: val } : t
    );
    setTemplates(updated);
  };

  const handleSetDefault = () => {
    const s = StorageManager.getSettings();
    s.defaultTemplateIds[selectedType] = currentTemplate.id;
    StorageManager.saveSettings(s);
    setNotification(`تمپلیت «${currentTemplate.title}» به عنوان قالب پیش‌فرض این بخش تعیین شد.`);
    setTimeout(() => setNotification(''), 4000);
    onRefresh();
  };

  const handleSignatureImageChange = (imgId: string) => {
    const updated = templates.map((t) =>
      t.id === currentTemplate.id ? { ...t, signatureImageId: imgId || undefined } : t
    );
    setTemplates(updated);
  };

  const handleInsertPlaceholder = (tag: string) => {
    const textarea = document.getElementById('template-textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const prev = currentTemplate.content;
      const next = prev.substring(0, start) + tag + prev.substring(end);
      handleContentChange(next);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 50);
    } else {
      handleContentChange(currentTemplate.content + ' ' + tag);
    }
  };

  const handleSave = () => {
    StorageManager.saveTemplate(currentTemplate);
    setNotification('قالب با موفقیت ذخیره گردید و در چاپ‌های جدید اعمال شد.');
    setTimeout(() => setNotification(''), 4000);
    onRefresh();
  };

  const handleReset = () => {
    if (confirm('آیا از بازنشانی کلیه تمپلیت‌ها به مقادیر پیش‌فرض اطمینان دارید؟')) {
      StorageManager.resetTemplatesToDefault();
      setTemplates(StorageManager.getTemplates());
      setNotification('تمپلیت‌ها به حالت پیش‌فرض سازمانی بازنشانی شدند.');
      setTimeout(() => setNotification(''), 4000);
      onRefresh();
    }
  };

  // Sample data for live preview
  const samplePersonnel = StorageManager.getPersonnel()[0];
  const sampleCertificate = StorageManager.getCertificates()[0];
  const previewText = renderLetterTemplate(
    currentTemplate.content,
    { ...sampleCertificate, type: selectedType },
    samplePersonnel,
    settings
  );

  const templateTypesList: { type: CertificateType; label: string }[] = [
    { type: 'salary_deduction', label: 'گواهی کسر از حقوق' },
    { type: 'bank_guarantee', label: 'ضمانت‌نامه بانکی' },
    { type: 'inquiry_twopiece', label: 'استعلام بانکی (دو تکه افقی)' },
    { type: 'inquiry', label: 'استعلام بانکی استاندارد عمودی' },
    { type: 'verification', label: 'قالب اختصاصی اصالت‌سنجی سند' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              مدیریت و طراحی تمپلیت‌های سازمانی و سربرگ‌ها
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              مدیریت تمپلیت‌ها
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            طراحی متن نامه‌ها، تعیین قالب‌های پیش‌فرض، الصاق مهر و امضای دیجیتال و پیش‌نمایش زنده
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            title="بازگشت به متن‌های استاندارد اداری"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی پیش‌فرض</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره تغییرات تمپلیت</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Template Selector Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap gap-1.5">
        {templateTypesList.map((item) => (
          <button
            key={item.type}
            onClick={() => setSelectedType(item.type)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedType === item.type
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Template Meta and Header Configuration */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            عنوان نمایشی قالب:
          </label>
          <input
            type="text"
            value={currentTemplate.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            الصاق تصویر مهر / امضای دیجیتالی رسمی به این تمپلیت:
          </label>
          <select
            value={currentTemplate.signatureImageId || ''}
            onChange={(e) => handleSignatureImageChange(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          >
            <option value="">امضا و مهر متنی پیش‌فرض اداره</option>
            {stampImages.map((img) => (
              <option key={img.id} value={img.id}>
                {img.name} ({img.type === 'signature' ? 'امضای دیجیتال' : 'مهر رسمی'})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleSetDefault}
            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>تعیین به عنوان قالب پیش‌فرض این بخش</span>
          </button>
        </div>
      </div>

      {/* Editor & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Editor and Placeholders */}
        <div className="space-y-4">
          {/* Quick Placeholders Palette */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              متغیرهای پویا (جهت درج در متن کلیک کنید):
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {placeholders.map((p) => (
                <button
                  key={p.tag}
                  type="button"
                  onClick={() => handleInsertPlaceholder(p.tag)}
                  className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-bold border border-blue-200 dark:border-blue-900 transition cursor-pointer"
                  title={`${p.label} (مثال: ${p.example})`}
                >
                  {p.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              متن نامه و شرایط قانونی تمپلیت:
            </label>
            <textarea
              id="template-textarea"
              rows={16}
              value={currentTemplate.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              placeholder="متن تمپلیت را اینجا وارد کنید..."
            />
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                پیش‌نمایش بلادرنگ با داده‌های نمونه پرسنلی
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">تطبیق خودکار با متغیرها</span>
          </div>

          {/* Rendered Preview Box */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-[13px] leading-7 text-justify whitespace-pre-line text-slate-800 dark:text-slate-100 min-h-[400px]">
            {previewText}
          </div>
        </div>
      </div>
    </div>
  );
};
