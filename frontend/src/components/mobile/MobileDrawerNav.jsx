import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../layout/DashboardContext';
import { getDisplayName, getRoleLabel } from '../../utils/userDisplay';
import { UserDisplayName } from '../users';
import { getCanonicalNavItems } from '../../config/navigationConfig';
import { X, LogOut } from 'lucide-react';

const MobileDrawerNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const dashboard = useDashboard();
  const { authUser, handleLogout, mobileMenuOpen, toggleMobileMenu, premiumStatus } = dashboard;
  const isPremium = premiumStatus?.known === true && premiumStatus.isPremium === true;

  const role = (authUser?.role || '').toUpperCase();
  const isWorker = role === 'WORKER';
  const isEmployer = role === 'EMPLOYER';
  const isDoctor = role === 'DOCTOR';
  const isTeacher = role === 'TEACHER';
  const isStudent = role === 'STUDENT';
  const isAdmin = role === 'ADMIN';
  const isSupport = role === 'SUPPORT';
  const isSupportHelper = role === 'SUPPORT_HELPER';

  const getProfileImage = () => {
    if (authUser?.profileImage) {
      return authUser.profileImage;
    }
    return null;
  };

  const canonicalItems = getCanonicalNavItems(role, t, { authUser });

  const isActive = (item) => {
    if (location.pathname === item.path) return true;
    if (item.matchPrefixPath && location.pathname.startsWith(item.matchPrefixPath)) return true;
    if (item.matchPrefix && location.pathname.startsWith(`${item.path}/`)) return true;
    return false;
  };

  const getThemeClasses = () => {
    if (isWorker) {
      return {
        activeBg: 'bg-red-50 dark:bg-red-900/20',
        activeText: 'text-red-600 dark:text-red-400',
        hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/20',
        avatarBg: 'bg-gradient-to-br from-red-500 to-red-600',
        logoutText: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
      };
    }
    if (isEmployer) {
      return {
        activeBg: 'bg-teal-50 dark:bg-teal-900/20',
        activeText: 'text-teal-600 dark:text-teal-400',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-900/20',
        avatarBg: 'bg-gradient-to-br from-teal-500 to-teal-600',
        logoutText: 'text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20',
      };
    }
    if (isAdmin) {
      return {
        activeBg: 'bg-yellow-50 dark:bg-yellow-900/20',
        activeText: 'text-yellow-600 dark:text-yellow-400',
        hoverBg: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
        avatarBg: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
        logoutText: 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
      };
    }
    if (isDoctor || isTeacher || isStudent) {
      return {
        activeBg: 'bg-red-50 dark:bg-red-900/20',
        activeText: 'text-red-600 dark:text-red-400',
        hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/20',
        avatarBg: 'bg-gradient-to-br from-red-500 to-red-600',
        logoutText: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
      };
    }
    if (isSupport) {
      return {
        activeBg: 'bg-green-50 dark:bg-green-900/20',
        activeText: 'text-green-600 dark:text-green-400',
        hoverBg: 'hover:bg-green-50 dark:hover:bg-green-900/20',
        avatarBg: 'bg-gradient-to-br from-green-500 to-green-600',
        logoutText: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
      };
    }
    if (isSupportHelper) {
      return {
        activeBg: 'bg-red-50 dark:bg-red-900/20',
        activeText: 'text-red-600 dark:text-red-400',
        hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/20',
        avatarBg: 'bg-gradient-to-br from-red-500 to-red-600',
        logoutText: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
      };
    }
    return {
      activeBg: 'bg-gray-100 dark:bg-gray-700',
      activeText: 'text-gray-800 dark:text-white',
      hoverBg: 'hover:bg-gray-100 dark:hover:bg-gray-700',
      avatarBg: 'bg-gray-500',
      logoutText: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
    };
  };

  const theme = getThemeClasses();

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <div className={`fixed top-0 left-0 rtl:left-auto rtl:right-0 h-full w-72 bg-white dark:bg-[#273449] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
      }`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden ${theme.avatarBg}`}>
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
          {canonicalItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.id || item.path}
                to={item.path}
                onClick={toggleMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  active ? `${theme.activeBg} ${theme.activeText}` : `text-gray-700 dark:text-gray-200 ${theme.hoverBg}`
                }`}
              >
                <span className={active ? '' : 'text-gray-500 dark:text-gray-400'}>
                  <Icon size={20} />
                </span>
                <span className="text-base font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              toggleMobileMenu();
              handleLogout();
            }}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition ${theme.logoutText}`}
          >
            <LogOut size={20} />
            <span className="text-base font-medium">
              {isSupport ? t('supportNavigation.logout') : isSupportHelper ? t('supHelpNavigation.logout') : t('workerSidebar.logout')}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileDrawerNav;
