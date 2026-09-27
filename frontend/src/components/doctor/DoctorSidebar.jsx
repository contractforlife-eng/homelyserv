// frontend/src/components/doctor/DoctorSidebar.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { UserDisplayName } from '../users';
import {
  Home,
  User,
  Calendar,
  Users,
  Clock,
  Building2,
  Stethoscope,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

const DoctorSidebar = ({
  sidebarCollapsed,
  toggleSidebar,
  mobileMenuOpen,
  toggleMobileMenu,
  authUser,
  handleLogout
}) => {
  const location = useLocation();
  const { t } = useTranslation();

  // Doctor Navigation items.
  // Agreed order: Dashboard, Profile, Messages, Appointments, Patients,
  // Schedule, Clinics, Examination & Consultation Settings, Settings, Help.
  // Notifications are intentionally NOT a sidebar item — they are surfaced
  // through the notification bell in the top header.
  // Functional: Dashboard, Profile, Clinics.
  // Disabled placeholders: every remaining item (future phases).
  const menuItems = [
    {
      id: 'dashboard',
      label: t('doctorNav.dashboard') || t('dashboard'),
      icon: Home,
      path: '/doctor-dashboard',
      active: location.pathname === '/doctor-dashboard',
      disabled: false
    },
    {
      id: 'profile',
      label: t('doctorNav.myProfile') || t('myProfile') || 'My Profile',
      icon: User,
      path: '/doctor-profile',
      active: location.pathname === '/doctor-profile',
      disabled: false
    },
    {
      id: 'messages',
      label: t('doctorNav.messages') || t('messages'),
      icon: MessageCircle,
      path: '#',
      active: false,
      disabled: true
    },
    {
      id: 'appointments',
      label: t('doctorNav.appointments') || 'Appointments',
      icon: Calendar,
      path: '#',
      active: false,
      disabled: true
    },
    {
      id: 'patients',
      label: t('doctorNav.patients') || 'Patients',
      icon: Users,
      path: '#',
      active: false,
      disabled: true
    },
    {
      id: 'schedule',
      label: t('doctorNav.schedule') || 'Schedule',
      icon: Clock,
      path: '#',
      active: false,
      disabled: true
    },
    {
      id: 'clinics',
      label: t('doctorNav.clinics') || 'Clinics',
      icon: Building2,
      path: '/doctor-clinics',
      active: location.pathname === '/doctor-clinics',
      disabled: false
    },
    {
      id: 'consultationSettings',
      label: t('doctorNav.consultationSettings') || 'Consultation Settings',
      icon: Stethoscope,
      path: '#',
      active: false,
      disabled: true
    },
    {
      id: 'settings',
      label: t('doctorNav.settings') || t('settings'),
      icon: Settings,
      path: '#',
      active: false,
      disabled: true
    },
    {
      id: 'help',
      label: t('doctorNav.help') || t('help'),
      icon: HelpCircle,
      path: '#',
      active: false,
      disabled: true
    }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 z-40 bg-white dark:bg-[#1f2937] border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } rtl:left-auto rtl:right-0 rtl:border-r-0 rtl:border-l`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <Link to="/doctor-dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
              H
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-gray-900 dark:text-white truncate">HomelyServ</span>
                <span className="text-xs text-red-600 font-semibold tracking-wide uppercase">
                  {t('doctorNav.doctorPortal') || 'Doctor Portal'}
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Doctor Identity Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold overflow-hidden flex-shrink-0">
              {authUser?.profileImage ? (
                <img
                  src={authUser.profileImage}
                  alt={authUser.fullName || 'Doctor'}
                  className="w-full h-full object-cover"
                />
              ) : (
                (authUser?.fullName?.[0] || 'D').toUpperCase()
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  <UserDisplayName user={authUser} />
                </p>
                <p className="text-xs text-red-600 font-medium truncate">
                  {t('doctorNav.doctorRole') || 'Doctor'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed select-none opacity-60 ${
                    sidebarCollapsed ? 'justify-center' : ''
                  }`}
                  title={`${item.label} (${t('doctorNav.comingSoon') || 'Coming soon'})`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="truncate">{item.label}</span>
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        {t('doctorNav.comingSoon') || 'Soon'}
                      </span>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => mobileMenuOpen && toggleMobileMenu()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  sidebarCollapsed ? 'justify-center' : ''
                } ${
                  item.active
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-600'
                }`}
                title={item.label}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title={t('logout')}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{t('logout')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default DoctorSidebar;
