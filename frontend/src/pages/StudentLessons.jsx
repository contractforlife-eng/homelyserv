// frontend/src/pages/StudentLessons.jsx
// ============================================================
// STUDENT LESSONS PAGE (READ-ONLY)
// Displays authorized lessons for the authenticated student.
// Single source of truth: GET /api/students/lessons
// ============================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import {
  BookOpen,
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock3,
  Loader2,
  X,
  FileText,
  Search,
  Filter,
  Eye,
  CheckSquare,
  Sparkles
} from 'lucide-react';

const StudentLessons = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('ALL');

  // Selected lesson for read-only modal
  const [selectedLesson, setSelectedLesson] = useState(null);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.lessonType = typeFilter;
      if (dateFilter) {
        params.startDate = dateFilter;
        params.endDate = dateFilter;
      }
      if (teacherFilter !== 'ALL') params.teacherId = teacherFilter;

      const res = await api.get('/api/students/lessons', { params });
      if (res.data?.success) {
        setLessons(Array.isArray(res.data.lessons) ? res.data.lessons : []);
      }
    } catch (err) {
      console.error('Failed to load student lessons:', err);
      setErrorMessage(t('studentLessons.loadError') || 'Failed to load lessons.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, dateFilter, teacherFilter, t]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Unique teachers list for filter dropdown
  const teachersList = useMemo(() => {
    const map = new Map();
    lessons.forEach((l) => {
      if (l.teacher?.id && !map.has(l.teacher.id)) {
        map.set(l.teacher.id, l.teacher.name || 'Teacher');
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [lessons]);

  // Statistics calculation
  const stats = useMemo(() => {
    let upcoming = 0;
    let completed = 0;
    lessons.forEach((l) => {
      if (l.lessonStatus === 'SCHEDULED') upcoming += 1;
      if (l.lessonStatus === 'COMPLETED') completed += 1;
    });
    return {
      upcoming,
      completed,
      total: lessons.length
    };
  }, [lessons]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return {
          label: t('studentLessons.statusScheduled') || 'Scheduled',
          classes: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          icon: Clock3
        };
      case 'COMPLETED':
        return {
          label: t('studentLessons.statusCompleted') || 'Completed',
          classes: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: CheckCircle2
        };
      case 'CANCELLED':
        return {
          label: t('studentLessons.statusCancelled') || 'Cancelled',
          classes: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
          icon: XCircle
        };
      case 'NO_SHOW':
        return {
          label: t('studentLessons.statusNoShow') || 'No Show',
          classes: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          icon: AlertCircle
        };
      default:
        return {
          label: status || 'Scheduled',
          classes: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
          icon: Clock3
        };
    }
  };

  const getAttendanceBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return {
          label: t('studentLessons.attendancePresent') || 'Present',
          classes: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: CheckCircle2
        };
      case 'ABSENT':
        return {
          label: t('studentLessons.attendanceAbsent') || 'Absent',
          classes: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          icon: XCircle
        };
      case 'EXCUSED':
        return {
          label: t('studentLessons.attendanceExcused') || 'Excused',
          classes: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: Clock3
        };
      default:
        return {
          label: t('studentLessons.attendanceNotRecorded') || 'Not Recorded',
          classes: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700',
          icon: Clock3
        };
    }
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('studentLessons.headerTitle') || 'Lessons'}
        badge={t('studentNav.studentPortal') || 'Student Portal'}
        badgeColor="red"
      />

      <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-600 hover:text-red-800 dark:hover:text-red-200"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('studentLessons.headerTitle') || 'Lessons'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('studentLessons.subTitle') || 'Your scheduled, completed, and upcoming lessons with your teachers.'}
          </p>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
              <Clock3 size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {t('studentLessons.upcomingStat') || 'Upcoming'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {stats.upcoming}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {t('studentLessons.completedStat') || 'Completed'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {stats.completed}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shrink-0">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {t('studentLessons.totalStat') || 'Total Lessons'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex-1 min-w-[140px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="ALL">{t('studentLessons.filterAll') || 'All'} {t('studentLessons.filterStatus') || 'Status'}</option>
              <option value="SCHEDULED">{t('studentLessons.statusScheduled') || 'Scheduled'}</option>
              <option value="COMPLETED">{t('studentLessons.statusCompleted') || 'Completed'}</option>
              <option value="CANCELLED">{t('studentLessons.statusCancelled') || 'Cancelled'}</option>
              <option value="NO_SHOW">{t('studentLessons.statusNoShow') || 'No Show'}</option>
            </select>
          </div>

          {/* Lesson Type Filter */}
          <div className="flex-1 min-w-[140px]">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="ALL">{t('studentLessons.filterAll') || 'All'} {t('studentLessons.filterType') || 'Types'}</option>
              <option value="ONE_ON_ONE">{t('studentLessons.oneOnOne') || 'One-on-One'}</option>
              <option value="GROUP">{t('studentLessons.group') || 'Group'}</option>
            </select>
          </div>

          {/* Teacher Filter */}
          {teachersList.length > 0 && (
            <div className="flex-1 min-w-[150px]">
              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                <option value="ALL">{t('studentLessons.allTeachers') || 'All Teachers'}</option>
                {teachersList.map((tItem) => (
                  <option key={tItem.id} value={tItem.id}>
                    {tItem.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Filter */}
          <div className="flex-1 min-w-[150px]">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          {/* Clear Filters Button */}
          {(statusFilter !== 'ALL' || typeFilter !== 'ALL' || dateFilter || teacherFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setTypeFilter('ALL');
                setDateFilter('');
                setTeacherFilter('ALL');
              }}
              className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors"
            >
              {t('studentLessons.filterAll') || 'Clear'}
            </button>
          )}
        </div>

        {/* Lessons List / Table */}
        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <Loader2 size={32} className="animate-spin text-red-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('studentLessons.loading') || 'Loading lessons...'}
            </p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <BookOpen size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {t('studentLessons.emptyTitle') || 'No lessons found'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {t('studentLessons.emptySubtitle') || 'No lessons match your current filters or schedule.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">{t('studentLessons.subjectLabel') || 'Subject'}</th>
                    <th className="px-6 py-4">{t('studentLessons.teacherLabel') || 'Teacher'}</th>
                    <th className="px-6 py-4">{t('studentLessons.dateTimeLabel') || 'Date & Time'}</th>
                    <th className="px-6 py-4">{t('studentLessons.typeLabel') || 'Type'}</th>
                    <th className="px-6 py-4">{t('studentLessons.statusLabel') || 'Status'}</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {lessons.map((lesson) => {
                    const statusInfo = getStatusBadge(lesson.lessonStatus);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <tr key={lesson.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                        {/* Subject */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {lesson.subject}
                          </div>
                          {lesson.group?.name && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: lesson.group.color || '#DC2626' }}
                              />
                              <span>{lesson.group.name}</span>
                            </div>
                          )}
                        </td>

                        {/* Teacher */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            {lesson.teacher?.avatar ? (
                              <img
                                src={lesson.teacher.avatar}
                                alt={lesson.teacher.name}
                                className="w-7 h-7 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                                {lesson.teacher?.name ? lesson.teacher.name.charAt(0).toUpperCase() : 'T'}
                              </div>
                            )}
                            <span className="text-gray-900 dark:text-white font-medium text-xs">
                              {lesson.teacher?.name}
                            </span>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="px-6 py-4">
                          <div className="text-gray-900 dark:text-white font-medium text-xs flex items-center gap-1.5">
                            <Calendar size={13} className="text-gray-400" />
                            <span>{lesson.date}</span>
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1.5 mt-0.5">
                            <Clock size={13} className="text-gray-400" />
                            <span>{lesson.startTime} - {lesson.endTime}</span>
                          </div>
                        </td>

                        {/* Lesson Type */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 font-medium">
                            {lesson.lessonType === 'GROUP' ? (
                              <>
                                <Users size={14} className="text-blue-500" />
                                <span>{t('studentLessons.group') || 'Group'}</span>
                              </>
                            ) : (
                              <>
                                <User size={14} className="text-emerald-500" />
                                <span>{t('studentLessons.oneOnOne') || 'One-on-One'}</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${statusInfo.classes}`}>
                            <StatusIcon size={12} />
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLesson(lesson)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 transition-colors"
                          >
                            <Eye size={14} />
                            <span>{t('studentLessons.viewDetailsBtn') || 'View Details'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {lessons.map((lesson) => {
                const statusInfo = getStatusBadge(lesson.lessonStatus);
                const StatusIcon = statusInfo.icon;
                return (
                  <div
                    key={lesson.id}
                    className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-base text-gray-900 dark:text-white">
                          {lesson.subject}
                        </h4>
                        {lesson.group?.name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: lesson.group.color || '#DC2626' }}
                            />
                            <span>{lesson.group.name}</span>
                          </div>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${statusInfo.classes}`}>
                        <StatusIcon size={12} />
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-y border-gray-100 dark:border-gray-700/60 py-2.5">
                      <div>
                        <span className="text-gray-400 block">{t('studentLessons.teacherLabel') || 'Teacher'}</span>
                        <span className="font-medium text-gray-900 dark:text-white mt-0.5 block truncate">
                          {lesson.teacher?.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">{t('studentLessons.dateTimeLabel') || 'Date & Time'}</span>
                        <span className="font-medium text-gray-900 dark:text-white mt-0.5 block">
                          {lesson.date} ({lesson.startTime})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        {lesson.lessonType === 'GROUP' ? <Users size={13} /> : <User size={13} />}
                        <span>{lesson.lessonType === 'GROUP' ? t('studentLessons.group') || 'Group' : t('studentLessons.oneOnOne') || 'One-on-One'}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedLesson(lesson)}
                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1"
                      >
                        <Eye size={14} />
                        <span>{t('studentLessons.viewDetailsBtn') || 'View Details'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Read-Only Lesson Details Modal */}
        {selectedLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-5 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-700/60 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedLesson.subject}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedLesson.date} ({selectedLesson.startTime} - {selectedLesson.endTime})
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadge(selectedLesson.lessonStatus).classes}`}>
                      {getStatusBadge(selectedLesson.lessonStatus).label}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLesson(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Read-Only Banner Notice */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Sparkles size={14} className="text-red-500 shrink-0" />
                <span>{t('studentLessons.readOnlyNotice') || 'This is a read-only view. Lesson details and attendance are managed by your teacher.'}</span>
              </div>

              {/* Lesson Overview Details */}
              <div className="space-y-4 text-xs">
                {/* Teacher & Group */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50">
                  <div>
                    <span className="text-gray-400 block font-medium">{t('studentLessons.teacherLabel') || 'Teacher'}</span>
                    <span className="font-bold text-gray-900 dark:text-white mt-1 block">
                      {selectedLesson.teacher?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">{t('studentLessons.typeLabel') || 'Lesson Type'}</span>
                    <span className="font-bold text-gray-900 dark:text-white mt-1 block">
                      {selectedLesson.lessonType === 'GROUP'
                        ? `${t('studentLessons.group') || 'Group'}${selectedLesson.group?.name ? ` (${selectedLesson.group.name})` : ''}`
                        : t('studentLessons.oneOnOne') || 'One-on-One'}
                    </span>
                  </div>
                </div>

                {/* Student Attendance Section */}
                <div className="space-y-2 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/60">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <CheckSquare size={14} className="text-red-500" />
                    <span>{t('studentLessons.attendanceTitle') || 'My Attendance'}</span>
                  </h4>
                  {selectedLesson.attendance ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${getAttendanceBadge(selectedLesson.attendance.status).classes}`}>
                          {getAttendanceBadge(selectedLesson.attendance.status).label}
                        </span>
                      </div>
                      {selectedLesson.attendance.note && (
                        <p className="text-gray-600 dark:text-gray-300 italic text-[11px] mt-1">
                          "{selectedLesson.attendance.note}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 italic">
                      {t('studentLessons.noAttendance') || 'Attendance has not been recorded yet.'}
                    </p>
                  )}
                </div>

                {/* Homework Section */}
                <div className="space-y-2 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/60">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <FileText size={14} className="text-red-500" />
                    <span>{t('studentLessons.homeworkTitle') || 'Homework / Assignment'}</span>
                  </h4>
                  {selectedLesson.homework?.title || selectedLesson.homework?.description ? (
                    <div className="space-y-2 pt-1">
                      {selectedLesson.homework.title && (
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {selectedLesson.homework.title}
                        </p>
                      )}
                      {selectedLesson.homework.description && (
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {selectedLesson.homework.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700 text-[11px]">
                        {selectedLesson.homework.dueDate && (
                          <span className="text-gray-500 dark:text-gray-400">
                            {t('studentLessons.homeworkDueDate') || 'Due Date'}: {selectedLesson.homework.dueDate.split('T')[0]}
                          </span>
                        )}
                        <span className={`font-semibold ${selectedLesson.homework.isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {selectedLesson.homework.isCompleted
                            ? t('studentLessons.homeworkCompleted') || 'Completed'
                            : t('studentLessons.homeworkPending') || 'Pending'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 italic">
                      {t('studentLessons.noHomework') || 'No homework assigned for this lesson.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLesson(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-colors"
                >
                  {t('studentLessons.closeBtn') || 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentLessons;
