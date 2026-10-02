// frontend/src/pages/TeacherSchedule.jsx
// ============================================================
// TEACHER SCHEDULE PAGE
//
// CRITICAL ARCHITECTURE REQUIREMENTS:
// 1. Single source of truth: Consumes TeacherLesson via:
//    GET /api/teachers/lessons?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// 2. No TeacherSchedule MongoDB model. No duplicated lesson records.
// 3. Calendar Views:
//    - MONTH: 7-column grid (Sun-Sat), compact lesson cards with time,
//      subject, participant, and group color.
//    - WEEK: 7-day columns displaying scheduled slots and status badges.
// 4. Navigation:
//    - Previous / Next / Today
//    - Dynamic date range calculation matching current view (prevents full-history fetch)
// 5. Day selection:
//    - Clicking a day shows the day's agenda drawer/section with full details.
// 6. Lesson details:
//    - Clicking a lesson opens a modal with full details:
//      * ONE_ON_ONE: Student, Homely Student badge, Subject, Date/Time, Status, Attendance, Notes, Homework
//      * GROUP: Group, Enrolled students count, Subject, Date/Time, Status, Attendance, Notes, Homework
//    - Action to navigate to /teacher-lessons for detailed edits/attendance.
// 7. Reuses HomelyStudentBadge (linkedUserId != null).
// 8. Visual language: Red header matching Teacher Dashboard/Lessons/Groups.
// 9. Fully responsive and localized in all 6 languages.
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import HomelyStudentBadge from '../components/teacher/HomelyStudentBadge';
import api from '../utils/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Users,
  Layers,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Plus,
  ExternalLink,
  Filter,
  CheckSquare,
  FileText
} from 'lucide-react';

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Returns YYYY-MM-DD string from a Date instance in local calendar terms.
 */
