// Dashboard Context - Shares layout state between DashboardLayout and DashboardHeader
import React, { createContext, useContext } from 'react';

const DashboardContext = createContext({
  language: 'en',
  toggleMobileMenu: () => {},
  toggleSidebar: () => {},
  toggleLanguage: () => {},
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  authUser: null,
  handleLogout: () => {},
});

// Hook to access dashboard layout state from anywhere within DashboardLayout
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardLayout');
  }
  return context;
};

export default DashboardContext;