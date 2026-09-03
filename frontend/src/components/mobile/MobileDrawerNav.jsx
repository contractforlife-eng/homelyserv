import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../layout/DashboardContext';
import { getDisplayName, getRoleLabel } from '../../utils/userDisplay';
import { UserDisplayName } from '../users';
import {
  X,
  LogOut,
  Home,
  Search,
  FileText,
  User,
  Star,
  MessageCircle,
  CreditCard,
  Settings,
  HelpCircle,
  PlusCircle,
  Briefcase,
  Users,
  Headphones
} from 'lucide-react';

const MobileDrawerNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const dashboard = useDashboard();
  const { authUser, handleLogout, mobileMenuOpen, toggleMobileMenu, premiumStatus } = dashboard;
  const isPremium = premiumStatus?.known === true && premiumStatus.isPremium === true;

  const role = (authUser?.role || '').toUpperCase();
  const isWorker = role === 'WORKER';
  const isEmployer = role === 'EMPLOYER';
  const isSupport = role === 'SUPPORT';
  const isSupportHelper = role === 'SUPPORT_HELPER';

  const getProfileImage = () => {
    if (authUser?.profileImage) {
      return authUser.profileImage;
    }
    return null;
  };

  const workerItems = [
    { to: '/worker-dashboard', icon: Home, label: t('workerSidebar.dashboard') },
    { to: '/worker-jobs', icon: Search, label: t('workerSidebar.findJobs') },
    { to: '/worker-applications', icon: FileText, label: t('workerSidebar.myApplications') },
    { to: '/worker-profile', icon: User, label: t('workerSidebar.myProfile') },
    { to: '/worker/offers', icon: Star, label: t('workerSidebar.myOffers') },
    { to: '/worker-messages', icon: MessageCircle, label: t('workerSidebar.messages') },
    { to: '/worker-complaints', icon: FileText, label: t('workerSidebar.complaints') },
    { to: '/worker-payment', icon: CreditCard, label: t('workerSidebar.payment') },
    { to: '/subscription', icon: Star, label: t('workerSidebar.premium') },
    { to: '/worker-settings', icon: Settings, label: t('workerSidebar.settings') },
    { to: '/help', icon: HelpCircle, label: t('workerSidebar.help') },
  ];

  const employerItems = [
    { to: '/employer-dashboard', icon: Home, label: t('employerSidebar.dashboard') },
    { to: '/employer-post-job', icon: PlusCircle, label: t('employerSidebar.postJob') },
    { to: '/employer-jobs', icon: Briefcase, label: t('employerSidebar.myJobs') },
    { to: '/employer-profile', icon: User, label: t('employerSidebar.myProfile') },
    { to: '/my-hires', icon: Users, label: t('employerSidebar.myHires') },
    { to: '/employer-search', icon: Search, label: t('employerSidebar.searchWorkers') },
    { to: '/employer-messages', icon: MessageCircle, label: t('employerSidebar.messages') },
    { to: '/employer-complaints', icon: FileText, label: t('employerSidebar.complaints') },
    { to: '/employer-payments', icon: CreditCard, label: t('employerSidebar.payment') },
    { to: '/subscription', icon: Star, label: t('employerSidebar.premium') },
    { to: '/employer-settings', icon: Settings, label: t('employerSidebar.settings') },
    { to: '/help', icon: HelpCircle, label: t('employerSidebar.help') },
  ];

  const supportItems = [
    { to: '/support-dashboard', icon: Home, label: t('supportNavigation.dashboard') },
    { to: '/support-users', icon: Users, label: t('supportNavigation.users') },
    { to: '/support-complaints', icon: FileText, label: t('supportNavigation.complaints') },
    { to: '/support-messages', icon: MessageCircle, label: t('supportNavigation.messages') },
    { to: '/support-live-support', icon: Headphones, label: t('publicSupport.liveSupport') },
    { to: '/support-profile', icon: User, label: t('supportNavigation.profile') },
    { to: '/support-settings', icon: Settings, label: t('supportNavigation.settings') },
  ];

  const supHelpItems = [
    { to: '/sup-help', icon: Home, label: t('supHelpNavigation.dashboard') },
    { to: '/sup-help/users', icon: Users, label: t('supHelpNavigation.users') || t('supportNavigation.users') },
    { to: '/sup-help/messages', icon: MessageCircle, label: t('supportNavigation.messages') },
    { to: '/sup-help/complaints', icon: FileText, label: t('supportNavigation.complaints') },
    { to: '/sup-help/live-support', icon: Headphones, label: t('publicSupport.liveSupport') },
  ];

  const items = isWorker ? workerItems : isEmployer ? employerItems : isSupport ? supportItems : isSupportHelper ? supHelpItems : [];

  const isActive = (path) => {
    if (location.pathname === path) return true;
    if (path === '/worker-jobs' && location.pathname.startsWith('/job/')) return true;
    if (path === '/employer-jobs' && location.pathname.startsWith('/job/')) return true;
    return false;
  };

  const activeBg = isWorker ? 'bg-red-50 dark:bg-red-900/20' : isEmployer ? 'bg-teal-50 dark:bg-teal-900/20' : isSupport ? 'bg-green-50 dark:bg-green-900/20' : isSupportHelper ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-700';
  const activeText = isWorker ? 'text-red-600 dark:text-red-400' : isEmployer ? 'text-teal-600 dark:text-teal-400' : isSupport ? 'text-green-600 dark:text-green-400' : isSupportHelper ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white';
  const hoverBg = isWorker ? 'hover:bg-red-50 dark:hover:bg-red-900/20' : isEmployer ? 'hover:bg-teal-50 dark:hover:bg-teal-900/20' : isSupport ? 'hover:bg-green-50 dark:hover:bg-green-900/20' : isSupportHelper ? 'hover:bg-red-50 dark:hover:bg-red-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700';

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <div className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-[#273449] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden ${
              isWorker ? 'bg-gradient-to-br from-red-500 to-red-600' : isEmployer ? 'bg-gradient-to-br from-teal-500 to-teal-600' : isSupport ? 'bg-gradient-to-br from-green-500 to-green-600' : isSupportHelper ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gray-500'
            }`}>
              {getProfileImage() ? (
                <img 
                  src={getProfileImage()} 
                  alt={getDisplayName(authUser) || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                getDisplayName(authUser)?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div>
              <UserDisplayName user={authUser} isPremium={isPremium} />
              <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleLabel(authUser?.role)}</p>
            </div>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={22} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 180px)' }}>
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={toggleMobileMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive(item.to) ? `${activeBg} ${activeText}` : `text-gray-700 dark:text-gray-200 ${hoverBg}`
              }`}
            >
              <span className={isActive(item.to) ? '' : 'text-gray-500 dark:text-gray-400'}>
                <item.icon size={20} />
              </span>
              <span className="text-base font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              toggleMobileMenu();
              handleLogout();
            }}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition ${
              isWorker ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' :
              isEmployer ? 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700' :
              isSupport ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' :
              isSupportHelper ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' :
              'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <LogOut size={20} />
            <span className="text-base font-medium">{isSupport ? t('supportNavigation.logout') : isSupportHelper ? t('supHelpNavigation.logout') : t('workerSidebar.logout')}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileDrawerNav;
