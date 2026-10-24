// frontend/src/config/navigationConfig.js
// ============================================================
// CANONICAL NAVIGATION DEFINITIONS
// Single source of truth for dashboard and drawer navigation order
// across Desktop Web, Mobile Web, and Android Capacitor app.
//
// Every role defines its canonical navigation order once. Both
// desktop sidebars and mobile drawer navigation render this exact
// order, eliminating navigation drift across platforms.
// ============================================================

import {
  Home,
  User,
  Briefcase,
  Search,
  MessageCircle,
  Settings,
  HelpCircle,
  Crown,
  AlertTriangle,
  CreditCard,
  ClipboardList,
  Heart,
  GraduationCap,
  PlusCircle,
  FileCheck,
  Users,
  Shield,
  Globe,
  Landmark,
  FileText,
  BarChart3,
  Headphones,
  Receipt,
  Layers,
  BookOpen,
  Video,
  Calendar,
  Clock,
  TrendingUp,
  History,
  Wallet,
  Building2,
  Tag,
  Stethoscope,
  MapPinned,
  School
} from 'lucide-react';
import { isCurrentRootAdmin } from '../utils/rootAdminIdentity.js';

/**
 * Returns canonical navigation items for a given role.
 * @param {string} role - User role (WORKER, EMPLOYER, ADMIN, DOCTOR, TEACHER, STUDENT, SUPPORT, SUPPORT_HELPER)
 * @param {Function} t - Translation function (i18next)
 * @param {Object} options - Optional context (e.g., authUser)
 * @returns {Array<Object>} List of nav items with { id, label, icon, path, matchPrefix, badgeKey }
 */