const formatDateKey = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TeacherSchedule = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // View mode: 'month' | 'week'
  const [viewMode, setViewMode] = useState('month');

  // Currently focused date (anchor for month/week navigation)
  const [currentDate, setCurrentDate] = useState(new Date());

  // Selected date for day agenda view
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()));

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Lesson list and request state
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected lesson modal
  const [activeLesson, setActiveLesson] = useState(null);

  // Compute the visible date range based on viewMode and currentDate
  const visibleRange = useMemo(() => {
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // First day of current month
      const firstOfMonth = new Date(year, month, 1);
      const startingDay = firstOfMonth.getDay(); // 0 = Sun

      // Calendar grid start (back to previous Sunday)
      const startDate = new Date(year, month, 1 - startingDay);

      // Last day of current month
      const lastOfMonth = new Date(year, month + 1, 0);
      const endingDay = lastOfMonth.getDay();

      // Calendar grid end (forward to following Saturday)
      const endDate = new Date(year, month + 1, 6 - endingDay);

      return {
        startDate: formatDateKey(startDate),
        endDate: formatDateKey(endDate)
      };
    } else {
      // Week view: 7 days starting from Sunday
      const d = new Date(currentDate);
      const day = d.getDay();
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - day);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return {
        startDate: formatDateKey(startOfWeek),
        endDate: formatDateKey(endOfWeek)
      };
    }
  }, [viewMode, currentDate]);

  // Fetch lessons for visible date range
  const fetchScheduleLessons = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = new URLSearchParams();
      params.append('startDate', visibleRange.startDate);
      params.append('endDate', visibleRange.endDate);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter !== 'ALL') params.append('lessonType', typeFilter);

      const res = await api.get(`/api/teachers/lessons?${params.toString()}`);
      if (res?.data?.lessons) {
        setLessons(res.data.lessons);
      } else {
        setLessons([]);
      }
    } catch (err) {
      console.error('Error fetching schedule lessons:', err);
      setErrorMessage(t('teacherSchedule.error') || 'Failed to load schedule.');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, [visibleRange, statusFilter, typeFilter, t]);

  useEffect(() => {
    fetchScheduleLessons();
  }, [fetchScheduleLessons]);

  // Group lessons by YYYY-MM-DD
  const lessonsByDate = useMemo(() => {
    const map = {};
    for (const l of lessons) {
      const key = l.date;
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(l);
    }
    // Sort each day's lessons by startTime ascending
    for (const key in map) {
      map[key].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    }
    return map;
  }, [lessons]);

  // Calendar Navigation Handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else {
        d.setDate(d.getDate() - 7);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + 7);
      }
      return d;
    });
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateKey(formatDateKey(today));
  };

  // Header range title
  const currentTitle = useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (viewMode === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      const [startYear, startMonth, startDay] = visibleRange.startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = visibleRange.endDate.split('-').map(Number);
      const sM = monthNames[startMonth - 1].slice(0, 3);
      const eM = monthNames[endMonth - 1].slice(0, 3);
      if (startMonth === endMonth) {
        return `${sM} ${startDay} - ${endDay}, ${startYear}`;
      }
      return `${sM} ${startDay} - ${eM} ${endDay}, ${startYear}`;
    }
  }, [viewMode, currentDate, visibleRange]);

  // Days list for Month Grid
  const monthDays = useMemo(() => {
    if (viewMode !== 'month') return [];
    const list = [];
    const currentMonthNum = currentDate.getMonth();

    const [sY, sM, sD] = visibleRange.startDate.split('-').map(Number);
    const curr = new Date(sY, sM - 1, sD);

    const [eY, eM, eD] = visibleRange.endDate.split('-').map(Number);
    const end = new Date(eY, eM - 1, eD);

    while (curr <= end) {
      list.push({
        date: new Date(curr),
        dateKey: formatDateKey(curr),
        dayNum: curr.getDate(),
        isCurrentMonth: curr.getMonth() === currentMonthNum,
        isToday: formatDateKey(curr) === formatDateKey(new Date())
      });
      curr.setDate(curr.getDate() + 1);
    }
    return list;
  }, [viewMode, currentDate, visibleRange]);

  // Days list for Week View
  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];
    const list = [];
    const [sY, sM, sD] = visibleRange.startDate.split('-').map(Number);
    const curr = new Date(sY, sM - 1, sD);

    for (let i = 0; i < 7; i++) {
      list.push({
        date: new Date(curr),
        dateKey: formatDateKey(curr),
        dayNum: curr.getDate(),
        dayOfWeek: WEEKDAYS[curr.getDay()],
        isToday: formatDateKey(curr) === formatDateKey(new Date())
      });
      curr.setDate(curr.getDate() + 1);
    }
    return list;
  }, [viewMode, visibleRange]);

  // Status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            {t('teacherSchedule.completed') || 'Completed'}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
            {t('teacherSchedule.cancelled') || 'Cancelled'}
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            {t('teacherSchedule.noShow') || 'No Show'}
          </span>
        );
      case 'SCHEDULED':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {t('teacherSchedule.scheduled') || 'Scheduled'}
          </span>
        );
    }
  };

  const selectedDayLessons = lessonsByDate[selectedDateKey] || [];

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('teacherSchedule.headerTitle') || 'Teacher Schedule'}
        subtitle={t('teacherSchedule.subtitle') || 'Calendar and agenda view of your scheduled lessons and classes.'}
      />

      <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-between text-red-700 dark:text-red-300 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchScheduleLessons}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
            >
              {t('teacherSchedule.retry') || 'Retry'}
            </button>
          </div>
        )}

        {/* Controls and Navigation Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Range Title & Prev/Next/Today */}
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white min-w-[200px]">
                {currentTitle}
              </h2>

              <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-1">
                <button
                  onClick={handlePrev}
                  title={t('teacherSchedule.previous') || 'Previous'}
                  className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  {t('teacherSchedule.today') || 'Today'}
                </button>
                <button
                  onClick={handleNext}
                  title={t('teacherSchedule.next') || 'Next'}
                  className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: View Mode Toggle, Filter & Schedule Action */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Month / Week Toggle */}
              <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-1 text-xs font-semibold">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    viewMode === 'month'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
                  }`}
                >
                  {t('teacherSchedule.month') || 'Month'}
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    viewMode === 'week'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
                  }`}
                >
                  {t('teacherSchedule.week') || 'Week'}
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="ALL">{t('teacherSchedule.allStatuses') || 'All Statuses'}</option>
                <option value="SCHEDULED">{t('teacherSchedule.scheduled') || 'Scheduled'}</option>
                <option value="COMPLETED">{t('teacherSchedule.completed') || 'Completed'}</option>
                <option value="CANCELLED">{t('teacherSchedule.cancelled') || 'Cancelled'}</option>
                <option value="NO_SHOW">{t('teacherSchedule.noShow') || 'No Show'}</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="ALL">{t('teacherSchedule.allTypes') || 'All Types'}</option>
                <option value="ONE_ON_ONE">{t('teacherSchedule.oneOnOne') || 'One-on-One'}</option>
                <option value="GROUP">{t('teacherSchedule.groupLesson') || 'Group Lesson'}</option>
              </select>

              {/* Create Lesson navigation */}
              <button
                onClick={() => navigate('/teacher-lessons')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('teacherSchedule.createLesson') || 'Schedule Lesson'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VIEW 1: MONTH VIEW                                           */}
        {/* ============================================================ */}
        {viewMode === 'month' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/30 text-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 py-3">
                {WEEKDAYS.map((w) => (
                  <div key={w}>{t(`teacherSchedule.days.${w}`) || w.toUpperCase()}</div>
                ))}
              </div>

              {/* Month Grid */}
              {loading ? (
                <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
                  <p className="text-sm font-medium">{t('teacherSchedule.loading') || 'Loading schedule...'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-100 dark:divide-gray-700/60 border-b border-gray-100 dark:border-gray-700/60">
                  {monthDays.map((day) => {
                    const dayLessons = lessonsByDate[day.dateKey] || [];
                    const isSelected = day.dateKey === selectedDateKey;

                    return (
                      <div
                        key={day.dateKey}
                        onClick={() => setSelectedDateKey(day.dateKey)}
                        className={`min-h-[110px] p-2 transition-all cursor-pointer flex flex-col justify-between ${
                          !day.isCurrentMonth
                            ? 'bg-gray-50/40 dark:bg-gray-900/20 text-gray-400 dark:text-gray-600'
                            : 'bg-white dark:bg-gray-800'
                        } ${
                          isSelected
                            ? 'ring-2 ring-inset ring-red-500 bg-red-50/20 dark:bg-red-900/10'
                            : 'hover:bg-gray-50/80 dark:hover:bg-gray-750'
                        }`}
                      >
                        {/* Day Number and Today Indicator */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                              day.isToday
                                ? 'bg-red-600 text-white shadow-xs'
                                : day.isCurrentMonth
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}
                          >
                            {day.dayNum}
                          </span>

                          {dayLessons.length > 0 && (
                            <span className="text-[10px] font-semibold text-gray-400">
                              {dayLessons.length}
                            </span>
                          )}
                        </div>

                        {/* Lessons List in Day Cell */}
                        <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                          {dayLessons.slice(0, 3).map((lesson) => {
                            const isOneOnOne = lesson.lessonType === 'ONE_ON_ONE';
                            const accentColor = isOneOnOne ? '#9333EA' : lesson.group?.color || '#DC2626';

                            return (
                              <button
                                key={lesson.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveLesson(lesson);
                                }}
                                className="w-full text-left p-1 rounded-md text-[11px] font-medium leading-tight truncate transition-opacity hover:opacity-80 flex items-center gap-1.5"
                                style={{
                                  backgroundColor: `${accentColor}15`,
                                  color: accentColor,
                                  borderLeft: `2.5px solid ${accentColor}`
                                }}
                              >
                                <span className="font-bold flex-shrink-0">{lesson.startTime}</span>
                                <span className="truncate">{lesson.subject}</span>
                              </button>
                            );
                          })}

                          {dayLessons.length > 3 && (
                            <p className="text-[10px] text-gray-400 font-semibold pl-1">
                              +{dayLessons.length - 3} more
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Day Agenda Drawer */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      {t('teacherSchedule.dayAgendaTitle', { date: selectedDateKey }) || `Lessons for ${selectedDateKey}`}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {t('teacherSchedule.totalLessonsOnDay', { count: selectedDayLessons.length }) ||
                        `${selectedDayLessons.length} lesson(s) scheduled`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/teacher-lessons')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  <span>{t('teacherSchedule.openLessonsPage') || 'Manage in Lessons'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {selectedDayLessons.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                  {t('teacherSchedule.noLessonsOnDate') || 'No lessons scheduled for this date.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedDayLessons.map((l) => {
                    const isOneOnOne = l.lessonType === 'ONE_ON_ONE';
                    const color = isOneOnOne ? '#9333EA' : l.group?.color || '#DC2626';

                    return (
                      <div
                        key={l.id}
                        onClick={() => setActiveLesson(l)}
                        className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/20 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                {l.subject}
                              </h4>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{l.startTime} - {l.endTime}</span>
                            </div>
                          </div>
                          {getStatusBadge(l.lessonStatus)}
                        </div>

                        <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                          {isOneOnOne ? (
                            <div className="flex items-center gap-1.5 truncate">
                              <User className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                              <span className="font-medium truncate">{l.student?.fullName}</span>
                              {l.student?.isHomelyStudent && <HomelyStudentBadge />}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 truncate">
                              <Layers className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                              <span className="font-medium truncate">{l.group?.name}</span>
                              <span className="text-[11px] text-gray-400">
                                ({l.groupStudentCount || 0} students)
                              </span>
                            </div>
                          )}
                          <span className="text-[11px] font-semibold text-red-600 hover:underline">
                            {t('teacherSchedule.viewLesson') || 'Details'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: WEEK VIEW                                            */}
        {/* ============================================================ */}
        {viewMode === 'week' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
                <p className="text-sm font-medium">{t('teacherSchedule.loading') || 'Loading schedule...'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700/60">
                {weekDays.map((day) => {
                  const dayLessons = lessonsByDate[day.dateKey] || [];

                  return (
                    <div
                      key={day.dateKey}
                      className={`min-h-[400px] flex flex-col ${
                        day.isToday ? 'bg-red-50/20 dark:bg-red-900/10' : 'bg-white dark:bg-gray-800'
                      }`}
                    >
                      {/* Day Header */}
                      <div className="p-3 border-b border-gray-100 dark:border-gray-700/60 text-center">
                        <p className="text-xs uppercase font-bold text-gray-400">
                          {t(`teacherSchedule.days.${day.dayOfWeek}`) || day.dayOfWeek.toUpperCase()}
                        </p>
                        <p
                          className={`text-base font-extrabold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full ${
                            day.isToday ? 'bg-red-600 text-white' : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {day.dayNum}
                        </p>
                      </div>

                      {/* Day Lessons Column */}
                      <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                        {dayLessons.length === 0 ? (
                          <div className="h-full flex items-center justify-center p-4 text-center">
                            <span className="text-[11px] text-gray-400">
                              {t('teacherSchedule.noLessonsOnDate') || 'No lessons'}
                            </span>
                          </div>
                        ) : (
                          dayLessons.map((l) => {
                            const isOneOnOne = l.lessonType === 'ONE_ON_ONE';
                            const color = isOneOnOne ? '#9333EA' : l.group?.color || '#DC2626';

                            return (
                              <div
                                key={l.id}
                                onClick={() => setActiveLesson(l)}
                                className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-all cursor-pointer space-y-1.5"
                                style={{ borderLeft: `3px solid ${color}` }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-gray-900 dark:text-white">
                                    {l.startTime} - {l.endTime}
                                  </span>
                                  {getStatusBadge(l.lessonStatus)}
                                </div>

                                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                  {l.subject}
                                </p>

                                {isOneOnOne ? (
                                  <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400 truncate">
                                    <User className="w-3 h-3 text-purple-600 flex-shrink-0" />
                                    <span className="truncate">{l.student?.fullName}</span>
                                    {l.student?.isHomelyStudent && <HomelyStudentBadge />}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400 truncate">
                                    <Layers className="w-3 h-3 text-teal-600 flex-shrink-0" />
                                    <span className="truncate">{l.group?.name}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: LESSON DETAILS                                        */}
        {/* ============================================================ */}
        {activeLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700/60 my-8 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {activeLesson.subject}
                      </h3>
                      {getStatusBadge(activeLesson.lessonStatus)}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activeLesson.date} &bull; {activeLesson.startTime} - {activeLesson.endTime}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveLesson(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lesson Overview */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">
                    {t('teacherSchedule.student') || 'Participant'}
                  </p>
                  {activeLesson.lessonType === 'ONE_ON_ONE' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {activeLesson.student?.fullName || '—'}
                      </span>
                      {activeLesson.student?.isHomelyStudent && <HomelyStudentBadge />}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Layers className="w-4 h-4 text-teal-600" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {activeLesson.group?.name || '—'}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({activeLesson.groupStudentCount || 0} students)
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">
                    {t('teacherSchedule.subject') || 'Lesson Type'}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">
                    {activeLesson.lessonType === 'ONE_ON_ONE'
                      ? t('teacherSchedule.oneOnOne') || 'One-on-One'
                      : t('teacherSchedule.groupLesson') || 'Group Lesson'}
                  </p>
                </div>

                {activeLesson.notes && (
                  <div className="sm:col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700/60">
                    <p className="text-xs text-gray-400 uppercase font-semibold">
                      {t('teacherSchedule.notes') || 'Teacher Notes'}
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                      {activeLesson.notes}
                    </p>
                  </div>
                )}

                {activeLesson.homework?.title && (
                  <div className="sm:col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700/60">
                    <p className="text-xs text-gray-400 uppercase font-semibold">
                      {t('teacherSchedule.homework') || 'Homework'}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {activeLesson.homework.title}
                      </span>
                      {activeLesson.homework.dueDate && (
                        <span className="text-xs text-gray-500">
                          Due: {activeLesson.homework.dueDate}
                        </span>
                      )}
                    </div>
                    {activeLesson.homework.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {activeLesson.homework.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Attendance Summary */}
              {activeLesson.attendance?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-red-600" />
                    <span>{t('teacherSchedule.attendance') || 'Attendance Summary'}</span>
                  </h4>
                  <div className="max-h-36 overflow-y-auto space-y-1.5">
                    {activeLesson.attendance.map((att, i) => (
                      <div
                        key={att.studentId || i}
                        className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {att.studentName || 'Student'}
                        </span>
                        <span className="font-semibold text-gray-600 dark:text-gray-300">
                          {att.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700/60">
                <button
                  onClick={() => {
                    setActiveLesson(null);
                    navigate('/teacher-lessons');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  <span>{t('teacherSchedule.openLessonsPage') || 'Manage in Lessons'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveLesson(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherSchedule;
