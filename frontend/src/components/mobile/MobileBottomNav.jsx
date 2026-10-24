import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../layout/DashboardContext';
import { Home, Briefcase, Search, MessageCircle, User } from 'lucide-react';

const MobileBottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const dashboard = useDashboard();
  const authUser = dashboard.authUser;
  const role = (authUser?.role || '').toUpperCase();
  const isWorker = role === 'WORKER';
  const isEmployer = role === 'EMPLOYER';

  if (!isWorker && !isEmployer) return null;

  const workerItems = [
    { to: '/worker-dashboard', icon: Home, label: t('workerSidebar.dashboard') },
    { to: '/worker-jobs', icon: Search, label: t('workerSidebar.findJobs') },
    { to: '/worker-messages', icon: MessageCircle, label: t('workerSidebar.messages') },
    { to: '/worker-profile', icon: User, label: t('workerSidebar.myProfile') },
  ];

  const employerItems = [
    { to: '/employer-dashboard', icon: Home, label: t('employerSidebar.dashboard') },
    { to: '/my-hires', icon: Briefcase, label: t('employerSidebar.myHires') },
    { to: '/employer-messages', icon: MessageCircle, label: t('employerSidebar.messages') },
    { to: '/employer-search', icon: Search, label: t('employerSidebar.searchWorkers') },
    { to: '/employer-profile', icon: User, label: t('employerSidebar.myProfile') },
  ];

  const items = isWorker ? workerItems : employerItems;

  const isActive = (path) => location.pathname === path;

  const activeColor = isWorker ? 'text-red-600' : 'text-teal-600';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#273449] border-t border-gray-200 dark:border-gray-700 z-40 lg:hidden">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center py-2 px-2 min-h-[44px] min-w-[44px] transition-colors ${
                active ? activeColor : 'text-gray-400 dark:text-gray-300'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
