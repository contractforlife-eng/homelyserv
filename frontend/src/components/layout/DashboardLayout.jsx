// Dashboard Layout Component - Reusable layout for all dashboard pages
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import { applyBackendSubscription } from '../../utils/subscriptionService';
import { fetchSubscriptionStatus } from '../../services/paymentService';
import {
  applyCanonicalPremiumState,
  createInitialPremiumState,
  createUnknownPremiumState,
  preservePremiumStateForUser,
} from '../../utils/premiumSessionState';
import EmployerSidebar from '../employer/EmployerSidebar';
import WorkerSidebar from '../worker/WorkerSidebar';
import AdminSidebar from '../AdminSidebar';
import DashboardContext from './DashboardContext';
import VerificationBanner from '../VerificationBanner';
import LegalFooter from '../common/LegalFooter';
import MobileHeader from '../mobile/MobileHeader';
import MobileDrawerNav from '../mobile/MobileDrawerNav';
import MobileBottomNav from '../mobile/MobileBottomNav';

const DashboardLayout = ({ 
  children, 
  requiredRole,
  headerProps = {}
}) => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { logout: authLogout } = useAuthStore();
  const { t, i18n } = useTranslation();
  // Language is synced with the global i18n instance (single source of truth).
  // i18n initializes from the same localStorage key via its language detector.
  const [language, setLanguage] = useState(() => i18n.language || localStorage.getItem('homelyserv_language') || 'en');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState(() => createInitialPremiumState(authUser?.id, authUser));

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

  // Authentication check
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (requiredRole && authUser.role !== requiredRole) {
      navigate('/login');
      return;
    }
  }, [authUser, isAuthenticated, authLoading, navigate, requiredRole]);

  // Central Premium state synchronization.
  // Backend Subscription is the single source of truth. This effect reflects
  // the authoritative subscription status into localStorage and authStore so
  // that Sidebar, DashboardHeader, and all dashboard pages agree.
  useEffect(() => {
    if (!authUser?.id) {
      setPremiumStatus(createUnknownPremiumState());
      return;
    }
    const role = (authUser.role || '').toUpperCase();
    if (role !== 'WORKER' && role !== 'EMPLOYER') {
      setPremiumStatus(createUnknownPremiumState(authUser.id));
      return;
    }

    let cancelled = false;
    const userId = String(authUser.id);
    setPremiumStatus((current) => preservePremiumStateForUser(current, userId, authUser));
    const syncSubscription = async () => {
      try {
        const data = await fetchSubscriptionStatus();
        if (cancelled || !data?.success) return;
        setPremiumStatus(applyCanonicalPremiumState(userId, data));
        applyBackendSubscription(userId, authUser.email, data.subscription);
      } catch (error) {
        console.warn('Could not sync subscription status from backend:', error);
      }
    };

    syncSubscription();
    return () => { cancelled = true; };
  }, [authUser?.id, authUser?.email, authUser?.role]);

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

  // Determine which sidebar to render based on user role
  const SidebarComponent = authUser?.role === 'EMPLOYER' ? EmployerSidebar : authUser?.role === 'ADMIN' ? AdminSidebar : WorkerSidebar;
  const isWorkerEmployer = authUser?.role === 'WORKER' || authUser?.role === 'EMPLOYER';
  const isAdmin = authUser?.role === 'ADMIN';

  // Provide layout state to children (DashboardHeader and page content).
  // All hooks must be called unconditionally BEFORE any conditional return so
  // the hook order stays identical across loading/auth render transitions.
  const contextValue = useMemo(() => ({
    language,
    toggleMobileMenu,
    toggleSidebar,
    sidebarCollapsed,
    mobileMenuOpen,
    authUser,
    premiumStatus,
    handleLogout,
  }), [language, sidebarCollapsed, mobileMenuOpen, authUser, premiumStatus]);

  // Only block during initial unresolved authentication
  // Once user is loaded, never show full-page loader during SPA navigation
  if (authLoading && !authUser) {
    return (
       <div className="min-h-dvh bg-gray-50 dark:bg-[#182235] lg:dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="min-h-dvh flex bg-gray-50 dark:bg-[#182235] lg:dark:bg-gray-900">
        <SidebarComponent
          language={language}
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          mobileMenuOpen={mobileMenuOpen}
          toggleMobileMenu={toggleMobileMenu}
          authUser={authUser}
          user={authUser}
          handleLogout={handleLogout}
        />

        {isWorkerEmployer || isAdmin ? <MobileHeader /> : null}
        {isWorkerEmployer && <MobileDrawerNav />}
        {isWorkerEmployer && <MobileBottomNav />}

        <main className={`flex-1 transition-all duration-300 w-full max-w-full min-w-0 overflow-x-clip ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } ml-0 ${isWorkerEmployer ? 'lg:pt-0 pt-14 lg:pb-0 pb-16' : isAdmin ? 'lg:pt-0 pt-14' : ''}`}>
          <VerificationBanner />
          {children}
          <LegalFooter className="px-4 md:px-6" />
        </main>
      </div>
    </DashboardContext.Provider>
  );
};

export default DashboardLayout;
