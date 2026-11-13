import React, { useState, useEffect } from 'react';
import {
  Certificate,
  FontSize,
  Personnel,
  SystemSettings,
  SystemUser,
  ThemeColor,
  UserPreferences,
  UserRole,
} from './types';
import { StorageManager } from './utils/storage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { OfficialPrintModal } from './components/OfficialPrintModal';
import { DashboardView } from './views/DashboardView';
import { PersonnelView } from './views/PersonnelView';
import { IssueCertificateView } from './views/IssueCertificateView';
import { BankInquiryView } from './views/BankInquiryView';
import { VerificationView } from './views/VerificationView';
import { ApprovalsView } from './views/ApprovalsView';
import { CertificatesArchiveView } from './views/CertificatesArchiveView';
import { TemplateEditorView } from './views/TemplateEditorView';
import { MigrationView } from './views/MigrationView';
import { SettingsAndUsersView } from './views/SettingsAndUsersView';
import { EmployeePortalView } from './views/EmployeePortalView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<SystemUser>(StorageManager.getCurrentUser());
  const [settings, setSettings] = useState<SystemSettings>(StorageManager.getSettings());
  const [personnelList, setPersonnelList] = useState<Personnel[]>(StorageManager.getPersonnel());
  const [certificates, setCertificates] = useState<Certificate[]>(StorageManager.getCertificates());
  const [preferences, setPreferences] = useState<UserPreferences>(StorageManager.getUserPreferences());

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [printableCert, setPrintableCert] = useState<Certificate | null>(null);
  const [preSelectedPersonnel, setPreSelectedPersonnel] = useState<Personnel | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check URL query parameters for direct verification link (?verify=... or ?code=...)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const verifyCode = urlParams.get('verify') || urlParams.get('code');
      if (verifyCode) {
        setActiveView('verification');
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Apply dark mode, theme color & font size to root HTML element
  useEffect(() => {
    // 1. Dark / Light mode toggle
    if (preferences.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Data theme attribute for color palette
    document.documentElement.setAttribute('data-theme', preferences.color);

    // 3. Dynamic root font size scaling
    const sizeMap: Record<FontSize, string> = {
      sm: '13.5px',
      base: '15px',
      lg: '17px',
      xl: '19px',
    };
    document.documentElement.style.fontSize = sizeMap[preferences.fontSize] || '15px';
  }, [preferences]);

  // Sync state whenever data updates
  const handleRefresh = () => {
    setPersonnelList(StorageManager.getPersonnel());
    setCertificates(StorageManager.getCertificates());
    setSettings(StorageManager.getSettings());
  };

  const handleUserChange = (user: SystemUser) => {
    setCurrentUser(user);
    const roles = user.roles || [user.role];
    // If only employee role, navigate to employee portal
    if (roles.length === 1 && roles.includes('employee')) {
      setActiveView('employee_portal');
    }
  };

  const handleSelectPersonnelForCert = (personnel: Personnel) => {
    setPreSelectedPersonnel(personnel);
    setActiveView('issue_certificate');
  };

  const handleCertificateIssued = (cert: Certificate) => {
    handleRefresh();
    // Open print preview immediately if already approved/issued
    if (cert.status === 'approved' || cert.status === 'issued') {
      setPrintableCert(cert);
    } else {
      setActiveView('archive');
    }
  };

  const pendingApprovalsCount = certificates.filter((c) => c.status === 'pending').length;

  const printablePersonnel = printableCert
    ? personnelList.find((p) => p.id === printableCert.personnelId) || personnelList[0]
    : null;

  // Font size mapping
  const getFontSizeClass = (size: FontSize) => {
    switch (size) {
      case 'sm':
        return 'text-[13px]';
      case 'base':
        return 'text-[15px]';
      case 'lg':
        return 'text-[17px]';
      case 'xl':
        return 'text-[19px]';
      default:
        return 'text-[15px]';
    }
  };

  // Color theme container accent
  const getColorThemeClass = (color: ThemeColor) => {
    switch (color) {
      case 'emerald':
        return 'theme-emerald';
      case 'indigo':
        return 'theme-indigo';
      case 'amber':
        return 'theme-amber';
      case 'rose':
        return 'theme-rose';
      case 'slate':
        return 'theme-slate';
      case 'blue':
      default:
        return 'theme-blue';
    }
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogout = () => {
    const guestUser: SystemUser = {
      id: 'usr_guest',
      username: 'guest',
      fullName: 'کاربر مهمان',
      role: 'employee',
      roles: [],
      isActive: true,
      createdAt: '۱۴۰۳/۰۱/۰۱',
    };
    StorageManager.setCurrentUser(guestUser);
    setCurrentUser(guestUser);
    setActiveView('verification');
  };

  return (
    <div
      className={`min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 ${getFontSizeClass(
        preferences.fontSize
      )} ${getColorThemeClass(preferences.color)}`}
      dir="rtl"
    >
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onUserChange={handleUserChange}
        onLogout={handleLogout}
        showLoginModalExternal={isLoginModalOpen}
        onCloseLoginModalExternal={() => setIsLoginModalOpen(false)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        settings={settings}
        onSettingsUpdate={setSettings}
        preferences={preferences}
        onPreferencesChange={setPreferences}
        activeView={activeView}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          currentUser={currentUser}
          activeView={activeView}
          onSelectView={setActiveView}
          pendingApprovalsCount={pendingApprovalsCount}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onUserChange={handleUserChange}
          allUsers={StorageManager.getUsers()}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              personnelList={personnelList}
              certificates={certificates}
              settings={settings}
              currentUser={currentUser}
              onNavigate={setActiveView}
              onViewCertificate={(cert) => setPrintableCert(cert)}
            />
          )}

          {activeView === 'personnel' && (
            <PersonnelView
              personnelList={personnelList}
              settings={settings}
              currentUser={currentUser}
              onRefresh={handleRefresh}
              onSelectPersonnelForCert={handleSelectPersonnelForCert}
            />
          )}

          {activeView === 'issue_certificate' && (
            <IssueCertificateView
              personnelList={personnelList}
              settings={settings}
              currentUser={currentUser}
              preSelectedPersonnel={preSelectedPersonnel}
              onSuccess={handleCertificateIssued}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'inquiry' && (
            <BankInquiryView
              personnelList={personnelList}
              certificates={certificates}
              settings={settings}
              currentUser={currentUser}
              onRefresh={handleRefresh}
              onViewCertificate={(cert) => setPrintableCert(cert)}
            />
          )}

          {activeView === 'verification' && (
            <VerificationView
              certificates={certificates}
              personnelList={personnelList}
              settings={settings}
              onPrintCertificate={(cert) => setPrintableCert(cert)}
            />
          )}

          {activeView === 'approvals' && (
            <ApprovalsView
              certificates={certificates}
              personnelList={personnelList}
              settings={settings}
              currentUser={currentUser}
              onRefresh={handleRefresh}
              onViewCertificate={(cert) => setPrintableCert(cert)}
            />
          )}

          {activeView === 'archive' && (
            <CertificatesArchiveView
              certificates={certificates}
              personnelList={personnelList}
              settings={settings}
              currentUser={currentUser}
              onRefresh={handleRefresh}
              onViewCertificate={(cert) => setPrintableCert(cert)}
            />
          )}

          {activeView === 'templates' && (
            <TemplateEditorView settings={settings} onRefresh={handleRefresh} />
          )}

          {activeView === 'migration' && (
            <MigrationView
              personnelList={personnelList}
              onRefresh={handleRefresh}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'settings' && (
            <SettingsAndUsersView
              settings={settings}
              onSettingsUpdate={setSettings}
              currentUser={currentUser}
              onRefresh={handleRefresh}
            />
          )}

          {activeView === 'employee_portal' && (
            <EmployeePortalView
              currentUser={currentUser}
              personnelList={personnelList}
              certificates={certificates}
              settings={settings}
              onRefresh={handleRefresh}
              onViewCertificate={(cert) => setPrintableCert(cert)}
              onNavigateToIssue={() => setActiveView('issue_certificate')}
            />
          )}
        </main>
      </div>

      {/* Official A4 Print Modal */}
      {printableCert && printablePersonnel && (
        <OfficialPrintModal
          certificate={printableCert}
          personnel={printablePersonnel}
          settings={settings}
          onClose={() => setPrintableCert(null)}
        />
      )}
    </div>
  );
}
