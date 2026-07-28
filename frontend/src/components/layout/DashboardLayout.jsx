// Dashboard Layout Component - Reusable layout for all dashboard pages
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import EmployerSidebar from '../employer/EmployerSidebar';
import WorkerSidebar from '../worker/WorkerSidebar';
import AdminSidebar from '../AdminSidebar';
import DashboardContext from './DashboardContext';

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

  const [language, setLanguage] = useState('en');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load saved language and sidebar state
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }

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

  // Update document direction for RTL
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  // Determine which sidebar to render based on user role
  const SidebarComponent = authUser.role === 'EMPLOYER' ? EmployerSidebar : authUser.role === 'ADMIN' ? AdminSidebar : WorkerSidebar;

  // Provide layout state to children (DashboardHeader and page content)
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
      <div className={`min-h-screen flex ${authUser.role === 'ADMIN' ? 'bg-[#0a0a0a]' : 'bg-gray-50 dark:bg-gray-900'}`}>
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

        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } ml-0`}>
          {children}
        </main>
      </div>
    </DashboardContext.Provider>
  );
};

export default DashboardLayout;