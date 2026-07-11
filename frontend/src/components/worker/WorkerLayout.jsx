// src/components/worker/WorkerLayout.jsx

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import WorkerSidebar from './WorkerSidebar';
import WorkerHeader from './WorkerHeader';

function WorkerLayout() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('en');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('homelyserv_user');

    if (!userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));

    const savedLang =
      localStorage.getItem('homelyserv_language') || 'en';

    setLanguage(savedLang);

    const sidebar =
      JSON.parse(
        localStorage.getItem('sidebar_collapsed') || 'false'
      );

    setSidebarCollapsed(sidebar);
  }, [navigate]);

  const toggleSidebar = () => {
    const value = !sidebarCollapsed;
    setSidebarCollapsed(value);
    localStorage.setItem(
      'sidebar_collapsed',
      JSON.stringify(value)
    );
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('homelyserv_user');
    localStorage.removeItem('homelyserv_token');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <WorkerSidebar
        user={user}
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
          user={user}
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