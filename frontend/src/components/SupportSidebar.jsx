// src/components/SupportSidebar.jsx - SUPPORT SIDEBAR
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import SidebarBadge from './SidebarBadge';
import useSidebarCounters from '../hooks/useSidebarCounters';
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
  FileText
  ,Headphones
} from 'lucide-react';

const SupportSidebar = ({
  language,
  sidebarCollapsed,
  toggleSidebar,
  mobileMenuOpen,
  toggleMobileMenu,
  user,
  authUser,
  handleLogout,
  role,
  menuItems: propMenuItems,
}) => {
  const { t: i18nT } = useTranslation();
  const location = useLocation();
  const counters = useSidebarCounters();

  const badgeCounterKeys = {
    complaints: 'complaints',
    messages: 'messages',
  };

  const t = i18nT('supportNavigation', { returnObjects: true }) || {};
  const activeRole = role || (authUser || user)?.role?.toUpperCase();

  const defaultMenuItems = activeRole === 'SUPPORT_HELPER' ? [
    { id: 'dashboard', label: i18nT('supHelpNavigation.dashboard') || t.dashboard, icon: Home, path: '/sup-help' },
    { id: 'users', label: t.users, icon: Users, path: '/sup-help/users' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/sup-help/messages' },
    { id: 'complaints', label: t.complaints, icon: FileText, path: '/sup-help/complaints' },
    { id: 'live-support', label: i18nT('publicSupport.liveSupport'), icon: Headphones, path: '/sup-help/live-support' },
    { id: 'settings', label: t.settings, icon: Settings, path: '/sup-help/settings' },
  ] : [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/support-dashboard' },
    { id: 'users', label: t.users, icon: Users, path: '/support-users' },
    { id: 'complaints', label: t.complaints, icon: FileText, path: '/support-complaints' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/support-messages' },
    { id: 'live-support', label: i18nT('publicSupport.liveSupport'), icon: Headphones, path: '/support-live-support' },
    { id: 'registration-geography', label: t.registrationGeography || i18nT('adminSidebar.registrationGeography'), icon: Globe, path: '/support-registration-geography' },
    { id: 'profile', label: t.profile, icon: UserIcon, path: '/support-profile' },
    { id: 'settings', label: t.settings, icon: Settings, path: '/support-settings' },
  ];

  const menuItems = propMenuItems || defaultMenuItems;

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
        className={`fixed top-0 left-0 h-full bg-white dark:bg-[#1a1a2e] border-r border-green-500/20 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-green-500/20">
          {!sidebarCollapsed && (
            <Link to={activeRole === 'SUPPORT_HELPER' ? '/sup-help' : '/support-dashboard'} className="flex items-center gap-2">
              <div className="relative">
                <Shield size={28} className={activeRole === 'SUPPORT_HELPER' ? 'text-red-500' : 'text-green-500'} />
                <Home size={14} className={activeRole === 'SUPPORT_HELPER' ? 'text-red-300 absolute -bottom-1 -right-1' : 'text-green-300 absolute -bottom-1 -right-1'} />
              </div>
              <span className={`font-bold text-gray-900 dark:text-white text-lg ${activeRole === 'SUPPORT_HELPER' ? 'text-red-600' : ''}`}>
                {activeRole === 'SUPPORT_HELPER' ? i18nT('supHelpNavigation.support') : t.support}
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to={activeRole === 'SUPPORT_HELPER' ? '/sup-help' : '/support-dashboard'} className="relative mx-auto">
              <Shield size={28} className={activeRole === 'SUPPORT_HELPER' ? 'text-red-500' : 'text-green-500'} />
              <Home size={14} className={activeRole === 'SUPPORT_HELPER' ? 'text-red-300 absolute -bottom-1 -right-1' : 'text-green-300 absolute -bottom-1 -right-1'} />
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? t.expandSidebar : t.collapseSidebar}
            className="p-1.5 rounded-lg hover:bg-green-500/10 transition-colors hidden lg:block text-gray-400 hover:text-green-500"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={toggleMobileMenu}
            aria-label={t.closeMenu}
            className="p-1.5 rounded-lg hover:bg-green-500/10 transition-colors lg:hidden text-gray-400 hover:text-green-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`p-4 border-b border-green-500/20 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden relative ${
              activeRole === 'SUPPORT_HELPER'
                ? 'bg-gradient-to-br from-red-500 to-red-600'
                : 'bg-gradient-to-br from-green-500 to-green-600'
            }`}>
              {getProfileImage() ? (
                <img
                  src={getProfileImage()}
                  alt={activeUser?.fullName || t.support}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon size={20} className="text-white" />
              )}
            </div>
            {!sidebarCollapsed && activeUser && (
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${activeRole === 'SUPPORT_HELPER' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  {activeUser.fullName || t.support}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activeUser.email || 'support@homelyserv.com'}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100dvh-180px)]">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t.overview}
            </div>
          )}
          {sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
              •
            </div>
          )}

          {menuItems.map((item) => {
            const badgeCount = counters[badgeCounterKeys[item.id]] || 0;
            const activeColor = activeRole === 'SUPPORT_HELPER' ? 'bg-red-500 text-white' : 'bg-green-500 text-white';
            const hoverColor = activeRole === 'SUPPORT_HELPER' ? 'hover:bg-red-500/10 hover:text-red-500' : 'hover:bg-green-500/10 hover:text-green-500';
            const iconActiveColor = activeRole === 'SUPPORT_HELPER' ? 'text-white' : 'text-white';
            const iconHoverColor = activeRole === 'SUPPORT_HELPER' ? 'group-hover:text-red-500' : 'group-hover:text-green-500';
            const defaultIconColor = activeRole === 'SUPPORT_HELPER' ? 'text-red-400' : 'text-gray-400';
            const activeIndicator = activeRole === 'SUPPORT_HELPER' ? 'bg-red-500 rounded-full' : 'bg-green-500 rounded-full';
            return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => {
                if (mobileMenuOpen) toggleMobileMenu();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive(item.path)
                  ? activeColor
                  : `text-gray-600 dark:text-gray-300 ${hoverColor}`
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <span className="relative inline-flex">
                <item.icon size={20} className={isActive(item.path) ? iconActiveColor : `${defaultIconColor} ${iconHoverColor}`} />
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
                <div className={`${badgeCount > 0 ? 'ml-2' : 'ml-auto'} w-1.5 h-8 ${activeIndicator}`}></div>
              )}
            </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-green-500/20">
          <button
            onClick={handleLogout}
            aria-label={t.logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-500 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t.logout}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t.logout}
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default SupportSidebar;
