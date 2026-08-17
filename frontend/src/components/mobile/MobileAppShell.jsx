import React from 'react';
import { useDashboard } from '../layout/DashboardContext';
import MobileHeader from './MobileHeader';
import MobileDrawerNav from './MobileDrawerNav';
import MobileBottomNav from './MobileBottomNav';

const MobileAppShell = ({ children, title }) => {
  const dashboard = useDashboard();
  const authUser = dashboard.authUser;

  if (!authUser) return null;

  return (
    <div className="lg:hidden min-h-dvh flex flex-col bg-gray-50 dark:bg-gray-900">
      <MobileHeader title={title} />
      <main className="flex-1 pt-14 pb-16 overflow-x-clip">
        {children}
      </main>
      <MobileBottomNav />
      <MobileDrawerNav />
    </div>
  );
};

export default MobileAppShell;