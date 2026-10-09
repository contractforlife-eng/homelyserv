// frontend/src/components/teacher/TeacherSidebar.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useDashboard } from '../layout/DashboardContext';
import { isUserPremium } from '../../utils/subscriptionService';
import { UserDisplayName } from '../users';
import {
  Home,
  User,
  HeartPulse,
  MessageCircle,
  Users,
  Layers,
  BookOpen,
  Video,
  Briefcase,
  Calendar,
  TrendingUp,
  History,
  Wallet,
  Crown,
  HelpCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  GraduationCap,
  AlertTriangle,
  Search as SearchIcon
} from 'lucide-react';

const TeacherSidebar = ({
  sidebarCollapsed,
  toggleSidebar,
  mobileMenuOpen,
  toggleMobileMenu,
  authUser,
  handleLogout
}) => {
  const location = useLocation();
  const { t } = useTranslation();
  const dashboard = useDashboard();

  const userId = authUser?.id || authUser?._id;
  const isPremium = (dashboard.premiumStatus?.known === true && dashboard.premiumStatus?.isPremium === true)
    || (userId ? isUserPremium(userId) : false)
    || authUser?.isPremium === true;

  // The final Teacher sidebar order per specifications:
  // 1. Dashboard (/teacher-dashboard)
  // 2. My Profile (/teacher-profile)
  // 3. My Medical Profile (/medical-profile)
  // 4. Messages / Talk to Support (/messages)
  // 5. Students (Coming Soon)
  // 6. Groups / Classes (Coming Soon)
  // 7. Lessons (Coming Soon)
  // 8. Schedule (Coming Soon)
  // 9. Student Progress (Coming Soon)
  // 10. Promotion History (Coming Soon)
  // 11. Accounts (Coming Soon)
  // 12. Premium Subscription (/subscription)
  // 13. Help (/help)
  // 14. Settings (/settings)
  const navItems = [
    {
      id: 'dashboard',
      label: t('teacherNav.dashboard') || 'Dashboard',
      icon: Home,
      path: '/teacher-dashboard',
      active: location.pathname === '/teacher-dashboard'
    },
    {
      id: 'myProfile',
      label: t('teacherNav.myProfile') || 'My Profile',
      icon: User,
      path: '/teacher-profile',
      active: location.pathname === '/teacher-profile'
    },
    {
      id: 'medicalProfile',
      label: t('teacherNav.medicalProfile') || 'My Medical Profile',
      icon: HeartPulse,
      path: '/medical-profile',
      active: location.pathname === '/medical-profile'
    },
    {
      id: 'messages',
      label: t('teacherNav.messages') || 'Messages',
      icon: MessageCircle,
      path: '/teacher-messages',
      active: location.pathname === '/teacher-messages'
    },
    {
      id: 'complaints',
      label: t('teacherNav.complaints') || 'Complaints',
      icon: AlertTriangle,
      path: '/teacher-complaints',
      active: location.pathname === '/teacher-complaints'
    },
    {
      id: 'searchWorkers',
      label: t('teacherNav.searchWorkers') || 'Search Workers',
      icon: SearchIcon,
      path: '/search-workers',
      active: location.pathname === '/search-workers'
    },
    {
      id: 'hires',
      label: t('employerSidebar.myHires') || 'My Hires',
      icon: Briefcase,
      path: '/teacher-hires',
      active: location.pathname === '/teacher-hires'
    },
    {
      id: 'employees',
      // `doctorCms` is the namespace DOCTOR_ACCOUNTS_TRANSLATIONS is merged into
      // (i18n/index.js), so `doctorAccounts.*` would render the raw key.
      label: t('doctorCms.employeesTitle') || 'Employees',
      icon: Users,
      path: '/teacher-employees',
      active: location.pathname === '/teacher-employees'
    },
    {
      id: 'students',
      label: t('teacherNav.students') || 'Students',
      icon: Users,
      path: '/teacher-students',
      active: location.pathname === '/teacher-students'
    },
    {
      id: 'groups',
      label: t('teacherNav.groups') || 'Groups / Classes',
      icon: Layers,
      path: '/teacher-groups',
      active: location.pathname === '/teacher-groups'
    },
    {
      id: 'lessons',
      label: t('teacherNav.lessons') || 'Lessons',
      icon: BookOpen,
      path: '/teacher-lessons',
      active: location.pathname === '/teacher-lessons'
    },
    {
      id: 'courses',
      label: t('teacherNav.courses') || 'Recorded Courses',
      icon: Video,
      path: '/teacher-courses',
      active: location.pathname === '/teacher-courses'
    },
    {
      id: 'schedule',
      label: t('teacherNav.schedule') || 'Schedule',
      icon: Calendar,
      path: '/teacher-schedule',
      active: location.pathname === '/teacher-schedule'
    },
    {
      id: 'progress',
      label: t('teacherNav.progress') || 'Student Progress',
      icon: TrendingUp,
      path: '/teacher-progress',
      active: location.pathname === '/teacher-progress'
    },
    {
      id: 'history',
      label: t('teacherNav.history') || 'Promotion History',
      icon: History,
      path: '/teacher-promotion-history',
      active: location.pathname === '/teacher-promotion-history'
    },
    {
      id: 'accounts',
      label: t('teacherNav.accounts') || 'Accounts',
      icon: Wallet,
      path: '/teacher-accounts',
      active: location.pathname === '/teacher-accounts'
    },
    {
      id: 'premium',
      label: t('teacherNav.premium') || 'Premium Subscription',
      icon: Crown,
      path: '/subscription',
      active: location.pathname === '/subscription',
      highlight: true
    },
    {
      id: 'help',
      label: t('teacherNav.help') || 'Help',
      icon: HelpCircle,
      path: '/teacher-help',
      active: location.pathname === '/teacher-help'
    },
    {
      id: 'settings',
      label: t('teacherNav.settings') || 'Settings',
      icon: Settings,
      path: '/settings',
      active: location.pathname === '/settings'
    }
  ];

  const renderNavLinks = () => (
    <div className="space-y-1 py-2">
      {navItems.map((item) => {
        const Icon = item.icon;

        if (item.comingSoon) {
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 dark:text-gray-500 cursor-not-allowed select-none ${
                sidebarCollapsed ? 'justify-center' : 'justify-between'
              }`}
              title={sidebarCollapsed ? `${item.label} (${t('teacherNav.comingSoon') || 'Soon'})` : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon size={18} className="shrink-0 opacity-60" />
                {!sidebarCollapsed && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </div>
              {!sidebarCollapsed && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                  {t('teacherNav.comingSoon') || 'Soon'}
                </span>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            to={item.path}
            onClick={() => mobileMenuOpen && toggleMobileMenu()}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              sidebarCollapsed ? 'justify-center' : ''
            } ${
              item.active
                ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-semibold'
                : item.highlight
                  ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <Icon
              size={18}
              className={`shrink-0 ${
                item.active
                  ? 'text-red-600 dark:text-red-400'
                  : item.highlight
                    ? 'text-amber-500'
                    : 'text-gray-500 dark:text-gray-400'
              }`}
            />
            {!sidebarCollapsed && (
              <span className="truncate">{item.label}</span>
            )}
            {!sidebarCollapsed && item.highlight && (
              <span className="ms-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                PRO
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 start-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
              <GraduationCap size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">HomelyServ</h2>
              <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                {t('teacherNav.teacherPortal') || 'Teacher Portal'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {renderNavLinks()}
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut size={18} />
            <span>{t('logout') || 'Log out'}</span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 bottom-0 left-0 rtl:left-auto rtl:right-0 z-40 bg-white dark:bg-gray-900 border-r rtl:border-l rtl:border-r-0 border-gray-200 dark:border-gray-800 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center font-bold shadow-sm">
                <GraduationCap size={18} />
              </div>
              <div className="truncate">
                <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">HomelyServ</h1>
                <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold tracking-wide uppercase">
                  {t('teacherNav.teacherPortal') || 'Teacher Portal'}
                </p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center font-bold shadow-sm">
                <GraduationCap size={20} />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {renderNavLinks()}
        </div>

        {/* User Card & Collapse Toggle */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                  {authUser?.profileImage ? (
                    <img
                      src={authUser.profileImage}
                      alt={authUser.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    <UserDisplayName user={authUser} name={authUser?.fullName || 'Teacher'} isPremium={isPremium} />
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {authUser?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 dark:hover:bg-gray-700"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={16} className="rtl:rotate-180" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Expand sidebar"
              >
                <ChevronRight size={18} className="rtl:rotate-180" />
              </button>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title={sidebarCollapsed ? (t('logout') || 'Log out') : undefined}
          >
            <LogOut size={16} className="shrink-0" />
            {!sidebarCollapsed && <span>{t('logout') || 'Log out'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default TeacherSidebar;
