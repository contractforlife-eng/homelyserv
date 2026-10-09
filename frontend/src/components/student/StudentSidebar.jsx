// frontend/src/components/student/StudentSidebar.jsx
// ============================================================
// STUDENT SIDEBAR COMPONENT
// ============================================================
// Nav items:
// 1. Dashboard (/student-dashboard) - Active
// 2. My Profile (/student-profile) - Active
// 3. My Medical Profile (/medical-profile) - Coming Soon
// 4. My Teacher (/student-teacher) - Coming Soon
// 5. Lessons (/student-lessons) - Coming Soon
// 6. Schedule (/student-schedule) - Coming Soon
// 7. Progress (/student-progress) - Coming Soon
// 8. Messages (/student-messages) - Coming Soon
// 9. Help (/help) - Active
// 10. Settings (/settings) - Active
//
// Matches canonical HomelyServ sidebar desktop & mobile styling.
// ============================================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useDashboard } from '../layout/DashboardContext';
import { UserDisplayName } from '../users';
import {
  Home,
  User,
  HeartPulse,
  GraduationCap,
  BookOpen,
  Video,
  Calendar,
  TrendingUp,
  MessageCircle,
  HelpCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Search,
  AlertTriangle
} from 'lucide-react';

const StudentSidebar = ({
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

  // Canonical Student navigation items
  // 1. Dashboard (/student-dashboard)
  // 2. My Profile (/student-profile)
  // 3. My Teacher (/student-teacher)
  // 4. Lessons (/student-lessons)
  // 5. Messages (/student-messages)
  // 6. Find a Teacher (/student-find-teacher)
  // 7. My Bookings (/student-bookings)
  // 8. Schedule (/student-schedule)
  // 9. Progress (/student-progress)
  // 10. My Medical Profile (/medical-profile)
  // 11. Help (/student-help)
  // 12. Settings (/settings)
  const menuItems = [
    {
      id: 'dashboard',
      label: t('studentNav.dashboard') || 'Dashboard',
      icon: Home,
      path: '/student-dashboard',
      active: location.pathname === '/student-dashboard'
    },
    {
      id: 'myProfile',
      label: t('studentNav.myProfile') || 'My Profile',
      icon: User,
      path: '/student-profile',
      active: location.pathname === '/student-profile'
    },
    {
      id: 'myTeacher',
      label: t('studentNav.myTeacher') || 'My Teacher',
      icon: GraduationCap,
      path: '/student-teacher',
      active: location.pathname === '/student-teacher'
    },
    {
      id: 'lessons',
      label: t('studentNav.lessons') || 'Lessons',
      icon: BookOpen,
      path: '/student-lessons',
      active: location.pathname === '/student-lessons'
    },
    {
      id: 'courses',
      label: t('studentNav.courses') || 'Recorded Courses',
      icon: Video,
      path: '/student-courses',
      active: location.pathname === '/student-courses'
    },
    {
      id: 'messages',
      label: t('studentNav.messages') || 'Messages',
      icon: MessageCircle,
      path: '/student-messages',
      active: location.pathname === '/student-messages'
    },
    {
      id: 'complaints',
      label: t('studentNav.complaints') || 'Complaints',
      icon: AlertTriangle,
      path: '/student-complaints',
      active: location.pathname === '/student-complaints'
    },
    {
      id: 'findTeacher',
      label: t('studentNav.findTeacher') || 'Find a Teacher',
      icon: Search,
      path: '/student-find-teacher',
      active: location.pathname === '/student-find-teacher'
    },
    {
      id: 'bookings',
      label: t('studentNav.bookings') || 'My Bookings',
      icon: Calendar,
      path: '/student-bookings',
      active: location.pathname === '/student-bookings'
    },
    {
      id: 'schedule',
      label: t('studentNav.schedule') || 'Schedule',
      icon: Calendar,
      path: '/student-schedule',
      active: location.pathname === '/student-schedule'
    },
    {
      id: 'progress',
      label: t('studentNav.progress') || 'Progress',
      icon: TrendingUp,
      path: '/student-progress',
      active: location.pathname === '/student-progress'
    },
    {
      id: 'medicalProfile',
      label: t('studentNav.medicalProfile') || 'My Medical Profile',
      icon: HeartPulse,
      path: '/medical-profile',
      active: location.pathname === '/medical-profile'
    },
    {
      id: 'help',
      label: t('studentNav.help') || 'Help',
      icon: HelpCircle,
      path: '/student-help',
      active: location.pathname === '/student-help'
    },
    {
      id: 'settings',
      label: t('studentNav.settings') || 'Settings',
      icon: Settings,
      path: '/settings',
      active: location.pathname === '/settings'
    }
  ];

  const renderNavItems = (isMobile = false) => (
    <div className="space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isDisabled = Boolean(item.comingSoon);

        if (isDisabled) {
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed select-none transition-colors ${
                sidebarCollapsed && !isMobile ? 'justify-center' : ''
              }`}
              title={`${item.label} (${t('studentNav.comingSoon') || 'Soon'})`}
            >
              <Icon size={18} className="shrink-0 text-gray-400 dark:text-gray-500" />
              {(!sidebarCollapsed || isMobile) && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200/50 dark:border-gray-700/50">
                    {t('studentNav.comingSoon') || 'Soon'}
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
            onClick={isMobile ? toggleMobileMenu : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              item.active
                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold shadow-sm'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            } ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}`}
            title={sidebarCollapsed && !isMobile ? item.label : undefined}
          >
            <Icon
              size={18}
              className={`shrink-0 ${
                item.active
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            />
            {(!sidebarCollapsed || isMobile) && (
              <span className="truncate">{item.label}</span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 bottom-0 left-0 rtl:left-auto rtl:right-0 z-40 bg-white dark:bg-gray-900 border-r rtl:border-l rtl:border-r-0 border-gray-200 dark:border-gray-800 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header / Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <GraduationCap size={18} />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-gray-900 dark:text-white truncate block">
                  HomelyServ
                </span>
                <span className="text-[10px] uppercase font-semibold text-red-600 tracking-wider block">
                  {t('studentNav.studentPortal') || 'Student Portal'}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-sm">
                <GraduationCap size={18} />
              </div>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              sidebarCollapsed ? 'hidden' : ''
            }`}
            title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {renderNavItems(false)}
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          {!sidebarCollapsed ? (
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {authUser?.fullName ? authUser.fullName.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white truncate block">
                    <UserDisplayName user={authUser} />
                  </span>
                  <span className="text-[10px] text-gray-400 truncate block">
                    {t('studentNav.studentRole') || 'Student'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title={t('logout') || 'Log Out'}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title={t('logout') || 'Log Out'}
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={toggleMobileMenu}
          />
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-gray-900 h-full flex flex-col z-10 shadow-2xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <span className="font-bold text-sm text-gray-900 dark:text-white block">
                    HomelyServ
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-red-600 block">
                    {t('studentNav.studentPortal') || 'Student Portal'}
                  </span>
                </div>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {renderNavItems(true)}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-red-50 hover:text-red-600 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-colors"
              >
                <LogOut size={16} />
                <span>{t('logout') || 'Log Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentSidebar;
