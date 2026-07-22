// src/components/worker/WorkerLayout.jsx

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import WorkerSidebar from './WorkerSidebar';
import WorkerHeader from './WorkerHeader';
import useAuthStore from '../../store/authStore';

function WorkerLayout() {
  const navigate = useNavigate();
  
  // Get authenticated user from authStore
  const authUser = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  const [language, setLanguage] = useState('en');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    // Load language preference
    const savedLang = localStorage.getItem('homelyserv_language') || 'en';
    setLanguage(savedLang);

    // Load sidebar preference
    const sidebar = JSON.parse(localStorage.getItem('sidebar_collapsed') || 'false');
    setSidebarCollapsed(sidebar);
  }, [navigate, isAuthenticated, authUser]);

  const toggleSidebar = () => {
    const value = !sidebarCollapsed;
    setSidebarCollapsed(value);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(value));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Show loading state
  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <WorkerSidebar
        user={authUser}
        language={language}
        sidebarCollapsed={sidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        toggleSidebar={toggleSidebar}
        toggleMobileMenu={toggleMobileMenu}
        handleLogout={handleLogout}
      />

      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <WorkerHeader
          user={authUser}
          language={language}
          toggleMobileMenu={toggleMobileMenu}
        />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default WorkerLayout;