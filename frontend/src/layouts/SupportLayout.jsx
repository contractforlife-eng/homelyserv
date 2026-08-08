// Support Layout Component - Dedicated layout for support staff
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import SupportSidebar from '../components/SupportSidebar';
import DashboardContext from '../components/layout/DashboardContext';
import DashboardHeader from '../components/layout/DashboardHeader';
import VerificationBanner from '../components/VerificationBanner';
import { changeLanguageGlobal } from '../i18n';

const SupportLayout = ({ 
  children, 
  requiredRole = 'SUPPORT',
  headerTitle = 'Support Dashboard'
}) => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { logout: authLogout } = useAuthStore();

  const { i18n } = useTranslation();
  // Language is synced with the global i18n instance (single source of truth).
  // i18n initializes from the same localStorage key via its language detector.
  const [language, setLanguage] = useState(() => i18n.language || localStorage.getItem('homelyserv_language') || 'en');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keep context language in sync whenever i18n changes (from any page)
  useEffect(() => {
    const onLanguageChanged = (lng) => setLanguage(lng);
    i18n.on('languageChanged', onLanguageChanged);
    return () => i18n.off('languageChanged', onLanguageChanged);
  }, [i18n]);

  // Load saved sidebar state
  useEffect(() => {
    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, []);

  // Authentication check - redirect to login if not authenticated or wrong role
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    // Only SUPPORT and ADMIN can access support area
    const userRole = authUser.role?.toUpperCase();
    if (userRole !== 'SUPPORT' && userRole !== 'ADMIN') {
      navigate('/login');
      return;
    }
  }, [authUser, isAuthenticated, authLoading, navigate, requiredRole]);

  // Update document direction for RTL
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    // Goes through the global i18n helper so every component updates at once
    changeLanguageGlobal(language === 'ar' ? 'en' : 'ar');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
      return newState;
    });
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  if (authLoading || !authUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Provide layout state to children
  const contextValue = useMemo(() => ({
    language,
    toggleLanguage,
    toggleMobileMenu,
    toggleSidebar,
    sidebarCollapsed,
    mobileMenuOpen,
    authUser,
    handleLogout,
  }), [language, sidebarCollapsed, mobileMenuOpen, authUser]);

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
        <SupportSidebar
          language={language}
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          mobileMenuOpen={mobileMenuOpen}
          toggleMobileMenu={toggleMobileMenu}
          authUser={authUser}
          user={authUser}
          handleLogout={handleLogout}
        />

        <main className={`flex-1 transition-all duration-300 w-full max-w-full min-w-0 overflow-x-clip ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } ml-0`}>
          <VerificationBanner />
          <DashboardHeader
            title={headerTitle}
            notificationUserId={authUser?.id || authUser?.email}
          />
          {children}
        </main>
      </div>
    </DashboardContext.Provider>
  );
};

export default SupportLayout;