// src/components/worker/WorkerSidebar.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { isUserPremium } from '../../utils/subscriptionService';
import SidebarBadge from '../SidebarBadge';
import useSidebarCounters from '../../hooks/useSidebarCounters';
import {
  Home,
  User,
  Briefcase,
  Search,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Crown,
  X,
  Shield,
  AlertTriangle,
  CreditCard,
  ClipboardList
} from 'lucide-react';

const WorkerSidebar = ({ 
  language, 
  sidebarCollapsed, 
  toggleSidebar, 
  mobileMenuOpen, 
  toggleMobileMenu, 
  authUser, 
  handleLogout 
}) => {
  const location = useLocation();
  // Unified sidebar activity counters (single shared request)
  const counters = useSidebarCounters();

  // Maps sidebar menu item ids to unified counter keys
  const badgeCounterKeys = {
    offers: 'offers',
    messages: 'messages',
    complaints: 'complaints',
    payment: 'payments',
  };

  const { t } = useTranslation();

  const menuItems = [
    { id: 'dashboard', label: t('workerSidebar.dashboard'), icon: Home, path: '/worker-dashboard' },
    { id: 'findJobs', label: t('workerSidebar.findJobs'), icon: Search, path: '/worker-jobs' },
    { id: 'myApplications', label: t('workerSidebar.myApplications'), icon: ClipboardList, path: '/worker-applications' },
    { id: 'profile', label: t('workerSidebar.myProfile'), icon: User, path: '/worker-profile' },
    { id: 'offers', label: t('workerSidebar.myOffers'), icon: Briefcase, path: '/worker/offers' },
    { id: 'messages', label: t('workerSidebar.messages'), icon: MessageCircle, path: '/worker-messages' },
    { id: 'complaints', label: t('workerSidebar.complaints'), icon: AlertTriangle, path: '/worker-complaints' },
    { id: 'payment', label: t('workerSidebar.payment'), icon: CreditCard, path: '/worker-payment' },
    { id: 'premium', label: t('workerSidebar.premium'), icon: Crown, path: '/subscription' },
  ];

  const isActive = (path) => {
    // Keep "Find Jobs" highlighted while viewing a job's detail page
    if (path === '/worker-jobs' && location.pathname.startsWith('/job/')) {
      return true;
    }
    return location.pathname === path;
  };

  const getProfileImage = () => {
    if (authUser?.profileImage) {
      return authUser.profileImage;
    }
    return null;
  };

  const userIsPremium = () => {
    const userId = authUser?.id || authUser?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const isPremium = userIsPremium();

  return (
    <>
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <aside 
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <Link to="/worker-dashboard" className="flex items-center gap-2">
              <div className="relative">
                <Shield size={28} className="text-red-500" />
                <Home size={14} className="text-red-300 absolute -bottom-1 -right-1" />
              </div>
              <span className="font-bold text-gray-800 dark:text-white text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/worker-dashboard" className="relative mx-auto">
              <Shield size={28} className="text-red-500" />
              <Home size={14} className="text-red-300 absolute -bottom-1 -right-1" />
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden lg:block text-gray-600 dark:text-gray-300"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={toggleMobileMenu}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden text-gray-600 dark:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            {isPremium ? (
              <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-[#F5C542] to-[#D4A820] shadow-[0_0_8px_rgba(245,197,66,0.70),0_0_16px_rgba(245,197,66,0.35)] flex-shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                  {getProfileImage() ? (
                    <img 
                      src={getProfileImage()} 
                      alt={authUser?.fullName || t('workerSidebar.worker')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-white" />
                  )}
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {getProfileImage() ? (
                  <img 
                    src={getProfileImage()} 
                    alt={authUser?.fullName || t('workerSidebar.worker')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-white" />
                )}
              </div>
            )}
            {!sidebarCollapsed && authUser && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 dark:text-white truncate">{authUser.fullName || t('workerSidebar.worker')}</p>
                  {isPremium && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 whitespace-nowrap">
                      <Crown size={10} className="text-yellow-500" />
                      {t('workerSidebar.premium')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{authUser.email || 'worker@homelyserv.com'}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100dvh-180px)]">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {t('workerSidebar.overview')}
            </div>
          )}
          {sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">
              •
            </div>
          )}

          {menuItems.map((item) => {
            const badgeCount = counters[badgeCounterKeys[item.id]] || 0;
            return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => {
                if (mobileMenuOpen) toggleMobileMenu();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive(item.path)
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <span className="relative inline-flex">
                <item.icon size={20} className={isActive(item.path) ? 'text-red-600 dark:text-red-400' : ''} />
                {sidebarCollapsed && badgeCount > 0 && (
                  <SidebarBadge count={badgeCount} className="absolute -top-2 -right-2.5" />
                )}
              </span>
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {!sidebarCollapsed && badgeCount > 0 && (
                <SidebarBadge count={badgeCount} className="ml-auto" />
              )}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !sidebarCollapsed && (
                <div className={`${badgeCount > 0 ? 'ml-2' : 'ml-auto'} w-1.5 h-8 bg-red-600 rounded-full`}></div>
              )}
              {item.id === 'premium' && !isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto">
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full font-medium">{t('workerSidebar.new')}</span>
                </div>
              )}
            </Link>
            );
          })}

          <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>

          <Link
            to="/worker-settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <Settings size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t('workerSidebar.settings')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t('workerSidebar.settings')}
              </div>
            )}
          </Link>
          <Link
            to="/help"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <HelpCircle size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t('workerSidebar.help')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t('workerSidebar.help')}
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t('workerSidebar.logout')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t('workerSidebar.logout')}
              </div>
            )}
          </button>
        </nav>
      </aside>
    </>
  );
};

export default WorkerSidebar;
