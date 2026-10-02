// frontend/src/pages/StudentDashboard.jsx
// ============================================================
// STUDENT DASHBOARD
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import {
  User,
  GraduationCap,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  TrendingUp,
  MessageCircle,
  Settings,
  HelpCircle,
  HeartPulse,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search
} from 'lucide-react';

const StudentDashboardContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/students/profile');
      if (res.data?.success && res.data?.profile) {
        setProfile(res.data.profile);
      }
    } catch (err) {
      console.error('Failed to load student profile for dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const displayName = authUser?.fullName || authUser?.email?.split('@')[0] || 'Student';
  const isProfileComplete = profile?.isProfileComplete ?? false;

  // Module items
  const modules = [
    {
      id: 'profile',
      title: t('studentNav.myProfile') || 'My Profile',
      description: t('studentDashboard.moduleProfileDesc') || 'Manage your academic details, school, grade, subjects, and personal information.',
      icon: User,
      path: '/student-profile',
      active: true,
      badge: t('studentDashboard.moduleActive') || 'Active'
    },
    {
      id: 'teacher',
      title: t('studentNav.myTeacher') || 'My Teacher',
      description: t('studentDashboard.moduleTeacherDesc') || 'View your connected teachers, guidance notes, and direct contact options.',
      icon: GraduationCap,
      path: '/student-teacher',
      active: true,
      badge: t('studentDashboard.moduleActive') || 'Active'
    },
    {
      id: 'findTeacher',
      title: t('studentNav.findTeacher') || 'Find a Teacher',
      description: t('studentFindTeacher.subTitle') || 'Browse and connect with qualified teachers in your subjects and educational level.',
      icon: Search,
      path: '/student-find-teacher',
      active: true,
      badge: t('studentDashboard.moduleActive') || 'Active'
    },
    {
      id: 'lessons',
      title: t('studentNav.lessons') || 'Lessons',
      description: t('studentDashboard.moduleLessonsDesc') || 'Access your assigned lessons, learning materials, and homework.',
      icon: BookOpen,
      path: '/student-lessons',
      active: true,
      badge: t('studentDashboard.moduleActive') || 'Active'
    },
    {
      id: 'schedule',
      title: t('studentNav.schedule') || 'Schedule',
      description: t('studentDashboard.moduleScheduleDesc') || 'Keep track of your timetable, weekly lesson hours, and upcoming classes.',
      icon: Calendar,
      path: '/student-schedule',
      active: true,
      badge: t('studentDashboard.moduleActive') || 'Active'
    },
    {
      id: 'progress',
      title: t('studentNav.progress') || 'Progress',
      description: t('studentDashboard.moduleProgressDesc') || 'Monitor your attendance, quiz scores, exam results, and academic evaluation.',
      icon: TrendingUp,
      path: '/student-progress',
      active: true,
      badge: t('studentDashboard.moduleActive') || 'Active'
    },
    {
      id: 'messages',
      title: t('studentNav.messages') || 'Messages',
      description: t('studentDashboard.moduleMessagesDesc') || 'Communicate directly with your teachers and platform support.',
      icon: MessageCircle,
      path: '/student-messages',
      active: false,
      badge: t('studentDashboard.comingSoonBadge') || 'Coming Soon'
    },
    {
      id: 'medical',
      title: t('studentNav.medicalProfile') || 'My Medical Profile',
      description: t('studentDashboard.moduleMedicalDesc') || 'Manage your personal medical information and consultation records.',
      icon: HeartPulse,
      path: '/medical-profile',
      active: false,
      badge: t('studentDashboard.comingSoonBadge') || 'Coming Soon'
    },
    {
      id: 'help',
      title: t('studentNav.help') || 'Help',
      description: t('studentDashboard.moduleHelpDesc') || 'Platform guides, FAQs, and support resources.',
      icon: HelpCircle,
      path: '/help',
      active: true,
      badge: t('studentDashboard.moduleActive') || 'Active'
    },
    {
      id: 'settings',
      title: t('studentNav.settings') || 'Settings',
      description: t('studentDashboard.moduleSettingsDesc') || 'Account preferences, language, password, and security settings.',
      icon: Settings,
      path: '/settings',
      active: true,
      badge: t('studentDashboard.moduleActive') || 'Active'
    }
  ];

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-6 sm:p-8 shadow-lg shadow-red-500/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold tracking-wide">
              <GraduationCap size={14} />
              <span>{t('studentDashboard.studentPortalBadge') || 'Student Portal'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t('studentDashboard.welcomeTitle', { name: displayName })}
            </h1>
            <p className="text-red-100 text-sm sm:text-base max-w-2xl leading-relaxed">
              {t('studentDashboard.welcomeSubtitle') || 'Track your studies, school profile, and connect with your teachers and learning resources.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/student-find-teacher"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-red-600 hover:bg-red-50 font-semibold text-sm transition-all shadow-sm"
            >
              <Search size={16} />
              <span>{t('studentNav.findTeacher') || 'Find a Teacher'}</span>
            </Link>
            <Link
              to="/student-profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-700/60 hover:bg-red-700 text-white font-semibold text-sm transition-all shadow-sm border border-white/20"
            >
              <User size={16} />
              <span>{t('studentDashboard.completeProfileBtn') || 'Edit Profile'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Academic Overview Statistics Cards */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles size={18} className="text-red-600" />
          <span>{t('studentDashboard.overviewTitle') || 'Academic Overview'}</span>
        </h2>

        {loading ? (
          <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <Loader2 size={28} className="animate-spin text-red-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading overview...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* School / Institution */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shrink-0">
                <Building size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t('studentDashboard.schoolLabel') || 'School / Institution'}
                </p>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate mt-1">
                  {profile?.school || t('studentDashboard.notSpecified') || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Grade / Level */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                <GraduationCap size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t('studentDashboard.gradeLabel') || 'Grade / Level'}
                </p>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate mt-1">
                  {profile?.gradeLevel || t('studentDashboard.notSpecified') || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Education Level */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
                <BookOpen size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t('studentDashboard.educationLevelLabel') || 'Education Level'}
                </p>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate mt-1">
                  {profile?.educationLevel
                    ? profile.educationLevel.charAt(0).toUpperCase() + profile.educationLevel.slice(1).toLowerCase()
                    : t('studentDashboard.notSpecified') || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Enrolled Subjects */}
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t('studentDashboard.subjectsCountLabel') || 'Enrolled Subjects'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {Array.isArray(profile?.subjects) ? profile.subjects.length : 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Completion Callout if Incomplete */}
      {!loading && !isProfileComplete && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {t('studentDashboard.profileStatusIncomplete') || 'Incomplete Profile'}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                {t('studentDashboard.profileStatusIncompleteHint') || 'Add your school, grade, and subjects to complete your academic profile.'}
              </p>
            </div>
          </div>
          <Link
            to="/student-profile"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm shrink-0 transition-colors"
          >
            {t('studentDashboard.completeProfileBtn') || 'Edit Profile'}
          </Link>
        </div>
      )}

      {/* Learning Modules & Tools */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          {t('studentDashboard.activeModulesTitle') || 'Learning Modules & Tools'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  mod.active
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-red-300 dark:hover:border-red-900'
                    : 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-700/60 opacity-80'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2.5 rounded-xl ${
                        mod.active
                          ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-400'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        mod.active
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {mod.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-end">
                  {mod.active ? (
                    <Link
                      to={mod.path}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 group"
                    >
                      <span>{t('studentDashboard.openBtn') || 'Open'}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500 cursor-not-allowed">
                      {t('studentNav.comingSoon') || 'Soon'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('studentDashboard.headerTitle') || 'Student Dashboard'}
        badge={t('studentDashboard.studentPortalBadge') || 'Student Portal'}
        badgeColor="red"
      />
      <StudentDashboardContent />
    </DashboardLayout>
  );
};

export default StudentDashboard;
