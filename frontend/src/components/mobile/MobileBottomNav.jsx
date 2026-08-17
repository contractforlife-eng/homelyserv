import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDashboard } from '../layout/DashboardContext';
import { Home, Briefcase, Search, MessageCircle, User } from 'lucide-react';

const MobileBottomNav = () => {
  const location = useLocation();
  const dashboard = useDashboard();
  const authUser = dashboard.authUser;
  const role = (authUser?.role || '').toUpperCase();
  const isWorker = role === 'WORKER';
  const isEmployer = role === 'EMPLOYER';

  const workerItems = [
    { to: '/worker-dashboard', icon: Home, label: 'Dashboard' },
    { to: '/worker-jobs', icon: Search, label: 'Jobs' },
    { to: '/worker-messages', icon: MessageCircle, label: 'Messages' },
    { to: '/worker-profile', icon: User, label: 'Profile' },
  ];

  const employerItems = [
    { to: '/employer-dashboard', icon: Home, label: 'Dashboard' },
    { to: '/my-hires', icon: Briefcase, label: 'Hires' },
    { to: '/employer-messages', icon: MessageCircle, label: 'Messages' },
    { to: '/employer-search', icon: Search, label: 'Search' },
    { to: '/employer-profile', icon: User, label: 'Profile' },
  ];

  const items = isWorker ? workerItems : isEmployer ? employerItems : [];

  if (!isWorker && !isEmployer) return null;

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