export const getCanonicalNavItems = (role, t, options = {}) => {
  const normalizedRole = String(role || '').trim().toUpperCase();

  switch (normalizedRole) {
    case 'WORKER':
      return [
        { id: 'dashboard', label: t('workerSidebar.dashboard'), icon: Home, path: '/worker-dashboard' },
        { id: 'myChildren', label: t('workerSidebar.myChildren') || t('parentStudents.pageTitle') || 'My Children', icon: GraduationCap, path: '/parent-students' },
        { id: 'findJobs', label: t('workerSidebar.findJobs'), icon: Search, path: '/worker-jobs', matchPrefixPath: '/job/' },
        { id: 'medicalProfile', label: t('medicalProfile.pageTitle') || 'My Medical Profile', icon: Heart, path: '/medical-profile' },
        { id: 'myApplications', label: t('workerSidebar.myApplications'), icon: ClipboardList, path: '/worker-applications' },
        { id: 'profile', label: t('workerSidebar.myProfile'), icon: User, path: '/worker-profile' },
        { id: 'offers', label: t('workerSidebar.myOffers'), icon: Briefcase, path: '/worker/offers', badgeKey: 'offers' },
        { id: 'messages', label: t('workerSidebar.messages'), icon: MessageCircle, path: '/worker-messages', badgeKey: 'messages' },
        { id: 'complaints', label: t('workerSidebar.complaints'), icon: AlertTriangle, path: '/worker-complaints', badgeKey: 'complaints' },
        { id: 'payment', label: t('workerSidebar.payment'), icon: CreditCard, path: '/worker-payment', badgeKey: 'payments' },
        { id: 'premium', label: t('workerSidebar.premium'), icon: Crown, path: '/subscription', isPremiumBadge: true },
      ];

    case 'EMPLOYER':
      return [
        { id: 'dashboard', label: t('employerSidebar.dashboard'), icon: Home, path: '/employer-dashboard' },
        { id: 'myFamily', label: t('employerSidebar.myFamily'), icon: Users, path: '/employer-family' },
        { id: 'myChildren', label: t('employerSidebar.myChildren') || t('parentStudents.pageTitle') || 'My Children', icon: GraduationCap, path: '/parent-students' },
        { id: 'medicalProfile', label: t('medicalProfile.pageTitle') || 'My Medical Profile', icon: Heart, path: '/medical-profile' },
        { id: 'postJob', label: t('employerSidebar.postJob'), icon: PlusCircle, path: '/employer-post-job' },
        { id: 'myJobs', label: t('employerSidebar.myJobs'), icon: ClipboardList, path: '/employer-jobs', matchPrefixPath: '/job/' },
        { id: 'profile', label: t('employerSidebar.myProfile'), icon: User, path: '/employer-profile' },
        { id: 'hires', label: t('employerSidebar.myHires'), icon: FileCheck, path: '/my-hires', badgeKey: 'hires' },
        { id: 'search', label: t('employerSidebar.searchWorkers'), icon: Search, path: '/employer-search' },
        { id: 'messages', label: t('employerSidebar.messages'), icon: MessageCircle, path: '/employer-messages', badgeKey: 'messages' },
        { id: 'complaints', label: t('employerSidebar.complaints'), icon: AlertTriangle, path: '/employer-complaints', badgeKey: 'complaints' },
        { id: 'payment', label: t('employerSidebar.payment'), icon: CreditCard, path: '/employer-payments', badgeKey: 'payments' },
        { id: 'premium', label: t('employerSidebar.premium'), icon: Crown, path: '/subscription', isPremiumBadge: true },
      ];

    case 'ADMIN': {
      const items = [
        { id: 'dashboard', label: t('adminSidebar.dashboard'), icon: Home, path: '/admin' },
        { id: 'users', label: t('adminSidebar.users'), icon: Users, path: '/admin/users', badgeKey: 'users' },
        { id: 'registration-geography', label: t('adminSidebar.registrationGeography'), icon: Globe, path: '/admin/registration-geography' },
        { id: 'payments', label: t('adminSidebar.payments'), icon: CreditCard, path: '/admin/payments', badgeKey: 'payments' },
        { id: 'financial-center', label: t('adminSidebar.financialCenter'), icon: Landmark, path: '/admin/financial-center' },
      ];

      if (isCurrentRootAdmin()) {
        items.push({
          id: 'accounting',
          label: t('adminSidebar.accounting'),
          icon: Receipt,
          path: '/admin/accounting',
        });
      }

      items.push(
        { id: 'complaints', label: t('adminSidebar.complaints'), icon: FileText, path: '/admin/complaints', badgeKey: 'complaints' },
        { id: 'reports', label: t('adminSidebar.reports'), icon: BarChart3, path: '/admin/reports' },
        { id: 'messages', label: t('adminSidebar.messages'), icon: MessageCircle, path: '/admin/messages', badgeKey: 'messages' },
        { id: 'live-support', label: t('publicSupport.liveSupport'), icon: Headphones, path: '/admin/live-support' },
        { id: 'hires', label: t('adminSidebar.hires'), icon: Briefcase, path: '/admin/hires', badgeKey: 'hires' },
        { id: 'profile', label: t('adminSidebar.profile'), icon: User, path: '/admin/profile' },
        { id: 'settings', label: t('adminSidebar.settings'), icon: Settings, path: '/admin/settings' },
      );
      return items;
    }

    case 'DOCTOR':
      return [
        { id: 'dashboard', label: t('doctorNav.dashboard') || 'Dashboard', icon: Home, path: '/doctor-dashboard' },
        { id: 'myProfile', label: t('doctorNav.myProfile') || 'My Profile', icon: User, path: '/doctor-profile' },
        { id: 'messages', label: t('doctorNav.messages') || 'Messages', icon: MessageCircle, path: '/doctor-messages' },
        { id: 'complaints', label: t('doctorNav.complaints') || 'Complaints', icon: AlertTriangle, path: '/doctor-complaints' },
        { id: 'searchWorkers', label: t('doctorNav.searchWorkers') || 'Search Workers', icon: Search, path: '/search-workers' },
        { id: 'hires', label: t('employerSidebar.myHires') || 'My Hires', icon: Briefcase, path: '/doctor-hires' },
        { id: 'employees', label: t('doctorCms.employeesTitle') || 'Employees', icon: Users, path: '/doctor-employees' },
        { id: 'patients', label: t('doctorNav.patients') || 'Patients', icon: Users, path: '/doctor-cms/patients', matchPrefix: true },
        { id: 'appointments', label: t('doctorNav.appointments') || 'Appointments', icon: Calendar, path: '/doctor-cms/appointments' },
        { id: 'clinics', label: t('doctorNav.clinics') || 'Clinics', icon: Building2, path: '/doctor-cms/clinics' },
        { id: 'servicesFees', label: t('doctorNav.servicesFees') || 'Services & Fees', icon: Tag, path: '/doctor-cms/services' },
        { id: 'schedule', label: t('doctorNav.schedule') || 'Schedule', icon: Clock, path: '/doctor-cms/schedule' },
        { id: 'reports', label: t('doctorNav.reports') || 'Reports', icon: BarChart3, path: '/doctor-cms/reports' },
        { id: 'accounts', label: t('doctorNav.accounts') || 'Accounts', icon: Wallet, path: '/doctor-cms/accounts' },
        { id: 'homelyserv', label: t('doctorNav.homelyserv') || 'HomelyServ', icon: Stethoscope, path: '/doctor-homelyserv', matchPrefix: true },
        { id: 'myChildren', label: t('parentStudents.pageTitle') || 'My Children', icon: GraduationCap, path: '/parent-students' },
        { id: 'settings', label: t('doctorNav.settings') || 'Settings', icon: Settings, path: '/doctor-settings' },
        { id: 'help', label: t('doctorNav.help') || 'Help', icon: HelpCircle, path: '/doctor-help' },
        { id: 'premium', label: t('doctorNav.premium') || 'Premium', icon: Crown, path: '/subscription', isPremiumBadge: true },
      ];

    case 'TEACHER':
      return [
        { id: 'dashboard', label: t('teacherNav.dashboard') || 'Dashboard', icon: Home, path: '/teacher-dashboard' },
        { id: 'myProfile', label: t('teacherNav.myProfile') || 'My Profile', icon: User, path: '/teacher-profile' },
        { id: 'medicalProfile', label: t('teacherNav.medicalProfile') || 'My Medical Profile', icon: Heart, path: '/medical-profile' },
        { id: 'messages', label: t('teacherNav.messages') || 'Messages', icon: MessageCircle, path: '/teacher-messages' },
        { id: 'complaints', label: t('teacherNav.complaints') || 'Complaints', icon: AlertTriangle, path: '/teacher-complaints' },
        { id: 'searchWorkers', label: t('teacherNav.searchWorkers') || 'Search Workers', icon: Search, path: '/search-workers' },
        { id: 'hires', label: t('employerSidebar.myHires') || 'My Hires', icon: Briefcase, path: '/teacher-hires' },
        { id: 'employees', label: t('doctorCms.employeesTitle') || 'Employees', icon: Users, path: '/teacher-employees' },
        { id: 'students', label: t('teacherNav.students') || 'Students', icon: Users, path: '/teacher-students' },
        { id: 'myChildren', label: t('parentStudents.pageTitle') || 'My Children', icon: GraduationCap, path: '/parent-students', matchPrefix: true },
        { id: 'groups', label: t('teacherNav.groups') || 'Groups / Classes', icon: Layers, path: '/teacher-groups' },
        { id: 'lessons', label: t('teacherNav.lessons') || 'Lessons', icon: BookOpen, path: '/teacher-lessons' },
        { id: 'courses', label: t('teacherNav.courses') || 'Recorded Courses', icon: Video, path: '/teacher-courses' },
        { id: 'schedule', label: t('teacherNav.schedule') || 'Schedule', icon: Calendar, path: '/teacher-schedule' },
        { id: 'progress', label: t('teacherNav.progress') || 'Student Progress', icon: TrendingUp, path: '/teacher-progress' },
        { id: 'history', label: t('teacherNav.history') || 'Promotion History', icon: History, path: '/teacher-promotion-history' },
        { id: 'accounts', label: t('teacherNav.accounts') || 'Accounts', icon: Wallet, path: '/teacher-accounts' },
        { id: 'premium', label: t('teacherNav.premium') || 'Premium Subscription', icon: Crown, path: '/subscription', isPremiumBadge: true },
        { id: 'help', label: t('teacherNav.help') || 'Help', icon: HelpCircle, path: '/teacher-help' },
        { id: 'settings', label: t('teacherNav.settings') || 'Settings', icon: Settings, path: '/settings' },
      ];

    case 'STUDENT':
      return [
        { id: 'dashboard', label: t('studentNav.dashboard') || 'Dashboard', icon: Home, path: '/student-dashboard' },
        { id: 'myProfile', label: t('studentNav.myProfile') || 'My Profile', icon: User, path: '/student-profile' },
        { id: 'myTeacher', label: t('studentNav.myTeacher') || 'My Teacher', icon: GraduationCap, path: '/student-teacher' },
        { id: 'lessons', label: t('studentNav.lessons') || 'Lessons', icon: BookOpen, path: '/student-lessons' },
        { id: 'courses', label: t('studentNav.courses') || 'Recorded Courses', icon: Video, path: '/student-courses' },
        { id: 'messages', label: t('studentNav.messages') || 'Messages', icon: MessageCircle, path: '/student-messages' },
        { id: 'complaints', label: t('studentNav.complaints') || 'Complaints', icon: AlertTriangle, path: '/student-complaints' },
        { id: 'findTeacher', label: t('studentNav.findTeacher') || 'Find a Teacher', icon: Search, path: '/student-find-teacher' },
        { id: 'bookings', label: t('studentNav.bookings') || 'My Bookings', icon: Calendar, path: '/student-bookings' },
        { id: 'schedule', label: t('studentNav.schedule') || 'Schedule', icon: Calendar, path: '/student-schedule' },
        { id: 'progress', label: t('studentNav.progress') || 'Progress', icon: TrendingUp, path: '/student-progress' },
        { id: 'medicalProfile', label: t('studentNav.medicalProfile') || 'My Medical Profile', icon: Heart, path: '/medical-profile' },
        { id: 'familyTracking', label: t('studentNav.familyTracking') || 'Family Tracking', icon: MapPinned, path: '/student-family-tracking' },
        { id: 'help', label: t('studentNav.help') || 'Help', icon: HelpCircle, path: '/student-help' },
        { id: 'settings', label: t('studentNav.settings') || 'Settings', icon: Settings, path: '/settings' },
      ];

    case 'SUPPORT': {
      const tSup = t('supportNavigation', { returnObjects: true }) || {};
      return [
        { id: 'dashboard', label: tSup.dashboard || 'Dashboard', icon: Home, path: '/support-dashboard' },
        { id: 'users', label: tSup.users || 'Users', icon: Users, path: '/support-users', badgeKey: 'users' },
        { id: 'complaints', label: tSup.complaints || 'Complaints', icon: FileText, path: '/support-complaints', badgeKey: 'complaints' },
        { id: 'messages', label: tSup.messages || 'Messages', icon: MessageCircle, path: '/support-messages', badgeKey: 'messages' },
        { id: 'live-support', label: t('publicSupport.liveSupport') || 'Live Support', icon: Headphones, path: '/support-live-support' },
        { id: 'registration-geography', label: tSup.registrationGeography || t('adminSidebar.registrationGeography') || 'Registration Geography', icon: Globe, path: '/support-registration-geography' },
        { id: 'profile', label: tSup.profile || 'Profile', icon: User, path: '/support-profile' },
        { id: 'settings', label: tSup.settings || 'Settings', icon: Settings, path: '/support-settings' },
      ];
    }

    case 'SUPPORT_HELPER': {
      const tSup = t('supportNavigation', { returnObjects: true }) || {};
      return [
        { id: 'dashboard', label: t('supHelpNavigation.dashboard') || tSup.dashboard || 'Dashboard', icon: Home, path: '/sup-help' },
        { id: 'users', label: t('supHelpNavigation.users') || tSup.users || 'Users', icon: Users, path: '/sup-help/users' },
        { id: 'messages', label: tSup.messages || 'Messages', icon: MessageCircle, path: '/sup-help/messages' },
        { id: 'complaints', label: tSup.complaints || 'Complaints', icon: FileText, path: '/sup-help/complaints' },
        { id: 'live-support', label: t('publicSupport.liveSupport') || 'Live Support', icon: Headphones, path: '/sup-help/live-support' },
        { id: 'profile', label: tSup.profile || 'Profile', icon: User, path: '/sup-help/profile' },
        { id: 'settings', label: t('supHelpNavigation.settings') || tSup.settings || 'Settings', icon: Settings, path: '/sup-help/settings' },
      ];
    }

    default:
      return [];
  }
};
