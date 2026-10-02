// frontend/src/pages/StudentSchedule.jsx
// ============================================================
// STUDENT SCHEDULE PAGE (READ-ONLY)
// Calendar & timetable projection of GET /api/students/lessons
// Supports Month, Week, and Day/Agenda views.
// ============================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock3,
  User,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  FileText,
  CheckSquare,
  Sparkles,
  Eye
} from 'lucide-react';

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const formatDateKey = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const StudentSchedule = () => {
  const { t } = useTranslation();

  // View modes: 'month' | 'week' | 'day'
  const [viewMode, setViewMode] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()));

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected lesson for read-only modal
  const [selectedLesson, setSelectedLesson] = useState(null);

  // Compute date range for query based on viewMode and currentDate
  const visibleRange = useMemo(() => {
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstOfMonth = new Date(year, month, 1);
      const startingDay = firstOfMonth.getDay();

      const startDate = new Date(year, month, 1 - startingDay);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 41); // 6 full weeks
      return {
        startDate: formatDateKey(startDate),
        endDate: formatDateKey(endDate)
      };
    } else if (viewMode === 'week') {
      const curr = new Date(currentDate);
      const day = curr.getDay();
      const start = new Date(curr);
      start.setDate(curr.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return {
        startDate: formatDateKey(start),
        endDate: formatDateKey(end)
      };
    } else {
      // Day view
      const key = formatDateKey(currentDate);
      return {
        startDate: key,
        endDate: key
      };
    }
  }, [viewMode, currentDate]);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get('/api/students/lessons', {
        params: {
          startDate: visibleRange.startDate,
          endDate: visibleRange.endDate
        }
      });
      if (res.data?.success) {
        setLessons(Array.isArray(res.data.lessons) ? res.data.lessons : []);
      }
    } catch (err) {
      console.error('Failed to load student schedule:', err);
      setErrorMessage(t('studentSchedule.loadError') || 'Failed to load schedule.');
    } finally {
      setLoading(false);
    }
  }, [visibleRange, t]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Group lessons by date key YYYY-MM-DD
  const lessonsByDate = useMemo(() => {
    const map = new Map();
    lessons.forEach((l) => {
      if (l.date) {
        const list = map.get(l.date) || [];
        list.push(l);
        map.set(l.date, list);
      }
    });
    return map;
  }, [lessons]);

  // Lessons on selected date for day agenda view
  const dayLessons = useMemo(() => {
    const list = lessonsByDate.get(selectedDateKey) || [];
    return list.slice().sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [lessonsByDate, selectedDateKey]);

  // Calendar Navigation
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
    setSelectedDateKey(formatDateKey(next));
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
    setSelectedDateKey(formatDateKey(next));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateKey(formatDateKey(today));
  };

  // Calendar title label (e.g. October 2026)
  const headerDateLabel = useMemo(() => {
    return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Month grid days (42 cells)
  const monthDays = useMemo(() => {
    if (viewMode !== 'month') return [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();

    const days = [];
    const iter = new Date(year, month, 1 - startOffset);
    for (let i = 0; i < 42; i++) {
      days.push({
        date: new Date(iter),
        dateKey: formatDateKey(iter),
        isCurrentMonth: iter.getMonth() === month,
        isToday: formatDateKey(iter) === formatDateKey(new Date())
      });
      iter.setDate(iter.getDate() + 1);
    }
    return days;
  }, [currentDate, viewMode]);

  // Week grid days (7 columns)
  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const start = new Date(curr);
    start.setDate(curr.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({
        date: d,
        dateKey: formatDateKey(d),
        isToday: formatDateKey(d) === formatDateKey(new Date())
      });
    }
    return days;
  }, [currentDate, viewMode]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return {
          label: t('studentLessons.statusScheduled') || 'Scheduled',
          classes: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
        };
      case 'COMPLETED':
        return {
          label: t('studentLessons.statusCompleted') || 'Completed',
          classes: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        };
      case 'CANCELLED':
        return {
          label: t('studentLessons.statusCancelled') || 'Cancelled',
          classes: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
        };
      case 'NO_SHOW':
        return {
          label: t('studentLessons.statusNoShow') || 'No Show',
          classes: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
        };
      default:
        return {
          label: status || 'Scheduled',
          classes: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
        };
    }
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('studentSchedule.headerTitle') || 'Schedule'}
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

        {/* Top Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('studentSchedule.headerTitle') || 'Schedule'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('studentSchedule.subTitle') || 'Your weekly timetable and calendar of upcoming classes.'}
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              {t('studentSchedule.viewMonth') || 'Month'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              {t('studentSchedule.viewWeek') || 'Week'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              {t('studentSchedule.viewDay') || 'Day / Agenda'}
            </button>
          </div>
        </div>

        {/* Date Navigator Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              title={t('studentSchedule.previous') || 'Previous'}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              title={t('studentSchedule.next') || 'Next'}
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors ml-1"
            >
              {t('studentSchedule.today') || 'Today'}
            </button>
          </div>

          <div className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
            {headerDateLabel}
          </div>

          <div className="w-16"></div>
        </div>

        {/* Main Calendar Display */}
        {loading ? (
          <div className="p-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <Loader2 size={32} className="animate-spin text-red-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('studentSchedule.loading') || 'Loading timetable...'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* MONTH VIEW */}
            {viewMode === 'month' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-3">
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="capitalize">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-gray-700/60">
                  {monthDays.map((cell) => {
                    const cellLessons = lessonsByDate.get(cell.dateKey) || [];
                    const isSelected = cell.dateKey === selectedDateKey;

                    return (
                      <div
                        key={cell.dateKey}
                        onClick={() => setSelectedDateKey(cell.dateKey)}
                        className={`min-h-[105px] p-2 transition-colors cursor-pointer flex flex-col justify-between ${
                          cell.isCurrentMonth
                            ? 'bg-white dark:bg-gray-800'
                            : 'bg-gray-50/50 dark:bg-gray-900/30 text-gray-400'
                        } ${isSelected ? 'ring-2 ring-red-500/40' : ''} hover:bg-red-50/20 dark:hover:bg-red-950/10`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                              cell.isToday
                                ? 'bg-red-600 text-white shadow-sm'
                                : cell.isCurrentMonth
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-400'
                            }`}
                          >
                            {cell.date.getDate()}
                          </span>
                          {cellLessons.length > 0 && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                              {cellLessons.length}
                            </span>
                          )}
                        </div>

                        {/* Lesson Chips (up to 2 visible) */}
                        <div className="space-y-1 flex-1">
                          {cellLessons.slice(0, 2).map((lesson) => (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLesson(lesson);
                              }}
                              className="w-full text-left p-1 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[10px] font-medium truncate block hover:bg-red-100 transition-colors"
                            >
                              <span className="font-bold mr-1">{lesson.startTime}</span>
                              <span>{lesson.subject}</span>
                            </button>
                          ))}
                          {cellLessons.length > 2 && (
                            <div className="text-[10px] text-gray-400 font-medium pl-1">
                              +{cellLessons.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WEEK VIEW */}
            {viewMode === 'week' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
                <div className="grid grid-cols-7 min-w-[700px] divide-x divide-gray-200 dark:divide-gray-700">
                  {weekDays.map((col) => {
                    const colLessons = lessonsByDate.get(col.dateKey) || [];
                    const isSelected = col.dateKey === selectedDateKey;

                    return (
                      <div
                        key={col.dateKey}
                        onClick={() => setSelectedDateKey(col.dateKey)}
                        className={`min-h-[300px] p-3 flex flex-col cursor-pointer transition-colors ${
                          isSelected ? 'bg-red-50/20 dark:bg-red-950/10' : ''
                        }`}
                      >
                        <div className="text-center pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase">
                            {col.date.toLocaleDateString('default', { weekday: 'short' })}
                          </p>
                          <p
                            className={`text-sm font-bold mt-1 w-7 h-7 rounded-full flex items-center justify-center mx-auto ${
                              col.isToday
                                ? 'bg-red-600 text-white'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {col.date.getDate()}
                          </p>
                        </div>

                        <div className="space-y-2 flex-1">
                          {colLessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLesson(lesson);
                              }}
                              className="p-2.5 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-xs space-y-1 hover:shadow-sm transition-shadow cursor-pointer"
                            >
                              <div className="font-bold text-gray-900 dark:text-white truncate">
                                {lesson.subject}
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Clock size={11} />
                                <span>{lesson.startTime} - {lesson.endTime}</span>
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                {lesson.teacher?.name}
                              </div>
                            </div>
                          ))}
                          {colLessons.length === 0 && (
                            <p className="text-[11px] text-gray-400 italic text-center pt-8">
                              —
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DAY AGENDA DRAWER SECTION (visible for selected day in month/week, or full day view) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={18} className="text-red-600" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {t('studentSchedule.dayAgendaTitle', { date: selectedDateKey })}
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {dayLessons.length} {t('studentLessons.headerTitle') || 'Lessons'}
                </span>
              </div>

              {dayLessons.length === 0 ? (
                <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                  {t('studentSchedule.noLessonsOnDay') || 'No lessons scheduled for this day.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {dayLessons.map((lesson) => {
                    const statusInfo = getStatusBadge(lesson.lessonStatus);
                    return (
                      <div
                        key={lesson.id}
                        className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                              {lesson.subject}
                            </h4>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${statusInfo.classes}`}>
                              {statusInfo.label}
                            </span>
                          </div>

                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-red-500" />
                              <span>{lesson.startTime} - {lesson.endTime}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User size={13} className="text-red-500" />
                              <span>{lesson.teacher?.name}</span>
                            </div>
                            {lesson.group?.name && (
                              <div className="flex items-center gap-1.5">
                                <Users size={13} className="text-red-500" />
                                <span>{lesson.group.name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedLesson(lesson)}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                          >
                            <Eye size={13} />
                            <span>{t('studentSchedule.viewLessonBtn') || 'View Details'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Read-Only Lesson Details Modal */}
        {selectedLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-5 max-h-[90vh] overflow-y-auto">
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

              {/* Read-Only Notice */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Sparkles size={14} className="text-red-500 shrink-0" />
                <span>{t('studentLessons.readOnlyNotice') || 'This is a read-only view. Lesson details and attendance are managed by your teacher.'}</span>
              </div>

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

                {/* Attendance */}
                <div className="space-y-2 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/60">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <CheckSquare size={14} className="text-red-500" />
                    <span>{t('studentLessons.attendanceTitle') || 'My Attendance'}</span>
                  </h4>
                  {selectedLesson.attendance ? (
                    <div className="space-y-1.5 pt-1">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs block">
                        {selectedLesson.attendance.status}
                      </span>
                      {selectedLesson.attendance.note && (
                        <p className="text-gray-600 dark:text-gray-300 italic text-[11px]">
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

                {/* Homework */}
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
                        <span className={`font-semibold ${selectedLesson.homework.isCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>
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

export default StudentSchedule;
