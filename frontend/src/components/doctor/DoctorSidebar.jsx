// frontend/src/components/doctor/DoctorSidebar.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useDashboard } from '../layout/DashboardContext';
import { isUserPremium } from '../../utils/subscriptionService';
import { UserDisplayName } from '../users';
import {
  Home,
  Users,
  Calendar,
  Clock,
  Building2,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Tag,
  BarChart3,
  Wallet,
  Briefcase,
  Crown,
  Stethoscope,
  User,
  MessageCircle,
  AlertTriangle,
  Search as SearchIcon,
  GraduationCap
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

  // Doctor navigation — Clinic Management System (CMS) structure.
  //
  //   DOCTOR               Dashboard, My Profile, Messages
  //                        (pre-existing Doctor pages). Doctor Center and the
  //                        legacy /doctor-schedule are intentionally NOT listed
  //                        here; both stay reachable as legacy routes for old
  //                        links/bookmarks.
  //   CLINIC MANAGEMENT    Patients, Appointments, Consultations,
  //                        Prescriptions, Clinics, Services & Fees, Schedule,
  //                        Reports
  //   HOMELYSERV           HomelyServ module (member messages + requests)
  //   SYSTEM               Settings, Help
  //   PREMIUM              Premium (always a separate, visible item)
  //
  // NOTE on Overview: /doctor-cms (the CMS Overview) is intentionally NOT
  // listed. The Doctor Dashboard is the Doctor's main dashboard, so the CMS
  // Overview duplicated it. The route and page still exist for compatibility
  // and are NOT redirected; the final CMS structure is decided separately.
  //
  // NOTE on Schedule: the CMS Schedule (/doctor-cms/schedule) is now the ONLY
  // Schedule entry in the sidebar. The legacy /doctor-schedule page still
  // exists as a route, but is deliberately unlisted.
  //
  // Notifications are intentionally NOT a sidebar item — they are surfaced
  // through the notification bell in the red top header.
  const navGroups = [
    {
      id: 'doctor',
      label: t('doctorNav.sectionDoctor') || 'Doctor',
      items: [
        {
          id: 'dashboard',
          label: t('doctorNav.dashboard') || 'Dashboard',
          icon: Home,
          path: '/doctor-dashboard'
        },
        {
          id: 'myProfile',
          label: t('doctorNav.myProfile') || 'My Profile',
          icon: User,
          path: '/doctor-profile'
        },
        {
          id: 'messages',
          label: t('doctorNav.messages') || 'Messages',
          icon: MessageCircle,
          path: '/doctor-messages'
        },
        {
          id: 'complaints',
          label: t('doctorNav.complaints') || 'Complaints',
          icon: AlertTriangle,
          path: '/doctor-complaints'
        },
        {
          id: 'searchWorkers',
          label: t('doctorNav.searchWorkers') || 'Search Workers',
          icon: SearchIcon,
          path: '/search-workers'
        },
        {
          id: 'hires',
          label: t('employerSidebar.myHires') || 'My Hires',
          icon: Briefcase,
          path: '/doctor-hires'
        },
        {
          id: 'employees',
          // `doctorCms` is the namespace DOCTOR_ACCOUNTS_TRANSLATIONS is merged into
          // (i18n/index.js), so `doctorAccounts.*` would render the raw key.
          label: t('doctorCms.employeesTitle') || 'Employees',
          icon: Users,
          path: '/doctor-employees'
        }
      ]
    },
    {
      id: 'clinicManagement',
      label: t('doctorNav.sectionClinicManagement') || 'Clinic Management',
      // No headerPath: the section label is a plain heading, so there is no
      // navigation entry to the retired /doctor-cms Overview page.
      items: [
        {
          id: 'patients',
          label: t('doctorNav.patients') || 'Patients',
          icon: Users,
          path: '/doctor-cms/patients',
          matchPrefix: true
        },
        {
          id: 'appointments',
          label: t('doctorNav.appointments') || 'Appointments',
          icon: Calendar,
          path: '/doctor-cms/appointments'
        },
        {
          id: 'clinics',
          label: t('doctorNav.clinics') || 'Clinics',
          icon: Building2,
          path: '/doctor-cms/clinics'
        },
        {
          id: 'servicesFees',
          label: t('doctorNav.servicesFees') || 'Services & Fees',
          icon: Tag,
          path: '/doctor-cms/services'
        },
        {
          id: 'schedule',
          label: t('doctorNav.schedule') || 'Schedule',
          icon: Clock,
          path: '/doctor-cms/schedule'
        },
        {
          id: 'reports',
          label: t('doctorNav.reports') || 'Reports',
          icon: BarChart3,
          path: '/doctor-cms/reports'
        },
        {
          id: 'accounts',
          label: t('doctorNav.accounts') || 'Accounts',
          icon: Wallet,
          path: '/doctor-cms/accounts'
        }
      ]
    },
    {
      id: 'homelyserv',
      label: t('doctorNav.sectionHomelyServ') || 'HomelyServ',
      items: [
        {
          id: 'homelyserv',
          label: t('doctorNav.homelyserv') || 'HomelyServ',
          icon: Stethoscope,
          path: '/doctor-homelyserv',
          matchPrefix: true
        },
        {
          id: 'myChildren',
          label: t('parentStudents.pageTitle') || 'My Children',
          icon: GraduationCap,
          path: '/parent-students'
        }
      ]
    },
    {
      id: 'system',
      label: t('doctorNav.sectionSystem') || 'System',
      items: [
        {
          id: 'settings',
          label: t('doctorNav.settings') || 'Settings',
          icon: Settings,
          path: '/doctor-settings'
        },
        {
          id: 'help',
          label: t('doctorNav.help') || 'Help',
          icon: HelpCircle,
          path: '/doctor-help'
        }
      ]
    },
    {
      id: 'premium',
      label: t('doctorNav.sectionPremium') || 'Premium',
      items: [
        {
          id: 'premium',
          label: t('doctorNav.premium') || 'Premium',
          icon: Crown,
          path: '/subscription'
        }
      ]
    }
  ];

  // A nav item is active on its exact route. Parents that own a subtree
  // (Patients workspace, HomelyServ module) also highlight for nested routes.
  const isItemActive = (item) => (
    location.pathname === item.path
    || (item.matchPrefix === true && location.pathname.startsWith(`${item.path}/`))
  );

  const isGroupActive = (group) => (
    group.items.some(isItemActive)
    || (group.headerPath && location.pathname === group.headerPath)
  );

  const dashboard = useDashboard();
  const userId = authUser?.id || authUser?._id;
  const isPremium = (dashboard.premiumStatus?.known === true && dashboard.premiumStatus?.isPremium === true)
    || (userId ? isUserPremium(userId) : false)
    || authUser?.isPremium === true;

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 z-50 lg:z-40 bg-white dark:bg-[#1f2937] border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } rtl:left-auto rtl:right-0 rtl:border-r-0 rtl:border-l`}
      >
        {/* Doctor Identity Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-3">
            {isPremium ? (
              <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-[#F5C542] to-[#D4A820] shadow-[0_0_8px_rgba(245,197,66,0.70),0_0_16px_rgba(245,197,66,0.35)] flex-shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold">
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
              </div>
            ) : (
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
            )}
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    <UserDisplayName user={authUser} isPremium={isPremium} />
                  </p>
                  {isPremium && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 whitespace-nowrap">
                      <Crown size={10} className="text-yellow-500" />
                      {t('doctorNav.premium') || 'Premium'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-red-600 font-medium truncate">
                  {t('doctorNav.clinicManagementSystem') || 'Clinic Management System'}
                </p>
              </div>
            )}

            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-1.5 rounded-lg flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              title={sidebarCollapsed ? 'Expand' : 'Collapse'}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-1.5 rounded-lg flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Items — grouped CMS sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {navGroups.map((group, groupIndex) => {
            const groupActive = isGroupActive(group);
            return (
              <div key={group.id}>
                {/* Section label (also a link when the group has a landing page) */}
                {!sidebarCollapsed ? (
                  group.headerPath ? (
                    <Link
                      to={group.headerPath}
                      onClick={() => mobileMenuOpen && toggleMobileMenu()}
                      className={`mb-1 flex items-center gap-2 px-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        groupActive
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                      }`}
                    >
                      <span className="truncate">{group.label}</span>
                    </Link>
                  ) : (
                    <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      {group.label}
                    </p>
                  )
                ) : (
                  groupIndex > 0 && (
                    <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                  )
                )}

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item);
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        onClick={() => mobileMenuOpen && toggleMobileMenu()}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          sidebarCollapsed ? 'justify-center' : ''
                        } ${
                          active
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
              </div>
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
