import React, { useState } from 'react';
import {
  FontSize,
  SystemSettings,
  SystemUser,
  ThemeColor,
  ThemeMode,
  UserPreferences,
  UserRole,
} from '../types';
import { getTodayShamsiDetailed, toPersianDigits } from '../utils/persianUtils';
import { StorageManager } from '../utils/storage';
import {
  Calendar,
  Coins,
  ShieldAlert,
  Palette,
  Moon,
  Sun,
  Type,
  X,
  Check,
  Menu,
  ShieldCheck,
  LogIn,
  LogOut,
  User,
  KeyRound,
  Building2,
} from 'lucide-react';

interface NavbarProps {
  currentUser: SystemUser;
  onUserChange: (user: SystemUser) => void;
  onLogout?: () => void;
  showLoginModalExternal?: boolean;
  onCloseLoginModalExternal?: () => void;
  onOpenLoginModal?: () => void;
  settings: SystemSettings;
  onSettingsUpdate: (settings: SystemSettings) => void;
  preferences: UserPreferences;
  onPreferencesChange: (pref: UserPreferences) => void;
  activeView: string;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onUserChange,
  onLogout,
  showLoginModalExternal,
  onCloseLoginModalExternal,
  onOpenLoginModal,
  settings,
  onSettingsUpdate,
  preferences,
  onPreferencesChange,
  activeView: _activeView,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLoginModalInternal, setShowLoginModalInternal] = useState(false);
  const [showUserAccountModal, setShowUserAccountModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const isLoginOpen = showLoginModalInternal || Boolean(showLoginModalExternal);
  const isGuest = currentUser.username === 'guest';

  const closeLogin = () => {
    setShowLoginModalInternal(false);
    if (onCloseLoginModalExternal) onCloseLoginModalExternal();
  };

  const openLogin = () => {
    setShowLoginModalInternal(true);
    if (onOpenLoginModal) onOpenLoginModal();
  };

  const allUsers = StorageManager.getUsers();
  const todayText = getTodayShamsiDetailed();
  const isLocked = StorageManager.isIssuanceLocked();

  const toggleCurrency = () => {
    const nextCurrency: 'rial' | 'toman' = settings.currency === 'rial' ? 'toman' : 'rial';
    const updated: SystemSettings = { ...settings, currency: nextCurrency };
    StorageManager.saveSettings(updated);
    onSettingsUpdate(updated);
  };

  const toggleThemeMode = () => {
    const nextMode: ThemeMode = preferences.mode === 'dark' ? 'light' : 'dark';
    const updated = { ...preferences, mode: nextMode };
    StorageManager.saveUserPreferences(updated);
    onPreferencesChange(updated);
  };

  const handleColorChange = (color: ThemeColor) => {
    const updated = { ...preferences, color };
    StorageManager.saveUserPreferences(updated);
    onPreferencesChange(updated);
  };

  const handleFontSizeChange = (fontSize: FontSize) => {
    const updated = { ...preferences, fontSize };
    StorageManager.saveUserPreferences(updated);
    onPreferencesChange(updated);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername.trim()) {
      setLoginError('لطفاً نام کاربری یا کد پرسنلی را وارد نمایید.');
      return;
    }

    if (!loginPassword.trim()) {
      setLoginError('لطفاً کلمه عبور را وارد نمایید.');
      return;
    }

    const target = allUsers.find(
      (u) =>
        u.username.toLowerCase() === loginUsername.trim().toLowerCase() ||
        (u.personnelCode && u.personnelCode === loginUsername.trim())
    );

    if (!target) {
      setLoginError('کاربری با این نام کاربری یا کد پرسنلی یافت نشد.');
      return;
    }

    if (!target.isActive) {
      setLoginError('این حساب کاربری غیرفعال یا مسدود است.');
      return;
    }

    // Check password (default password equals personnelCode or admin)
    const expectedPassword = target.password || target.personnelCode || 'admin';
    if (loginPassword.trim() !== expectedPassword) {
      setLoginError('کلمه عبور وارد شده صحیح نیست.');
      return;
    }

    StorageManager.setCurrentUser(target);
    onUserChange(target);
    closeLogin();
    setShowUserAccountModal(false);
    setLoginUsername('');
    setLoginPassword('');
  };

  const getRoleTitle = (role: UserRole) => {
    return settings.roleTitles?.[role] || {
      admin: 'مدیر سامانه',
      operator: 'اپراتور صدور',
      approver: 'مقام تأییدکننده',
      employee: 'پرسنل سازمانی',
    }[role];
  };

  const colorThemes: { id: ThemeColor; label: string; bgClass: string }[] = [
    { id: 'blue', label: 'آبی سازمانی', bgClass: 'bg-blue-600' },
    { id: 'emerald', label: 'سبز زمردی', bgClass: 'bg-emerald-600' },
    { id: 'indigo', label: 'نیلی شاهانه', bgClass: 'bg-indigo-600' },
    { id: 'amber', label: 'زرین اداری', bgClass: 'bg-amber-600' },
    { id: 'rose', label: 'لعل و سرخ', bgClass: 'bg-rose-600' },
    { id: 'slate', label: 'سربی اداری', bgClass: 'bg-slate-700' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs no-print transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="منوی ناوبری"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="w-9 h-9 rounded-xl theme-btn-primary text-white flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">
                سامانه صدور گواهی و ضمانت‌نامه
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              {settings.orgTitle} • {settings.managingUnit}
            </p>
          </div>
        </div>

        {/* Center Information */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl font-medium">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>امروز: {todayText}</span>
          </div>

          {/* Currency Toggle */}
          <button
            onClick={toggleCurrency}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300/80 dark:border-slate-700 px-3 py-1.5 rounded-xl font-bold transition text-slate-800 dark:text-slate-100 cursor-pointer"
            title="تغییر واحد پولی نمایش مبالغ"
          >
            <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>واحد:</span>
            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-2xs font-black">
              {settings.currency === 'rial' ? 'ریال' : 'تومان'}
            </span>
          </button>

          {isLocked && (
            <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-xl font-bold animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>قفل موقت صدور</span>
            </div>
          )}
        </div>

        {/* Right Tools: Theme & Role Switcher */}
        <div className="flex items-center gap-2">
          {/* Quick Dark/Light Mode toggle */}
          <button
            onClick={toggleThemeMode}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            title={preferences.mode === 'dark' ? 'حالت روز (روشن)' : 'حالت شب (تیره)'}
          >
            {preferences.mode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Theme Palette & Font Size Customizer */}
          <button
            onClick={() => setShowThemeModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
            title="شخصی‌سازی تم رنگ و اندازه قلم"
          >
            <Palette className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">ظاهر سایت</span>
          </button>

          {/* Desktop User Selector */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
            <select
              value={currentUser.id}
              onChange={(e) => {
                const selected = allUsers.find((u) => u.id === e.target.value);
                if (selected) {
                  StorageManager.setCurrentUser(selected);
                  onUserChange(selected);
                }
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs max-w-[150px] sm:max-w-[200px] truncate"
            >
              {allUsers.map((u) => {
                const roleLabels = (u.roles || [u.role]).map((r) => getRoleTitle(r)).join('، ');
                return (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({roleLabels})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Desktop Login Button */}
          <button
            onClick={openLogin}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
            title="ورود با نام کاربری و رمز عبور"
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-600" />
            <span>ورود کاربر</span>
          </button>

          {/* Desktop Logout Button */}
          {!isGuest && onLogout && (
            <button
              onClick={onLogout}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold transition cursor-pointer"
              title="خروج از حساب کاربری"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>خروج</span>
            </button>
          )}

          {/* MOBILE: Prominent Login & Account Button */}
          {isGuest ? (
            <button
              onClick={openLogin}
              className="flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
              title="ورود به سامانه"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>ورود</span>
            </button>
          ) : (
            <button
              onClick={() => setShowUserAccountModal(true)}
              className="flex sm:hidden items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
              title="مشاهده حساب کاربری، ورود و خروج"
            >
              <div className="w-7 h-7 rounded-lg theme-btn-primary flex items-center justify-center text-xs font-black shadow-xs">
                {currentUser.fullName ? currentUser.fullName.slice(0, 1) : 'ک'}
              </div>
              <span className="text-[11px] font-bold max-w-[70px] truncate pl-1">
                {currentUser.fullName ? currentUser.fullName.split(' ')[0] : 'کاربر'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* MOBILE User Account & Auth Modal */}
      {showUserAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  حساب کاربری فعال
                </h3>
              </div>
              <button
                onClick={() => setShowUserAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl theme-btn-primary flex items-center justify-center text-sm font-black shadow-xs">
                  {currentUser.fullName ? currentUser.fullName.slice(0, 1) : 'ک'}
                </div>
                <div>
                  <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">
                    {currentUser.fullName}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {currentUser.personnelCode ? `کد پرسنلی: ${currentUser.personnelCode}` : `نام کاربری: ${currentUser.username}`}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">نقش‌های سازمانی:</span>
                <span className="font-bold text-blue-700 dark:text-blue-300 text-[11px]">
                  {(currentUser.roles || [currentUser.role]).map((r) => getRoleTitle(r)).join('، ')}
                </span>
              </div>
            </div>

            {/* Quick User Switcher */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                تغییر سریع کاربر (تست و مدیریت):
              </label>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const selected = allUsers.find((u) => u.id === e.target.value);
                  if (selected) {
                    StorageManager.setCurrentUser(selected);
                    onUserChange(selected);
                    setShowUserAccountModal(false);
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({(u.roles || [u.role]).map((r) => getRoleTitle(r)).join('، ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Action buttons: Login with other account & Logout */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setShowUserAccountModal(false);
                  openLogin();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold transition hover:bg-blue-100 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>ورود با نام کاربری و رمز دیگر</span>
              </button>

              {onLogout && (
                <button
                  onClick={() => {
                    setShowUserAccountModal(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>خروج از حساب کاربری (Logout)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  ورود سازمانی به سامانه
                </h3>
              </div>
              <button
                onClick={closeLogin}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              نام کاربری پرسنل «کد پرسنلی» و رمز اولیه برابر با کد پرسنلی است. کاربر مدیر پیش‌فرض: <code className="font-mono text-blue-600">admin</code>
            </p>

            <form onSubmit={handleLoginSubmit} noValidate className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  نام کاربری یا کد پرسنلی:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="کد پرسنلی یا admin"
                    className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  کلمه عبور:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="کلمه عبور"
                    className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-medium">
                  {loginError}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeLogin}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  ورود به حساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Theme & Font Size Customizer Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  شخصی‌سازی ظاهر، تم و اندازه قلم سایت
                </h3>
              </div>
              <button
                onClick={() => setShowThemeModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Light / Dark Mode selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                سبک نمایشی (روشن / تیره):
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...preferences, mode: 'light' as ThemeMode };
                    StorageManager.saveUserPreferences(updated);
                    onPreferencesChange(updated);
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold transition cursor-pointer ${
                    preferences.mode === 'light'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>سبک روشن (Light)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...preferences, mode: 'dark' as ThemeMode };
                    StorageManager.saveUserPreferences(updated);
                    onPreferencesChange(updated);
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold transition cursor-pointer ${
                    preferences.mode === 'dark'
                      ? 'border-blue-500 bg-slate-800 text-blue-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Moon className="w-4 h-4 text-blue-400" />
                  <span>سبک تیره (Dark)</span>
                </button>
              </div>
            </div>

            {/* Color Palette Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                رنگ‌بندی اصلی سامانه:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {colorThemes.map((c) => {
                  const isSelected = preferences.color === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleColorChange(c.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-400 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${c.bgClass} shrink-0`} />
                      <span className="truncate">{c.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-blue-600 mr-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-slate-500" />
                <span>اندازه قلم نمایشی سامانه (فونت وزیر):</span>
              </label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {(
                  [
                    { id: 'sm', label: 'ریز' },
                    { id: 'base', label: 'استاندارد' },
                    { id: 'lg', label: 'بزرگ' },
                    { id: 'xl', label: 'خیلی بزرگ' },
                  ] as { id: FontSize; label: string }[]
                ).map((size) => {
                  const isSelected = preferences.fontSize === size.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => handleFontSizeChange(size.id)}
                      className={`py-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {size.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowThemeModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                تأیید و بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
