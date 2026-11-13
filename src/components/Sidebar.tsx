import React from 'react';
import { SystemUser, UserRole } from '../types';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  ClipboardCheck,
  Archive,
  FileCode,
  Database,
  Settings,
  UserCheck,
  SearchCheck,
  QrCode,
  X,
  ShieldCheck,
  LogIn,
  LogOut,
  User,
  ArrowRightLeft,
} from 'lucide-react';

interface SidebarProps {
  currentUser: SystemUser;
  activeView: string;
  onSelectView: (view: string) => void;
  pendingApprovalsCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  onUserChange?: (user: SystemUser) => void;
  allUsers?: SystemUser[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeView,
  onSelectView,
  pendingApprovalsCount,
  isMobileOpen,
  onCloseMobile,
  onOpenLogin,
  onLogout,
  onUserChange,
  allUsers = [],
}) => {
  const isGuest = currentUser.username === 'guest';
  const userRoles: UserRole[] = currentUser.roles && currentUser.roles.length > 0
    ? currentUser.roles
    : [currentUser.role];

  const menuItems = [
    {
      id: 'dashboard',
      label: 'داشبورد و آمار کلی',
      icon: LayoutDashboard,
      roles: ['admin', 'operator', 'approver', 'employee'] as UserRole[],
    },
    {
      id: 'employee_portal',
      label: 'میز کار پرسنلی من',
      icon: UserCheck,
      roles: ['employee', 'admin', 'operator', 'approver'] as UserRole[],
      badge: 'پورتال فردی',
    },
    {
      id: 'personnel',
      label: 'مدیریت پرسنل و فایل ماهانه',
      icon: Users,
      roles: ['admin', 'operator'] as UserRole[],
    },
    {
      id: 'issue_certificate',
      label: 'صدور گواهی و ضمانت‌نامه',
      icon: FileCheck,
      roles: ['admin', 'operator'] as UserRole[],
    },
    {
      id: 'inquiry',
      label: 'استعلام بانکی (مخصوص اپراتور)',
      icon: SearchCheck,
      roles: ['admin', 'operator'] as UserRole[],
      badge: 'نامه استعلام',
    },
    {
      id: 'verification',
      label: 'اصالت‌سنجی و استعلام گواهی',
      icon: QrCode,
      roles: ['admin', 'operator', 'approver', 'employee'] as UserRole[],
      badge: 'بارکد / QR',
    },
    {
      id: 'approvals',
      label: 'کارتابل تأییدکنندگان',
      icon: ClipboardCheck,
      roles: ['admin', 'approver'] as UserRole[],
      count: pendingApprovalsCount,
    },
    {
      id: 'archive',
      label: 'بایگانی، چاپ و تسویه',
      icon: Archive,
      roles: ['admin', 'operator', 'approver'] as UserRole[],
    },
    {
      id: 'templates',
      label: 'طراحی و ویرایش تمپلیت‌ها',
      icon: FileCode,
      roles: ['admin'] as UserRole[],
    },
    {
      id: 'migration',
      label: 'انتقال دیتای قبلی (Migration)',
      icon: Database,
      roles: ['admin'] as UserRole[],
      badge: 'SQL Server',
    },
    {
      id: 'settings',
      label: 'تنظیمات و مدیریت کاربران',
      icon: Settings,
      roles: ['admin'] as UserRole[],
    },
  ];

  // User has access if any of their roles matches any of the item's authorized roles
  const visibleItems = menuItems.filter((item) =>
    item.roles.some((r) => userRoles.includes(r))
  );

  const handleItemClick = (id: string) => {
    onSelectView(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4">
      <div className="space-y-1">
        {/* Mobile Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800 md:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
              منوی دسترسی سامانه
            </span>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Profile & Auth Card (Prominently displayed for mobile & desktop) */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 mb-3 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
              isGuest ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200' : 'theme-btn-primary'
            }`}>
              {isGuest ? <User className="w-4 h-4" /> : (currentUser.fullName ? currentUser.fullName.slice(0, 1) : 'ک')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                  {currentUser.fullName}
                </h4>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                  isGuest ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                }`}>
                  {isGuest ? 'مهمان' : 'فعال'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                {isGuest ? 'خارج از سامانه' : currentUser.personnelCode ? `کد پرسنلی: ${currentUser.personnelCode}` : currentUser.username}
              </p>
            </div>
          </div>

          {/* Quick Login / Logout Action Buttons */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-700/80">
            {isGuest ? (
              <button
                onClick={() => {
                  if (onOpenLogin) onOpenLogin();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>ورود به حساب کاربری</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (onOpenLogin) onOpenLogin();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold transition cursor-pointer"
                  title="ورود با نام کاربری دیگر"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>تغییر کاربر</span>
                </button>

                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold transition cursor-pointer"
                    title="خروج از حساب کاربری"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>خروج</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Fast switch user dropdown */}
          {allUsers.length > 0 && onUserChange && (
            <div className="pt-0.5">
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const selected = allUsers.find((u) => u.id === e.target.value);
                  if (selected) {
                    onUserChange(selected);
                    if (onCloseMobile) onCloseMobile();
                  }
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 cursor-pointer truncate"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    سوییچ: {u.fullName} ({u.roles?.join(', ') || u.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="px-3 py-1.5 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          بخش‌های سامانه
        </div>

        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'theme-btn-primary shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      isActive ? 'bg-white text-blue-700' : 'bg-amber-500 text-white animate-pulse'
                    }`}
                  >
                    {item.count}
                  </span>
                )}

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shrink-0 hidden md:block min-h-[calc(100vh-4rem)] no-print transition-colors">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl z-10 border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
