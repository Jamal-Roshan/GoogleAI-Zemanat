import React, { useState } from 'react';
import {
  CertificateType,
  SystemSettings,
  SystemStampImage,
  SystemUser,
  UserRole,
} from '../types';
import { StorageManager } from '../utils/storage';
import { cleanPersian, formatCurrency, toPersianDigits } from '../utils/persianUtils';
import {
  Settings,
  Users,
  Shield,
  Building,
  KeyRound,
  CheckCircle2,
  Save,
  RotateCcw,
  UserPlus,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Image,
  Upload,
  Trash2,
  FileText,
  UserX,
  AlertOctagon,
  Eye,
  Calendar,
  Download,
  Code2,
  Server,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { BLAZOR_ZIP_BASE64 } from '../utils/zipBase64';

interface SettingsAndUsersViewProps {
  settings: SystemSettings;
  onSettingsUpdate: (settings: SystemSettings) => void;
  currentUser: SystemUser;
  onRefresh: () => void;
}

export const SettingsAndUsersView: React.FC<SettingsAndUsersViewProps> = ({
  settings,
  onSettingsUpdate,
  currentUser,
  onRefresh,
}) => {
  // Accordion state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    org: true,
    users: true,
    stamps: false,
    certTitles: false,
    retiredCleanup: false,
    wipe: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Local settings state
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [saveMessage, setSaveMessage] = useState<string>('');

  // User management
  const [users, setUsers] = useState<SystemUser[]>(StorageManager.getUsers());
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRoles, setNewRoles] = useState<UserRole[]>(['employee']);
  const [newPersonnelCode, setNewPersonnelCode] = useState('');
  const [resetModalResult, setResetModalResult] = useState<{ username: string; pass: string; message: string } | null>(null);

  // Digital stamps & signatures
  const [stampImages, setStampImages] = useState<SystemStampImage[]>(StorageManager.getStampImages());
  const [newStampTitle, setNewStampTitle] = useState('');
  const [newStampType, setNewStampType] = useState<'signature' | 'stamp'>('signature');
  const [stampFileBase64, setStampFileBase64] = useState<string | null>(null);

  // Secretariat Year reset state
  const [newYearInput, setNewYearInput] = useState(settings.secretariatYear || '1404');
  const [startCounterInput, setStartCounterInput] = useState(1);

  // Retired Personnel Cleanup state
  const [retiredPersonnel, setRetiredPersonnel] = useState(StorageManager.getDeletableRetiredPersonnel());

  // Wipe data modal states
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [wipeActionType, setWipeActionType] = useState<'empty' | 'defaults'>('defaults');

  const isAdmin =
    currentUser.role === 'admin' || (currentUser.roles && currentUser.roles.includes('admin'));

  const refreshAll = () => {
    setUsers(StorageManager.getUsers());
    setStampImages(StorageManager.getStampImages());
    setRetiredPersonnel(StorageManager.getDeletableRetiredPersonnel());
    onRefresh();
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned: SystemSettings = {
      ...formData,
      orgTitle: cleanPersian(formData.orgTitle),
      orgAddress: cleanPersian(formData.orgAddress),
      managingUnit: cleanPersian(formData.managingUnit),
      signerName: cleanPersian(formData.signerName),
      signerRole: cleanPersian(formData.signerRole),
      secretariatSuffix: cleanPersian(formData.secretariatSuffix),
    };

    StorageManager.saveSettings(cleaned);
    onSettingsUpdate(cleaned);
    setSaveMessage('تنظیمات سامانه با موفقیت ذخیره شد.');
    setTimeout(() => setSaveMessage(''), 4000);
  };

  // Reset Secretariat Counter
  const handleResetSecretariat = () => {
    if (
      confirm(
        `آیا از بازنشانی شماره دبیرخانه به شروع از ${startCounterInput} برای سال جدید (${newYearInput}) اطمینان دارید؟`
      )
    ) {
      StorageManager.resetSecretariatCounter(newYearInput, startCounterInput);
      const updated = StorageManager.getSettings();
      setFormData(updated);
      onSettingsUpdate(updated);
      setSaveMessage(`شماره دبیرخانه برای سال ${newYearInput} با موفقیت بازنشانی شد.`);
      setTimeout(() => setSaveMessage(''), 4000);
    }
  };

  // Toggle user role (multi-role support)
  const handleToggleUserRole = (user: SystemUser, roleToToggle: UserRole) => {
    const currentRoles = user.roles ? [...user.roles] : [user.role];
    let nextRoles: UserRole[];

    if (currentRoles.includes(roleToToggle)) {
      if (currentRoles.length === 1) {
        alert('کاربر باید حداقل دارای یک نقش فعال باشد.');
        return;
      }
      nextRoles = currentRoles.filter((r) => r !== roleToToggle);
    } else {
      nextRoles = [...currentRoles, roleToToggle];
    }

    const updatedUsers = users.map((u) => {
      if (u.id === user.id) {
        return {
          ...u,
          roles: nextRoles,
          role: nextRoles[0], // primary role
        };
      }
      return u;
    });

    StorageManager.saveUsers(updatedUsers);
    setUsers(StorageManager.getUsers());
    onRefresh();
  };

  // Reset password
  const handleResetPassword = (u: SystemUser) => {
    const res = StorageManager.resetUserPassword(u.id, currentUser);
    setResetModalResult({ username: u.username, pass: res.defaultPassword, message: res.message });
  };

  // Create new user
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim()) return;

    const newUser: SystemUser = {
      id: `usr_${Date.now()}`,
      username: cleanPersian(newUsername).toLowerCase(),
      password: newPersonnelCode.trim() || cleanPersian(newUsername).toLowerCase(),
      fullName: cleanPersian(newFullName),
      role: newRoles[0] || 'employee',
      roles: newRoles,
      personnelCode: newPersonnelCode.trim() || undefined,
      isActive: true,
      createdAt: '۱۴۰۳/۰۸/۲۰',
    };

    const updated = [...users, newUser];
    StorageManager.saveUsers(updated);
    setUsers(StorageManager.getUsers());
    setShowAddUserModal(false);
    setNewUsername('');
    setNewFullName('');
    setNewPersonnelCode('');
    setNewRoles(['employee']);
    onRefresh();
  };

  // Handle image upload for digital signature / seal
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('حجم تصویر نباید بیشتر از ۲ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setStampFileBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStampImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stampFileBase64 || !newStampTitle.trim()) {
      alert('لطفاً عنوان و فایل تصویر را انتخاب کنید.');
      return;
    }

    const newImage: SystemStampImage = {
      id: `stamp_${Date.now()}`,
      name: cleanPersian(newStampTitle.trim()),
      type: newStampType,
      dataUrl: stampFileBase64,
      createdAt: new Date().toLocaleDateString('fa-IR'),
    };

    const res = StorageManager.saveStampImage(newImage);
    if (res.success) {
      setStampImages(StorageManager.getStampImages());
      setNewStampTitle('');
      setStampFileBase64(null);
      setSaveMessage(res.message);
      setTimeout(() => setSaveMessage(''), 4000);
    } else {
      alert(res.message);
    }
  };

  const handleDeleteStampImage = (id: string) => {
    if (confirm('آیا از حذف این تصویر مهر / امضا اطمینان دارید؟')) {
      const res = StorageManager.deleteStampImage(id);
      if (res.success) {
        setStampImages(StorageManager.getStampImages());
        setSaveMessage(res.message);
        setTimeout(() => setSaveMessage(''), 4000);
      } else {
        alert(res.message);
      }
    }
  };

  // Delete retired personnel
  const handleDeleteRetired = (pId: string, name: string) => {
    if (
      confirm(
        `آیا از حذف قطعی اطلاعات، پرونده و سوابق گواهی‌های پرسنل بازنشسته «${name}» اطمینان کامل دارید؟`
      )
    ) {
      const res = StorageManager.deleteRetiredPersonnelAndHistory(pId);
      if (res.success) {
        refreshAll();
        setSaveMessage(res.message);
        setTimeout(() => setSaveMessage(''), 4000);
      } else {
        alert(res.message);
      }
    }
  };

  // Execute system wipe
  const handleExecuteWipe = () => {
    if (wipeConfirmText.trim() !== 'حذف کامل') {
      alert('جهت تایید نهایی، عبارت «حذف کامل» را در کادر مربوطه تایپ فرمایید.');
      return;
    }

    StorageManager.wipeAllSystemData(wipeActionType === 'defaults');
    setIsWipeModalOpen(false);
    setWipeConfirmText('');
    refreshAll();
    window.location.reload();
  };

  // Check default admin status
  const defaultAdmin = users.find((u) => u.username === 'admin');
  const otherAdminsCount = users.filter(
    (u) =>
      u.username !== 'admin' &&
      (u.role === 'admin' || (u.roles && u.roles.includes('admin'))) &&
      u.isActive
  ).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Title */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>تنظیمات جامع، مدیریت کاربران و دسترسی‌های سازمانی</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            پیکربندی هویت سازمانی، مدیریت نقش‌های چندگانه کاربران، مهرهای دیجیتال و ابزارهای پاکسازی امن
          </p>
        </div>

        {saveMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}
      </div>

      {/* ACCORDION 1: Organization Settings & Secretariat Counter Reset */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <button
          onClick={() => toggleAccordion('org')}
          className="w-full p-5 text-right font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Building className="w-5 h-5 text-blue-600" />
            <span>اطلاعات پایه سازمان، مسئول امضاکننده و تنظیمات دبیرخانه</span>
          </div>
          {openAccordions['org'] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {openAccordions['org'] && (
          <form onSubmit={handleSaveSettings} noValidate className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">نام سازمان:</label>
                <input
                  type="text"
                  value={formData.orgTitle}
                  onChange={(e) => setFormData({ ...formData, orgTitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">واحد متولی صدور:</label>
                <input
                  type="text"
                  value={formData.managingUnit}
                  onChange={(e) => setFormData({ ...formData, managingUnit: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">کد سازمانی:</label>
                <input
                  type="text"
                  value={formData.orgCode}
                  onChange={(e) => setFormData({ ...formData, orgCode: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">نشانی پستی سازمان:</label>
                <input
                  type="text"
                  value={formData.orgAddress}
                  onChange={(e) => setFormData({ ...formData, orgAddress: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">کد پستی:</label>
                <input
                  type="text"
                  value={formData.orgPostalCode}
                  onChange={(e) => setFormData({ ...formData, orgPostalCode: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">تلفن تماس:</label>
                <input
                  type="text"
                  value={formData.orgPhone}
                  onChange={(e) => setFormData({ ...formData, orgPhone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">نام مسئول امضاکننده:</label>
                <input
                  type="text"
                  value={formData.signerName}
                  onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">سمت مسئول امضاکننده:</label>
                <input
                  type="text"
                  value={formData.signerRole}
                  onChange={(e) => setFormData({ ...formData, signerRole: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>
            </div>

            {/* Secretariat & Year Reset Section */}
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>تنظیمات شماره‌گذاری دبیرخانه و شروع مجدد در سال جدید</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    پسوند شماره دبیرخانه:
                  </label>
                  <input
                    type="text"
                    value={formData.secretariatSuffix}
                    onChange={(e) => setFormData({ ...formData, secretariatSuffix: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">مانند ۱/۱۰۴</span>
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    شماره گواهی بعدی:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.secretariatCounter}
                    onChange={(e) => setFormData({ ...formData, secretariatCounter: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    سال جدید دبیرخانه:
                  </label>
                  <input
                    type="text"
                    value={newYearInput}
                    onChange={(e) => setNewYearInput(e.target.value)}
                    placeholder="۱۴۰۴"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono font-bold"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleResetSecretariat}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg transition shadow-xs cursor-pointer"
                  >
                    بازنشانی به شماره ۱
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره تنظیمات سازمان</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ACCORDION 2: User Management, Roles & Passwords */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <button
          onClick={() => toggleAccordion('users')}
          className="w-full p-5 text-right font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-blue-600" />
            <span>مدیریت کاربران، نقش‌های چندگانه و بازنشانی رمز عبور</span>
          </div>
          {openAccordions['users'] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {openAccordions['users'] && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
            {/* Default Admin User Status Banner */}
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-blue-900 dark:text-blue-200 block">
                  وضعیت کاربر پیش‌فرض مدیریت (admin / admin):
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  {otherAdminsCount > 0
                    ? `تعداد ${toPersianDigits(otherAdminsCount)} کاربر دیگر دارای نقش مدیر هستند؛ لذا حساب admin غیرفعال است.`
                    : 'هیچ مدیر دیگری وجود ندارد؛ لذا حساب پیش‌فرض admin فعال و قابل استفاده است.'}
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  defaultAdmin?.isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {defaultAdmin?.isActive ? 'فعال (مجاز به ورود)' : 'غیرفعال خودکار'}
              </span>
            </div>

            {/* Custom Role Titles Editor */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                ویرایش عناوین نمایشی نقش‌ها:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">نقش مدیر:</label>
                  <input
                    type="text"
                    value={formData.roleTitles?.admin || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        roleTitles: { ...formData.roleTitles, admin: e.target.value },
                      })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">نقش اپراتور:</label>
                  <input
                    type="text"
                    value={formData.roleTitles?.operator || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        roleTitles: { ...formData.roleTitles, operator: e.target.value },
                      })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">نقش تأییدکننده:</label>
                  <input
                    type="text"
                    value={formData.roleTitles?.approver || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        roleTitles: { ...formData.roleTitles, approver: e.target.value },
                      })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">نقش پرسنل:</label>
                  <input
                    type="text"
                    value={formData.roleTitles?.employee || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        roleTitles: { ...formData.roleTitles, employee: e.target.value },
                      })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500">
                  <tr>
                    <th className="py-3 pr-3">نام و نام خانوادگی</th>
                    <th className="py-3">نام کاربری</th>
                    <th className="py-3">نقش‌های کاربر (چندگانه)</th>
                    <th className="py-3">کد پرسنلی</th>
                    <th className="py-3 pl-3 text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => {
                    const userRoles = u.roles || [u.role];

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                        <td className="py-3 pr-3 font-bold text-slate-900 dark:text-slate-100">
                          {u.fullName}
                          {u.username === 'admin' && (
                            <span className="mr-1.5 px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                              کاربر پایه
                            </span>
                          )}
                        </td>
                        <td className="py-3 font-mono text-slate-700 dark:text-slate-300">{u.username}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(['admin', 'operator', 'approver', 'employee'] as UserRole[]).map((r) => {
                              const isChecked = userRoles.includes(r);
                              const title = formData.roleTitles?.[r] || r;

                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => handleToggleUserRole(u, r)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                                    isChecked
                                      ? r === 'admin'
                                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                                        : r === 'operator'
                                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                                        : r === 'approver'
                                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                  }`}
                                  title={`کلیک برای افزودن/حذف نقش ${title}`}
                                >
                                  {title} {isChecked ? '✓' : '+'}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 font-mono text-slate-500">
                          {u.personnelCode ? toPersianDigits(u.personnelCode) : '-'}
                        </td>
                        <td className="py-3 pl-3 text-left">
                          <button
                            type="button"
                            onClick={() => handleResetPassword(u)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ml-auto cursor-pointer"
                            title="بازنشانی رمز به کد پرسنلی"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>ریست رمز</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-400">
                * نام کاربری پرسنل اکسل برابر با «کد پرسنلی» و رمز اولیه برابر با «کد پرسنلی» است.
              </span>
              <button
                type="button"
                onClick={() => setShowAddUserModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>افزودن کاربر جدید</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ACCORDION 3: Digital Stamps & Seal Images Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <button
          onClick={() => toggleAccordion('stamps')}
          className="w-full p-5 text-right font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Image className="w-5 h-5 text-blue-600" />
            <span>مدیریت تصاویر مهر و امضای دیجیتالی گزارشات</span>
          </div>
          {openAccordions['stamps'] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {openAccordions['stamps'] && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
            {/* Upload Form */}
            <form onSubmit={handleSaveStampImage} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>بارگذاری مهر یا امضای جدید (PNG شفاف / JPEG)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    عنوان تصویر:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: مهر رسمی مدیریت آموزش و پرورش"
                    value={newStampTitle}
                    onChange={(e) => setNewStampTitle(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">نوع تصویر:</label>
                  <select
                    value={newStampType}
                    onChange={(e) => setNewStampType(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <option value="signature">امضای دیجیتال مسئول</option>
                    <option value="stamp">مهر رسمی اداره</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">انتخاب فایل:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="w-full text-xs"
                  />
                </div>
              </div>

              {stampFileBase64 && (
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-slate-500 text-[11px]">پیش‌نمایش تصویر انتخابی:</span>
                  <img
                    src={stampFileBase64}
                    alt="پیش‌نمایش"
                    className="h-12 border border-slate-300 rounded p-1 bg-white object-contain"
                  />
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  ذخیره تصویر
                </button>
              </div>
            </form>

            {/* Existing images list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stampImages.length === 0 ? (
                <div className="sm:col-span-3 text-center py-6 text-slate-400">
                  هنوز هیچ تصویر مهر یا امضایی بارگذاری نشده است.
                </div>
              ) : (
                stampImages.map((img) => (
                  <div
                    key={img.id}
                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="w-12 h-12 object-contain border border-slate-200 rounded p-1 bg-white"
                      />
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-100 text-xs">{img.name}</strong>
                        <span className="text-[10px] text-slate-400">
                          {img.type === 'signature' ? 'امضای دیجیتال' : 'مهر رسمی'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteStampImage(img.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition cursor-pointer"
                      title="حذف تصویر"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ACCORDION 4: Certificate & Report Custom Titles */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <button
          onClick={() => toggleAccordion('certTitles')}
          className="w-full p-5 text-right font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>ویرایش عناوین انواع گزارشات و گواهی‌ها</span>
          </div>
          {openAccordions['certTitles'] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {openAccordions['certTitles'] && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
            <p className="text-slate-500">
              می‌توانید عناوین رسمی نمایش داده شده در فرم‌ها و سربرگ‌ها را مطابق ساختار سازمانی خود ویرایش کنید:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formData.certificateTypes?.map((cfg, index) => (
                <div
                  key={cfg.type}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    عنوان نوع {index + 1} ({cfg.type}):
                  </label>
                  <input
                    type="text"
                    value={cfg.title}
                    onChange={(e) => {
                      const updated = [...(formData.certificateTypes || [])];
                      updated[index] = { ...updated[index], title: e.target.value };
                      setFormData({ ...formData, certificateTypes: updated });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ذخیره عناوین
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ACCORDION 5: Cleanup Retired Personnel with No Active Certs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <button
          onClick={() => toggleAccordion('retiredCleanup')}
          className="w-full p-5 text-right font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <UserX className="w-5 h-5 text-amber-600" />
            <span>پاکسازی پرسنل بازنشسته بدون تعهد فعال ({toPersianDigits(retiredPersonnel.length)} مورد)</span>
          </div>
          {openAccordions['retiredCleanup'] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {openAccordions['retiredCleanup'] && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
            <p className="text-slate-500">
              پرسنل بازنشسته‌ای که هیچ گواهی صادرشده، در گردش یا در انتظار تأیید فعالی ندارند در این بخش لیست شده‌اند و مدیر ارشد می‌تواند آنها را همراه با کلیه سوابق از سیستم حذف کند:
            </p>

            {retiredPersonnel.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center text-slate-400">
                هیچ پرسنل بازنشسته‌ای جهت پاکسازی یافت نشد.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                {retiredPersonnel.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                  >
                    <div>
                      <strong className="text-slate-900 dark:text-slate-100 block">{p.fullName}</strong>
                      <span className="text-[11px] text-slate-400">
                        کد پرسنلی: {toPersianDigits(p.personnelCode)} | کد ملی: {toPersianDigits(p.nationalCode)} | {p.department}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRetired(p.id, p.fullName)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف کامل فرد و سوابق</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ACCORDION 6: Wipe System Data & Restore Defaults (2-Step Confirmation) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-2xs overflow-hidden">
        <button
          onClick={() => toggleAccordion('wipe')}
          className="w-full p-5 text-right font-bold text-sm text-rose-700 dark:text-rose-400 flex items-center justify-between hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
            <span>پاکسازی کامل پایگاه داده یا بازنشانی مقادیر پیش‌فرض (عملیات حساس)</span>
          </div>
          {openAccordions['wipe'] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {openAccordions['wipe'] && (
          <div className="p-6 border-t border-rose-100 dark:border-rose-900/50 space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-800 dark:text-rose-300 leading-relaxed">
              <strong>هشدار مدیریتی:</strong> این امکان فراهم شده تا در صورت نیاز سیستم به صورت دو مرحله‌ای کاملاً خالی شود و یا مقادیر اولیه نمونه بازنشانی گردند. در صورت خالی کردن سیستم، تنها کاربر پیش‌فرض admin باقی خواهد ماند.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setWipeActionType('empty');
                  setIsWipeModalOpen(true);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>خالی کردن کامل سامانه (Wipe All)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWipeActionType('defaults');
                  setIsWipeModalOpen(true);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>بازنشانی به مقادیر پیش‌فرض نمونه</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Blazor .NET 10 Visual Studio & Local Server Package */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 border border-blue-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-700/60 text-blue-200">
                <Code2 className="w-5 h-5" />
              </span>
              <h3 className="font-black text-base text-white">
                پکیج سورس‌کد Blazor و دات‌نت ۱۰ (.NET 10) برای ویژوال استودیو
              </h3>
            </div>
            <p className="text-xs text-blue-200/90 leading-relaxed pr-9">
              شامل فایل Solution کامل، پروژه‌های C# با EF Core، بارکد استاندارد و QR کد، تمپلیت‌های چاپ دو تکه افقی و اسکریپت‌های اجرای سرور محلی (Kestrel / IIS).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                try {
                  const byteCharacters = atob(BLAZOR_ZIP_BASE64);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  const blob = new Blob([byteArray], { type: 'application/zip' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'EducationCertPortal-Blazor-Net10.zip';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setTimeout(() => URL.revokeObjectURL(url), 1500);
                } catch {
                  window.open('/downloads/EducationCertPortal-Blazor-Net10.zip', '_blank');
                }
              }}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-5 py-3 rounded-xl text-xs transition shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>دانلود مستقیم فایل ZIP (سالم و تست‌شده)</span>
            </button>

            <button
              onClick={() => {
                const directUrl = `${window.location.origin}/downloads/EducationCertPortal-Blazor-Net10.zip`;
                navigator.clipboard.writeText(directUrl);
                alert('لینک مستقیم دانلود کپی شد. می‌توانید آن را در یک تب جدید مرورگر باز کنید.');
              }}
              title="کپی لینک مستقیم جهت باز کردن در تب جدید"
              className="p-3 bg-blue-800/80 hover:bg-blue-700 text-blue-200 rounded-xl transition cursor-pointer"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reset Password Modal Result */}
      {resetModalResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full mx-auto flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              رمز عبور با موفقیت بازنشانی شد
            </h3>
            <p className="text-xs text-slate-500">{resetModalResult.message}</p>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-sm font-bold text-blue-700 dark:text-blue-300">
              رمز جدید: {resetModalResult.pass}
            </div>
            <button
              onClick={() => setResetModalResult(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold transition"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {/* 2-Step Wipe Modal */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-rose-300 dark:border-rose-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-rose-900 dark:text-rose-200 text-base">
                  تأیید دو مرحله‌ای پاکسازی داده‌ها
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  {wipeActionType === 'empty'
                    ? 'پاکسازی کامل تمامی گواهی‌ها، پرسنل و کاربران'
                    : 'بازنشانی مقادیر پیش‌فرض اولیه سامانه'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              جهت تایید قطعی و انجام این عملیات غیرقابل بازگشت، عبارت <strong className="text-rose-600">«حذف کامل»</strong> را در کادر زیر تایپ کنید:
            </p>

            <input
              type="text"
              placeholder="حذف کامل"
              value={wipeConfirmText}
              onChange={(e) => setWipeConfirmText(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-rose-300 bg-rose-50/50 dark:bg-slate-800 text-rose-900 dark:text-slate-100 font-bold text-center text-sm"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsWipeModalOpen(false);
                  setWipeConfirmText('');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleExecuteWipe}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
              >
                اجرای پاکسازی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">تعریف کاربر جدید سامانه</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} noValidate className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  نام و نام خانوادگی:
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">نام کاربری:</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  کد پرسنلی (اختیاری):
                </label>
                <input
                  type="text"
                  value={newPersonnelCode}
                  onChange={(e) => setNewPersonnelCode(e.target.value)}
                  placeholder="جهت اتصال به پرونده پرسنلی"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  نقش‌های کاربر:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['admin', 'operator', 'approver', 'employee'] as UserRole[]).map((r) => (
                    <label
                      key={r}
                      className="flex items-center gap-2 p-2 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={newRoles.includes(r)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRoles([...newRoles, r]);
                          } else {
                            if (newRoles.length > 1) {
                              setNewRoles(newRoles.filter((x) => x !== r));
                            }
                          }
                        }}
                      />
                      <span>{formData.roleTitles?.[r] || r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-bold"
                >
                  ایجاد کاربر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
