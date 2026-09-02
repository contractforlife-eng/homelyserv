// src/components/AdminSidebar.jsx - ADMIN SIDEBAR
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import SidebarBadge from './SidebarBadge';
import useSidebarCounters from '../hooks/useSidebarCounters';
import { isCurrentRootAdmin } from '../utils/rootAdminIdentity';
import {
  Home,
  Users,
  MessageCircle,
  Settings,
  User as UserIcon,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Globe,
  X,
  Shield,
  CreditCard,
  FileText,
  BarChart3,
  Briefcase,
  Landmark,
  Receipt,
  Headphones
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AdminSidebar = ({
  language,
  sidebarCollapsed,
  toggleSidebar,
  mobileMenuOpen,
  toggleMobileMenu,
  user,
  authUser,
  handleLogout,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  // Unified sidebar activity counters (single shared request)
  const counters = useSidebarCounters();

  // Maps sidebar menu item ids to unified counter keys
  const badgeCounterKeys = {
    payments: 'payments',
    complaints: 'complaints',
    messages: 'messages',
    hires: 'hires',
  };

  const menuItems = [
    { id: 'dashboard', label: t('adminSidebar.dashboard'), icon: Home, path: '/admin' },
    { id: 'users', label: t('adminSidebar.users'), icon: Users, path: '/admin/users' },
    { id: 'registration-geography', label: t('adminSidebar.registrationGeography'), icon: Globe, path: '/admin/registration-geography' },
    { id: 'payments', label: t('adminSidebar.payments'), icon: CreditCard, path: '/admin/payments' },
    { id: 'financial-center', label: t('adminSidebar.financialCenter'), icon: Landmark, path: '/admin/financial-center' },
    { id: 'complaints', label: t('adminSidebar.complaints'), icon: FileText, path: '/admin/complaints' },
    { id: 'reports', label: t('adminSidebar.reports'), icon: BarChart3, path: '/admin/reports' },
    { id: 'messages', label: t('adminSidebar.messages'), icon: MessageCircle, path: '/admin/messages' },
    { id: 'live-support', label: t('publicSupport.liveSupport'), icon: Headphones, path: '/admin/live-support' },
    { id: 'hires', label: t('adminSidebar.hires'), icon: Briefcase, path: '/admin/hires' },
    { id: 'profile', label: t('adminSidebar.profile'), icon: UserIcon, path: '/admin/profile' },
    { id: 'settings', label: t('adminSidebar.settings'), icon: Settings, path: '/admin/settings' },
  ];

  // Root-admin-only navigation. The Accounting ledger is restricted to the
  // platform Root Admin identity (see rootAdminIdentity). Normal admins must
  // not see this link; backend authorization remains authoritative.
  if (isCurrentRootAdmin()) {
    const financialCenterIdx = menuItems.findIndex((item) => item.id === 'financial-center');
    if (financialCenterIdx !== -1) {
      menuItems.splice(financialCenterIdx + 1, 0, {
        id: 'accounting',
        label: t('adminSidebar.accounting'),
        icon: Receipt,
        path: '/admin/accounting',
      });
    }
  }

  const activeUser = authUser || user;

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getProfileImage = () => {
    if (activeUser?.profileImage) {
      return activeUser.profileImage;
    }
    return null;
  };

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-white dark:bg-[#1a1a1a] border-r border-yellow-500/20 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-yellow-500/20">
          {!sidebarCollapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="relative">
                <Shield size={28} className="text-yellow-500" />
                <Home size={14} className="text-yellow-300 absolute -bottom-1 -right-1" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-lg">{t('adminSidebar.admin')}</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/admin" className="relative mx-auto">
              <Shield size={28} className="text-yellow-500" />
              <Home size={14} className="text-yellow-300 absolute -bottom-1 -right-1" />
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors hidden lg:block text-gray-400 hover:text-yellow-500"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={toggleMobileMenu}
            className="p-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors lg:hidden text-gray-400 hover:text-yellow-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`p-4 border-b border-yellow-500/20 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              {getProfileImage() ? (
                <img
                  src={getProfileImage()}
                  alt={activeUser?.fullName || t('adminSidebar.admin')}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon size={20} className="text-black" />
              )}
            </div>
            {!sidebarCollapsed && activeUser && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{activeUser.fullName || t('adminSidebar.admin')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activeUser.email || 'admin@homelyserv.com'}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100dvh-180px)]">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t('adminSidebar.overview')}
            </div>
          )}
          {sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
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
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-500'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <span className="relative inline-flex">
                <item.icon size={20} className={isActive(item.path) ? 'text-black' : 'text-gray-400 group-hover:text-yellow-500'} />
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
                <div className={`${badgeCount > 0 ? 'ml-2' : 'ml-auto'} w-1.5 h-8 bg-yellow-500 rounded-full`}></div>
              )}
            </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-yellow-500/20">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-500 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t('adminSidebar.logout')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t('adminSidebar.logout')}
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
