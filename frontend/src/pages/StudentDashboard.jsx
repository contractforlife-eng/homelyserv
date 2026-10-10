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
  getStudentParentRequests,
  acceptParentRequest,
  rejectParentRequest
} from '../services/parentStudentService';
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
  XCircle,
  Loader2,
  Search,
  Clock,
  Clock3,
  CalendarCheck,
  FileCheck,
  Award,
  Users
} from 'lucide-react';

const StudentDashboardContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);

  // Parent link requests (student-side)
  const [parentRequests, setParentRequests] = useState([]);
  const [parentActionLoading, setParentActionLoading] = useState(null);
  const [parentRequestError, setParentRequestError] = useState('');
  const [parentRequestSuccess, setParentRequestSuccess] = useState('');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, summaryRes] = await Promise.all([
        api.get('/api/students/profile').catch((err) => {
          console.error('Failed to load student profile for dashboard:', err);
          return { data: { success: false } };
        }),
        api.get('/api/students/dashboard/summary').catch((err) => {
          console.error('Failed to load student dashboard summary:', err);
          return { data: { success: false } };
        })
      ]);

      if (profileRes.data?.success && profileRes.data?.profile) {
        setProfile(profileRes.data.profile);
      }
      if (summaryRes.data?.success && summaryRes.data?.data) {
        setSummary(summaryRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Fetch incoming parent link requests (student-side)
  const fetchParentRequests = useCallback(async () => {
    try {
      const data = await getStudentParentRequests();
      if (data?.success) {
        setParentRequests(Array.isArray(data.requests) ? data.requests : []);
      }
    } catch (err) {
      console.error('Failed to load parent requests:', err);
    }
  }, []);

  useEffect(() => {
    fetchParentRequests();
  }, [fetchParentRequests]);

  const handleParentRequestAction = async (id, action) => {
    try {
      setParentActionLoading(id);
      setParentRequestError('');
      setParentRequestSuccess('');
      const data = action === 'accept'
        ? await acceptParentRequest(id)
        : await rejectParentRequest(id);
      if (data?.success) {
        setParentRequestSuccess(action === 'accept'
          ? (t('parentStudents.studentAcceptSuccess') || 'Parent link request accepted.')
          : (t('parentStudents.studentRejectSuccess') || 'Parent link request rejected.'));
        await fetchParentRequests();
        setTimeout(() => setParentRequestSuccess(''), 5000);
      }
    } catch (err) {
      setParentRequestError(err.response?.data?.message || t('parentStudents.studentActionError') || 'Failed to update parent request.');
    } finally {
      setParentActionLoading(null);
    }
  };

  const displayName = authUser?.fullName || authUser?.email?.split('@')[0] || 'Student';
  const isProfileComplete = profile?.isProfileComplete ?? false;

  // Format dates
  const formatLessonDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

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
      id: 'bookings',
      title: t('studentNav.bookings') || 'My Bookings',
      description: t('studentDashboard.moduleBookingsDesc') || 'Track your lesson booking requests with connected teachers.',
      icon: Calendar,
      path: '/student-bookings',
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
      active: true,
      badge: t('studentDashboard.moduleActive') || 'Active'
    },
    {
      id: 'medical',
      title: t('studentNav.medicalProfile') || 'My Medical Profile',
      description: t('studentDashboard.moduleMedicalDesc') || 'Manage your personal medical information and consultation records.',
      icon: HeartPulse,
      path: '/medical-profile',
      active: true,
      badge: t('studentDashboard.moduleActive') || 'Active'
    },
    {
      id: 'help',
      title: t('studentNav.help') || 'Help',
      description: t('studentDashboard.moduleHelpDesc') || 'Platform guides, FAQs, and support resources.',
      icon: HelpCircle,
      path: '/student-help',
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

      {/* Pending Bookings Alert Banner */}
      {!loading && summary?.pendingBookingsCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3 transition shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0">
              <Clock3 size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950 dark:text-amber-200">
                {t('studentDashboard.pendingBookingsBanner', {
                  count: summary.pendingBookingsCount,
                  defaultValue: `You have ${summary.pendingBookingsCount} pending booking request awaiting teacher response.`
                })}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {t('studentDashboard.moduleBookingsDesc') || 'Track your lesson booking requests with connected teachers.'}
              </p>
            </div>
          </div>
          <Link
            to="/student-bookings"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm shrink-0 transition-colors shadow-sm"
          >
            <span>{t('studentDashboard.viewBookingsBtn') || 'Review Requests'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Parent Link Requests (student-side accept / reject) */}
      {!loading && parentRequests.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-3 transition shadow-sm">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200">
              {t('parentStudents.studentRequestsTitle') || 'Parent/Guardian Requests'}
            </h3>
          </div>

          {parentRequestSuccess && (
            <div className="p-3 text-xs bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              {parentRequestSuccess}
            </div>
          )}
          {parentRequestError && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
              {parentRequestError}
            </div>
          )}

          <div className="space-y-2">
            {parentRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/40 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm overflow-hidden">
                    {req.parent?.avatar ? (
                      <img src={req.parent.avatar} alt={req.parent.fullName} className="w-full h-full object-cover" />
                    ) : (
                      (req.parent?.fullName || 'P').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {req.parent?.fullName || (t('parentStudents.studentUnknownParent') || 'Parent')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {req.relationshipType}{req.parent?.role ? ` · ${req.parent.role}` : ''} · {new Date(req.requestedAt).toLocaleDateString()}
                    </p>
                    {req.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">"{req.notes}"</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleParentRequestAction(req.id, 'accept')}
                    disabled={parentActionLoading === req.id}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} />
                    {t('parentStudents.studentAcceptBtn') || 'Accept'}
                  </button>
                  <button
                    onClick={() => handleParentRequestAction(req.id, 'reject')}
                    disabled={parentActionLoading === req.id}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold transition disabled:opacity-50"
                  >
                    <XCircle size={13} />
                    {t('parentStudents.studentRejectBtn') || 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operational 2-Column Section: Next Lesson & Academic Snapshot */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Next Upcoming Lesson Card (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar size={18} className="text-red-600" />
                  <span>{t('studentDashboard.nextLessonTitle') || 'Next Upcoming Lesson'}</span>
                </h3>
                <div className="flex items-center gap-2">
                  <Link
                    to="/student-schedule"
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{t('studentDashboard.viewScheduleBtn') || 'View Schedule'}</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>

              {summary?.nextLesson ? (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-gray-900 dark:text-white">
                        {summary.nextLesson.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                        {summary.nextLesson.lessonType === 'GROUP'
                          ? (t('studentLessons.group') || 'Group')
                          : (t('studentLessons.oneOnOne') || '1-on-1')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-gray-900 dark:text-gray-200">
                        <Clock size={14} className="text-red-600" />
                        {summary.nextLesson.startTime} - {summary.nextLesson.endTime}
                      </span>
                      <span>•</span>
                      <span>{formatLessonDate(summary.nextLesson.date)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User size={13} className="text-gray-400" />
                        {summary.nextLesson.teacher?.name}
                      </span>
                    </div>

                    {summary.nextLesson.homework && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium pt-1">
                        📝 {summary.nextLesson.homework.title}
                      </p>
                    )}
                  </div>

                  <Link
                    to="/student-lessons"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm"
                  >
                    {t('studentLessons.viewDetails') || 'View Details'}
                  </Link>
                </div>
              ) : (
                <div className="py-8 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <Calendar size={28} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('studentDashboard.noUpcomingLesson') || 'No upcoming lessons scheduled'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-sm mx-auto">
                    {t('studentDashboard.noUpcomingLessonHint') || 'Request a lesson booking or view your connected teachers.'}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Link
                      to="/student-find-teacher"
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition"
                    >
                      {t('studentNav.findTeacher') || 'Find a Teacher'}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Connected Teachers strip */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                <GraduationCap size={15} className="text-gray-400" />
                {t('studentDashboard.activeTeachersTitle') || 'My Connected Teachers'}:{' '}
                <span className="font-bold text-gray-900 dark:text-white">
                  {summary?.activeTeachersCount || 0}
                </span>
              </span>
              <Link
                to="/student-teacher"
                className="font-semibold text-red-600 dark:text-red-400 hover:underline"
              >
                {t('studentDashboard.openBtn') || 'View Teachers'} →
              </Link>
            </div>
          </div>

          {/* Academic Snapshot Card (1 col on lg) */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-teal-600" />
                  <span>{t('studentDashboard.academicSnapshotTitle') || 'Academic Snapshot'}</span>
                </h3>
              </div>

              <div className="space-y-3">
                {/* Attendance Rate */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <CalendarCheck size={16} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {t('studentDashboard.attendanceRateLabel') || 'Attendance Rate'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {summary?.stats?.attendancePercentage !== null && summary?.stats?.attendancePercentage !== undefined
                      ? `${summary.stats.attendancePercentage}%`
                      : '—'}
                  </span>
                </div>

                {/* Homework Completion */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                      <FileCheck size={16} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {t('studentDashboard.homeworkRateLabel') || 'Homework Completion'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {summary?.stats?.homeworkPercentage !== null && summary?.stats?.homeworkPercentage !== undefined
                      ? `${summary.stats.homeworkPercentage}%`
                      : '—'}
                  </span>
                </div>

                {/* Average Grade */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                      <Award size={16} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {t('studentDashboard.averageScoreLabel') || 'Average Score'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {summary?.stats?.averagePercentage !== null && summary?.stats?.averagePercentage !== undefined
                      ? `${summary.stats.averagePercentage}%`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-gray-100 dark:border-gray-700/60">
              <Link
                to="/student-progress"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-xs font-semibold transition"
              >
                <span>{t('studentDashboard.checkProgressBtn') || 'View Full Progress'}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}

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
