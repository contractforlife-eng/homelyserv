import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useDashboard } from '../components/layout/DashboardContext';
import { isUserPremium } from '../utils/subscriptionService';
import api from '../utils/api';
import {
  User,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Users,
  Layers,
  BookOpen,
  TrendingUp,
  Wallet,
  Clock,
  MessageCircle,
  Settings,
  HelpCircle,
  Crown,
  HeartPulse,
  Calendar,
  Loader2
} from 'lucide-react';

const TeacherDashboardContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const dashboard = useDashboard();
  const userId = authUser?.id || authUser?._id;
  const isPremium = (dashboard.premiumStatus?.known === true && dashboard.premiumStatus?.isPremium === true)
    || (userId ? isUserPremium(userId) : false)
    || authUser?.isPremium === true;

  // Live statistics state
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsData, setStatsData] = useState({
    activeStudents: null,
    groups: null,
    upcomingLessons: null,
    incomeFormatted: '0',
    outstandingFormatted: '0'
  });

  const loadLiveStats = useCallback(async () => {
    setLoadingStats(true);

    try {
      // Execute each request independently so a failure in one doesn't break others
      const requests = [
        api.get('/api/teachers/students?status=ACTIVE'),
        api.get('/api/teachers/groups?status=ACTIVE'),
        api.get('/api/teachers/lessons?status=SCHEDULED'),
        api.get('/api/teachers/profile')
      ];

      // If premium, query this month's accounts summary
      if (isPremium) {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const fromIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01T00:00:00.000Z`;
        const toIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T23:59:59.999Z`;
        requests.push(api.get(`/api/teachers/accounts/summary?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`));
      }

      const results = await Promise.allSettled(requests);
      const [studentsResult, groupsResult, lessonsResult, profileResult, accountsResult] = results;

      // 1. Active Students
      let activeStudentsCount = 0;
      if (studentsResult.status === 'fulfilled' && studentsResult.value?.data?.success) {
        const studentsList = Array.isArray(studentsResult.value.data.students)
          ? studentsResult.value.data.students
          : [];
        activeStudentsCount = studentsList.filter(
          (s) => s.status === 'ACTIVE' && s.isActive !== false
        ).length;
      }

      // 2. Classes / Groups
      let groupsCount = 0;
      if (groupsResult.status === 'fulfilled' && groupsResult.value?.data?.success) {
        const groupsList = Array.isArray(groupsResult.value.data.groups)
          ? groupsResult.value.data.groups
          : [];
        groupsCount = groupsList.filter(
          (g) => g.status === 'ACTIVE' && g.isActive !== false
        ).length;
      }

      // 3. Upcoming Lessons
      let upcomingLessonsCount = 0;
      if (lessonsResult.status === 'fulfilled' && lessonsResult.value?.data?.success) {
        const lessonsList = Array.isArray(lessonsResult.value.data.lessons)
          ? lessonsResult.value.data.lessons
          : [];
        const now = new Date();

        upcomingLessonsCount = lessonsList.filter((l) => {
          if (l.lessonStatus !== 'SCHEDULED' || l.isActive === false) return false;
          if (!l.date) return false;

          let lessonDateTime;
          if (typeof l.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(l.date)) {
            const timePart = l.startTime && /^\d{2}:\d{2}$/.test(l.startTime) ? l.startTime : '00:00';
            lessonDateTime = new Date(`${l.date}T${timePart}:00`);
          } else {
            lessonDateTime = new Date(l.date);
            if (l.startTime && typeof l.startTime === 'string') {
              const [h, m] = l.startTime.split(':').map((num) => parseInt(num, 10));
              if (!Number.isNaN(h) && !Number.isNaN(m)) {
                lessonDateTime.setHours(h, m, 0, 0);
              }
            }
          }

          return !Number.isNaN(lessonDateTime.getTime()) && lessonDateTime.getTime() >= now.getTime();
        }).length;
      }

      // 4. Accounts: Monthly Income & Outstanding Fees (Multi-currency safe)
      let incomeFormatted = '0';
      let outstandingFormatted = '0';
      const teacherCur = profileResult?.status === 'fulfilled' && profileResult.value?.data?.profile?.pricingCurrency
        ? profileResult.value.data.profile.pricingCurrency
        : 'EGP';

      if (accountsResult && accountsResult.status === 'fulfilled' && accountsResult.value?.data?.summary) {
        const sum = accountsResult.value.data.summary;
        const recMap = sum.receivedIncome || {};
        const pendMap = sum.pendingIncome || {};

        const recKeys = Object.keys(recMap).filter((k) => Number(recMap[k]) > 0);
        const pendKeys = Object.keys(pendMap).filter((k) => Number(pendMap[k]) > 0);

        if (recKeys.length === 0) {
          incomeFormatted = `0 ${teacherCur}`;
        } else if (recKeys.length === 1) {
          incomeFormatted = `${recMap[recKeys[0]].toLocaleString()} ${recKeys[0]}`;
        } else {
          // Multi-currency: list separated, never summed together
          incomeFormatted = recKeys.map((k) => `${recMap[k].toLocaleString()} ${k}`).join(' / ');
        }

        if (pendKeys.length === 0) {
          outstandingFormatted = `0 ${teacherCur}`;
        } else if (pendKeys.length === 1) {
          outstandingFormatted = `${pendMap[pendKeys[0]].toLocaleString()} ${pendKeys[0]}`;
        } else {
          outstandingFormatted = pendKeys.map((k) => `${pendMap[k].toLocaleString()} ${k}`).join(' / ');
        }
      } else {
        incomeFormatted = `0 ${teacherCur}`;
        outstandingFormatted = `0 ${teacherCur}`;
      }

      setStatsData({
        activeStudents: activeStudentsCount,
        groups: groupsCount,
        upcomingLessons: upcomingLessonsCount,
        incomeFormatted,
        outstandingFormatted
      });
    } catch (err) {
      console.error('Error loading teacher dashboard statistics:', err);
      setStatsData({
        activeStudents: 0,
        groups: 0,
        upcomingLessons: 0,
        incomeFormatted: '0',
        outstandingFormatted: '0'
      });
    } finally {
      setLoadingStats(false);
    }
  }, [isPremium]);

  useEffect(() => {
    loadLiveStats();
  }, [loadLiveStats]);

  // Stat cards for modules
  const statCards = [
    {
      id: 'students',
      icon: Users,
      value: statsData.activeStudents,
      label: t('teacherDashboard.statStudents') || 'Active Students',
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      path: '/teacher-students',
      loading: loadingStats
    },
    {
      id: 'groups',
      icon: Layers,
      value: statsData.groups,
      label: t('teacherDashboard.statGroups') || 'Classes / Groups',
      color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20',
      path: '/teacher-groups',
      loading: loadingStats
    },
    {
      id: 'lessons',
      icon: BookOpen,
      value: statsData.upcomingLessons,
      label: t('teacherDashboard.statUpcomingLessons') || 'Upcoming Lessons',
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
      path: '/teacher-lessons',
      loading: loadingStats
    },
    {
      id: 'progress',
      icon: TrendingUp,
      value: '—',
      label: t('teacherDashboard.statStudentProgress') || 'Student Progress',
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
      comingSoon: true
    },
    {
      id: 'income',
      icon: Wallet,
      value: statsData.incomeFormatted,
      label: t('teacherDashboard.statIncome') || 'Monthly Income',
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
      path: '/teacher-accounts',
      loading: loadingStats
    },
    {
      id: 'outstanding',
      icon: Clock,
      value: statsData.outstandingFormatted,
      label: t('teacherDashboard.statOutstanding') || 'Outstanding Dues',
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
      path: '/teacher-accounts',
      loading: loadingStats
    }
  ];

  const activeModules = [
    {
      id: 'profile',
      icon: User,
      color: 'text-red-600 bg-red-50 dark:bg-red-900/20',
      title: t('teacherNav.myProfile') || 'My Profile',
      desc: t('teacherDashboard.profileDesc') || 'Subjects, teaching levels, qualifications, rates, and verification.',
      path: '/teacher-profile'
    },
    {
      id: 'students',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      title: t('teacherNav.students') || 'Students',
      desc: t('teacherStudents.subtitle') || 'Manage all your students in one unified place.',
      path: '/teacher-students'
    },
    {
      id: 'groups',
      icon: Layers,
      color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20',
      title: t('teacherNav.groups') || 'Groups / Classes',
      desc: t('teacherGroups.subtitle') || 'Organize your students into classes, grade levels, and study groups.',
      path: '/teacher-groups'
    },
    {
      id: 'lessons',
      icon: BookOpen,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
      title: t('teacherNav.lessons') || 'Lessons',
      desc: t('teacherLessons.subtitle') || 'Schedule and manage your individual and group lessons.',
      path: '/teacher-lessons'
    },
    {
      id: 'schedule',
      icon: Calendar,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
      title: t('teacherNav.schedule') || 'Schedule',
      desc: t('teacherSchedule.subtitle') || 'Calendar and agenda view of your scheduled lessons and classes.',
      path: '/teacher-schedule'
    },
    {
      id: 'medicalProfile',
      icon: HeartPulse,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
      title: t('teacherNav.medicalProfile') || 'My Medical Profile',
      desc: t('teacherDashboard.medicalProfileDesc') || 'Manage your personal medical information and consultation records.',
      path: '/medical-profile'
    },
    {
      id: 'messages',
      icon: MessageCircle,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
      title: t('teacherNav.messages') || 'Messages',
      desc: t('teacherDashboard.messagesDesc') || 'Communicate with students and HomelyServ administration.',
      path: '/teacher-messages'
    },
    {
      id: 'accounts',
      icon: Wallet,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
      title: t('teacherNav.accounts') || 'Accounts',
      desc: t('teacherAccounts.summary.title') || 'Bookkeeping, income, and lesson fees overview.',
      path: '/teacher-accounts'
    },
    {
      id: 'premium',
      icon: Crown,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
      title: t('teacherNav.premium') || 'Premium Subscription',
      desc: t('teacherDashboard.premiumDesc') || 'Upgrade to Teacher Premium to access enhanced platform privileges.',
      path: '/subscription'
    },
    {
      id: 'settings',
      icon: Settings,
      color: 'text-slate-600 bg-slate-50 dark:bg-slate-900/20',
      title: t('teacherNav.settings') || 'Settings',
      desc: t('teacherDashboard.settingsDesc') || 'Appearance, password, and account security preferences.',
      path: '/settings'
    },
    {
      id: 'help',
      icon: HelpCircle,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      title: t('teacherNav.help') || 'Help & Support',
      desc: t('teacherDashboard.helpDesc') || 'Guidelines, user manual, and platform support resources.',
      path: '/help'
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      {/* Welcome Teacher Banner with Red gradient (matching Doctor treatment) */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles size={14} />
              {t('teacherDashboard.teacherPortalBadge') || 'Teacher Portal'}
            </div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${isPremium ? 'text-[#F5C542]' : ''}`}>
              {t('teacherDashboard.welcomeTitle', { name: authUser?.fullName || 'Teacher' }) || `Welcome, ${authUser?.fullName || 'Teacher'}`}
            </h1>
            <p className="mt-1 text-red-100 text-sm max-w-xl">
              {t('teacherDashboard.welcomeSubtitle') || 'Manage your teaching profile, subjects, levels, and credentials. Complete your profile to get ready for students.'}
            </p>
          </div>

          <Link
            to="/teacher-profile"
            className="inline-flex items-center justify-center gap-2 bg-white text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
          >
            <User size={18} />
            {t('teacherDashboard.manageProfileBtn') || 'Manage Profile'}
            <ArrowRight size={16} className="rtl:rotate-180" />
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          {t('teacherDashboard.overviewTitle') || 'Teaching Overview'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                      <Icon size={18} />
                    </div>
                    {card.comingSoon && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400">
                        {t('teacherNav.comingSoon') || 'Soon'}
                      </span>
                    )}
                  </div>
                  <div className="min-h-[28px] flex items-center">
                    {card.loading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : (
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Modules Grid */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          {t('teacherDashboard.activeModulesTitle') || 'Available Tools & Modules'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeModules.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                to={card.path}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm flex flex-col justify-between transition-colors hover:border-red-300 dark:hover:border-red-700 hover:bg-gray-50 dark:hover:bg-gray-700/40"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                      {t('teacherDashboard.moduleActive') || 'Active'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base">{card.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{card.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs font-medium text-red-600 dark:text-red-400">
                  <span>{t('teacherDashboard.openModuleBtn') || 'Open'}</span>
                  <ArrowRight size={14} className="rtl:rotate-180" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  const { t } = useTranslation();
  return (
    <DashboardLayout requiredRole="TEACHER">
      <DashboardHeader title={t('teacherDashboard.headerTitle') || 'Teacher Dashboard'} />
      <TeacherDashboardContent />
    </DashboardLayout>
  );
};

export default TeacherDashboard;
