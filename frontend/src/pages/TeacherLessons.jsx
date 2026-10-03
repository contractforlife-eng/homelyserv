// frontend/src/pages/TeacherLessons.jsx
// ============================================================
// TEACHER LESSONS PAGE
//
// CRITICAL ARCHITECTURE REQUIREMENTS:
// 1. Unified lessons management: List all Teacher's lessons (ONE_ON_ONE & GROUP).
// 2. Filter bar:
//    - Date filter (input type="date")
//    - Status filter: ALL, SCHEDULED, COMPLETED, CANCELLED, NO_SHOW
//    - Lesson Type filter: ALL, ONE_ON_ONE, GROUP
//    - Subject search input
// 3. Stat Summary Cards:
//    - Total Lessons
//    - Scheduled / Upcoming Lessons
//    - Completed Lessons
// 4. Lessons Table / Cards:
//    - Shows student name + HomelyStudentBadge if ONE_ON_ONE
//    - Shows group name + student count if GROUP
//    - Subject, Date, Start/End times, Status badge
//    - Actions: View Details, Edit, Cancel/Delete
// 5. Create / Edit Lesson Modal:
//    - Toggle/Radio: ONE_ON_ONE vs GROUP
//    - If ONE_ON_ONE: Dropdown of active TeacherStudents (showing Homely Student indicator)
//    - If GROUP: Dropdown of active TeacherGroups
//    - Subject, Date, Start Time, End Time (with client validation startTime < endTime)
//    - Status dropdown
//    - Private teacher notes
//    - Homework fields (title, description, dueDate)
// 6. Lesson Details Modal:
//    - Full lesson info, student/group info, notes, homework status
//    - Attendance tracking UI:
//      * ONE_ON_ONE: Status selector (PRESENT, ABSENT, EXCUSED, NOT_RECORDED) + note
//      * GROUP: List of enrolled students with attendance status selectors
//      * "Save Attendance" action calling PUT /api/teachers/lessons/:id/attendance
// 7. Reuses HomelyStudentBadge (shown if and only if linkedUserId != null).
// 8. Tenancy isolation: Guaranteed server-side via req.userId.
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import HomelyStudentBadge from '../components/teacher/HomelyStudentBadge';
import { TEACHER_SUBJECTS } from '../constants/teacherTaxonomy';
import api from '../utils/api';
import {
  BookOpen,
  Calendar,
  Clock,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  User,
  Layers,
  CheckSquare,
  FileText,
  Save,
  ChevronRight,
  Filter
} from 'lucide-react';

import TeacherBookingRequestsTab from '../components/teacher/TeacherBookingRequestsTab';

const INPUT_CLS =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all';

const initialLessonForm = {
  lessonType: 'ONE_ON_ONE',
  studentId: '',
  groupId: '',
  subject: '',
  date: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '10:00',
  lessonStatus: 'SCHEDULED',
  notes: '',
  homeworkTitle: '',
  homeworkDesc: '',
  homeworkDueDate: '',
  homeworkIsCompleted: false
};

const TeacherLessons = () => {
  const { t } = useTranslation();

  // Active top-level tab: 'lessons' | 'bookings'
  const [activeTab, setActiveTab] = useState('lessons');
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Selected lesson for details view
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [attendanceState, setAttendanceState] = useState([]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState('');

  // Lesson Form (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState(initialLessonForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Dropdown options
  const [availableStudents, setAvailableStudents] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Cancel / Delete Modal
  const [cancellingLesson, setCancellingLesson] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Fetch dropdown options for students and groups
  const fetchDropdownOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const [studentsRes, groupsRes] = await Promise.all([
        api.get('/api/teachers/students?status=ACTIVE'),
        api.get('/api/teachers/groups?status=ACTIVE')
      ]);

      if (studentsRes?.data?.students) {
        setAvailableStudents(studentsRes.data.students);
      }
      if (groupsRes?.data?.groups) {
        setAvailableGroups(groupsRes.data.groups);
      }
    } catch (err) {
      console.error('Error fetching dropdown options for lessons:', err);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  // Fetch lessons list with filters
  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter !== 'ALL') params.append('lessonType', typeFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/api/teachers/lessons?${params.toString()}`);
      if (res?.data?.lessons) {
        setLessons(res.data.lessons);
      } else {
        setLessons([]);
      }
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setErrorMessage(t('teacherLessons.messages.loadError') || 'Failed to load lessons.');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, dateFilter, searchQuery, t]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  useEffect(() => {
    fetchDropdownOptions();
  }, [fetchDropdownOptions]);

  // Load detailed lesson for Details Modal
  const handleOpenDetails = async (lesson) => {
    setLoadingDetails(true);
    setAttendanceMessage('');
    try {
      const res = await api.get(`/api/teachers/lessons/${lesson.id}`);
      const l = res?.data?.lesson || lesson;
      setSelectedLesson(l);

      // Initialize attendance state
      if (l.lessonType === 'ONE_ON_ONE') {
        const existingAtt = l.attendance?.[0];
        setAttendanceState([
          {
            studentId: l.studentId,
            studentName: l.student?.fullName || '',
            isHomelyStudent: Boolean(l.student?.isHomelyStudent),
            status: existingAtt?.status || 'NOT_RECORDED',
            note: existingAtt?.note || ''
          }
        ]);
      } else {
        // Group lesson: Merge group students with attendance records
        const groupStudents = res?.data?.groupStudents || [];
        const existingAttMap = (l.attendance || []).reduce((acc, curr) => {
          acc[curr.studentId] = curr;
          return acc;
        }, {});

        const merged = groupStudents.map((s) => {
          const recorded = existingAttMap[s.studentId];
          return {
            studentId: s.studentId,
            studentName: s.fullName,
            isHomelyStudent: s.isHomelyStudent,
            status: recorded?.status || 'NOT_RECORDED',
            note: recorded?.note || ''
          };
        });

        // If no groupStudents returned or group attendance was initialized
        if (merged.length === 0 && l.attendance?.length > 0) {
          setAttendanceState(l.attendance);
        } else {
          setAttendanceState(merged);
        }
      }
    } catch (err) {
      console.error('Error fetching lesson details:', err);
      setSelectedLesson(lesson);
      setAttendanceState(lesson.attendance || []);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    if (!selectedLesson) return;
    setSavingAttendance(true);
    setAttendanceMessage('');
    try {
      const payload = {
        attendance: attendanceState.map((a) => ({
          studentId: a.studentId,
          status: a.status,
          note: a.note || ''
        }))
      };

      const res = await api.put(`/api/teachers/lessons/${selectedLesson.id}/attendance`, payload);
      if (res?.data?.lesson) {
        setSelectedLesson(res.data.lesson);
        // Refresh main list
        setLessons((prev) =>
          prev.map((l) => (l.id === selectedLesson.id ? res.data.lesson : l))
        );
      }
      setAttendanceMessage(t('teacherLessons.messages.attendanceSuccess') || 'Attendance saved successfully.');
      setTimeout(() => setAttendanceMessage(''), 3000);
    } catch (err) {
      console.error('Error saving attendance:', err);
      setAttendanceMessage(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingLesson(null);
    setLessonForm({
      ...initialLessonForm,
      subject: availableGroups[0]?.subject || TEACHER_SUBJECTS[0] || 'Mathematics'
    });
    setFormError('');
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      lessonType: lesson.lessonType,
      studentId: lesson.studentId || '',
      groupId: lesson.groupId || '',
      subject: lesson.subject || '',
      date: lesson.date || new Date().toISOString().split('T')[0],
      startTime: lesson.startTime || '09:00',
      endTime: lesson.endTime || '10:00',
      lessonStatus: lesson.lessonStatus || 'SCHEDULED',
      notes: lesson.notes || '',
      homeworkTitle: lesson.homework?.title || '',
      homeworkDesc: lesson.homework?.description || '',
      homeworkDueDate: lesson.homework?.dueDate || '',
      homeworkIsCompleted: Boolean(lesson.homework?.isCompleted)
    });
    setFormError('');
    setIsFormOpen(true);
  };

  // Handle Form Submit (Create or Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!lessonForm.subject.trim()) {
      setFormError(t('teacherLessons.messages.subjectRequired') || 'Subject is required.');
      return;
    }

    if (!lessonForm.date) {
      setFormError(t('teacherLessons.messages.dateRequired') || 'Lesson date is required.');
      return;
    }

    if (lessonForm.lessonType === 'ONE_ON_ONE' && !lessonForm.studentId) {
      setFormError(t('teacherLessons.messages.studentRequired') || 'Please select a student.');
      return;
    }

    if (lessonForm.lessonType === 'GROUP' && !lessonForm.groupId) {
      setFormError(t('teacherLessons.messages.groupRequired') || 'Please select a group.');
      return;
    }

    // Time validation client-side
    const [startH, startM] = (lessonForm.startTime || '').split(':').map(Number);
    const [endH, endM] = (lessonForm.endTime || '').split(':').map(Number);
    if ((endH * 60 + endM) <= (startH * 60 + startM)) {
      setFormError(t('teacherLessons.messages.timeError') || 'End time must be after start time.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        lessonType: lessonForm.lessonType,
        studentId: lessonForm.lessonType === 'ONE_ON_ONE' ? lessonForm.studentId : undefined,
        groupId: lessonForm.lessonType === 'GROUP' ? lessonForm.groupId : undefined,
        subject: lessonForm.subject.trim(),
        date: lessonForm.date,
        startTime: lessonForm.startTime,
        endTime: lessonForm.endTime,
        lessonStatus: lessonForm.lessonStatus,
        notes: lessonForm.notes.trim(),
        homework: lessonForm.homeworkTitle.trim()
          ? {
              title: lessonForm.homeworkTitle.trim(),
              description: lessonForm.homeworkDesc.trim(),
              dueDate: lessonForm.homeworkDueDate || null,
              isCompleted: lessonForm.homeworkIsCompleted
            }
          : null
      };

      if (editingLesson) {
        const res = await api.put(`/api/teachers/lessons/${editingLesson.id}`, payload);
        setSuccessMessage(t('teacherLessons.messages.updateSuccess') || 'Lesson updated successfully.');
        setLessons((prev) =>
          prev.map((l) => (l.id === editingLesson.id ? res.data.lesson : l))
        );
      } else {
        const res = await api.post('/api/teachers/lessons', payload);
        setSuccessMessage(t('teacherLessons.messages.createSuccess') || 'Lesson scheduled successfully.');
        setLessons((prev) => [res.data.lesson, ...prev]);
      }

      setIsFormOpen(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error saving lesson:', err);
      setFormError(err.response?.data?.message || 'Failed to save lesson.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Cancel / Delete Lesson
  const handleConfirmCancelLesson = async () => {
    if (!cancellingLesson) return;
    setCancelling(true);
    try {
      await api.delete(`/api/teachers/lessons/${cancellingLesson.id}`);
      setSuccessMessage(t('teacherLessons.messages.cancelSuccess') || 'Lesson cancelled successfully.');
      setLessons((prev) => prev.filter((l) => l.id !== cancellingLesson.id));
      if (selectedLesson?.id === cancellingLesson.id) {
        setSelectedLesson(null);
      }
      setCancellingLesson(null);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error cancelling lesson:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to cancel lesson.');
    } finally {
      setCancelling(false);
    }
  };

  // Stat calculations
  const stats = useMemo(() => {
    const total = lessons.length;
    const scheduled = lessons.filter((l) => l.lessonStatus === 'SCHEDULED').length;
    const completed = lessons.filter((l) => l.lessonStatus === 'COMPLETED').length;
    return { total, scheduled, completed };
  }, [lessons]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            {t('teacherLessons.status.completed') || 'Completed'}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
            {t('teacherLessons.status.cancelled') || 'Cancelled'}
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            {t('teacherLessons.status.noShow') || 'No Show'}
          </span>
        );
      case 'SCHEDULED':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {t('teacherLessons.status.scheduled') || 'Scheduled'}
          </span>
        );
    }
  };

  const getAttendanceBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            {t('teacherLessons.attendanceStatus.present') || 'Present'}
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
            {t('teacherLessons.attendanceStatus.absent') || 'Absent'}
          </span>
        );
      case 'EXCUSED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            {t('teacherLessons.attendanceStatus.excused') || 'Excused'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {t('teacherLessons.attendanceStatus.notRecorded') || 'Not Recorded'}
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('teacherLessons.headerTitle') || 'Lessons'}
        subtitle={t('teacherLessons.subtitle') || 'Schedule and manage your individual and group lessons.'}
      />

      <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">

        {/* Alerts */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1">{errorMessage}</p>
            <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1">{successMessage}</p>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs: Lessons vs Booking Requests */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'lessons'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <BookOpen size={16} />
            <span>{t('teacherLessons.tabs.allLessons') || 'Scheduled Lessons'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Calendar size={16} />
            <span>{t('teacherLessons.tabs.bookingRequests') || 'Booking Requests'}</span>
            {pendingBookingsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950">
                {pendingBookingsCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'bookings' ? (
          <TeacherBookingRequestsTab onUpdateCount={setPendingBookingsCount} />
        ) : (
          <>
        {/* Stat Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('teacherLessons.totalLessons') || 'Total Lessons'}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{stats.total}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('teacherLessons.scheduledLessons') || 'Upcoming / Scheduled'}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{stats.scheduled}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('teacherLessons.completedLessons') || 'Completed Lessons'}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{stats.completed}</h3>
            </div>
          </div>
        </div>

        {/* Action & Filter Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('teacherLessons.searchPlaceholder') || 'Search lessons by subject...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>

            {/* Create Lesson Button */}
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-all flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t('teacherLessons.createLessonBtn') || 'Create Lesson'}</span>
            </button>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="ALL">{t('teacherLessons.allStatuses') || 'All Statuses'}</option>
                <option value="SCHEDULED">{t('teacherLessons.status.scheduled') || 'Scheduled'}</option>
                <option value="COMPLETED">{t('teacherLessons.status.completed') || 'Completed'}</option>
                <option value="CANCELLED">{t('teacherLessons.status.cancelled') || 'Cancelled'}</option>
                <option value="NO_SHOW">{t('teacherLessons.status.noShow') || 'No Show'}</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="ALL">{t('teacherLessons.allTypes') || 'All Types'}</option>
                <option value="ONE_ON_ONE">{t('teacherLessons.types.oneOnOne') || 'One-on-One'}</option>
                <option value="GROUP">{t('teacherLessons.types.group') || 'Group Lesson'}</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lessons List / Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
              <p className="text-sm font-medium">Loading lessons...</p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={BookOpen}
                title={
                  searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL' || dateFilter
                    ? t('teacherLessons.noSearchResults') || 'No matching lessons found'
                    : t('teacherLessons.noLessons') || 'No lessons found'
                }
                description={
                  searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL' || dateFilter
                    ? t('teacherLessons.noSearchResultsDesc') || 'Try adjusting your search terms or filters.'
                    : t('teacherLessons.noLessonsDesc') || 'You have not scheduled any lessons yet. Click "Create Lesson" to get started.'
                }
                actionLabel={t('teacherLessons.createLessonBtn') || 'Create Lesson'}
                onAction={handleOpenCreateModal}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/20 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="py-3.5 px-4">{t('teacherLessons.fields.subject') || 'Subject'}</th>
                    <th className="py-3.5 px-4">{t('teacherLessons.fields.lessonType') || 'Type'} & Participant</th>
                    <th className="py-3.5 px-4">{t('teacherLessons.fields.date') || 'Date'} & Time</th>
                    <th className="py-3.5 px-4">{t('teacherLessons.fields.status') || 'Status'}</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-sm">
                  {lessons.map((lesson) => {
                    const isOneOnOne = lesson.lessonType === 'ONE_ON_ONE';
                    return (
                      <tr
                        key={lesson.id}
                        className="hover:bg-gray-50/80 dark:hover:bg-gray-750 transition-colors"
                      >
                        {/* Subject */}
                        <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: lesson.group?.color || '#DC2626' }}
                            />
                            <span>{lesson.subject}</span>
                          </div>
                        </td>

                        {/* Type & Participant */}
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-300">
                          {isOneOnOne ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                <User className="w-3 h-3" />
                                {t('teacherLessons.types.oneOnOne') || '1-on-1'}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {lesson.student?.fullName || '—'}
                              </span>
                              {lesson.student?.isHomelyStudent && <HomelyStudentBadge />}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                                <Layers className="w-3 h-3" />
                                {t('teacherLessons.types.group') || 'Group'}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {lesson.group?.name || '—'}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({lesson.groupStudentCount || 0} students)
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Date & Time */}
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1.5 text-xs text-gray-900 dark:text-white font-medium">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{lesson.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{lesson.startTime} - {lesson.endTime}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {getStatusBadge(lesson.lessonStatus)}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenDetails(lesson)}
                              title={t('teacherLessons.actions.viewDetails') || 'View Details'}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(lesson)}
                              title={t('teacherLessons.actions.edit') || 'Edit'}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCancellingLesson(lesson)}
                              title={t('teacherLessons.actions.cancelLesson') || 'Cancel Lesson'}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* MODAL 1: CREATE / EDIT LESSON                                */}
        {/* ============================================================ */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700/60 my-8 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {editingLesson
                        ? t('teacherLessons.editLessonTitle') || 'Edit Lesson'
                        : t('teacherLessons.createLessonTitle') || 'Schedule New Lesson'}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Lesson Type selector (Disabled when editing) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                    {t('teacherLessons.fields.lessonType') || 'Lesson Type'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={Boolean(editingLesson)}
                      onClick={() => setLessonForm((prev) => ({ ...prev, lessonType: 'ONE_ON_ONE' }))}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                        lessonForm.lessonType === 'ONE_ON_ONE'
                          ? 'border-red-600 bg-red-50/70 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-500'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>{t('teacherLessons.types.oneOnOne') || 'One-on-One'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={Boolean(editingLesson)}
                      onClick={() => setLessonForm((prev) => ({ ...prev, lessonType: 'GROUP' }))}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                        lessonForm.lessonType === 'GROUP'
                          ? 'border-red-600 bg-red-50/70 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-500'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>{t('teacherLessons.types.group') || 'Group Lesson'}</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Participant Selector */}
                {lessonForm.lessonType === 'ONE_ON_ONE' ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                      {t('teacherLessons.fields.student') || 'Student'} *
                    </label>
                    <select
                      value={lessonForm.studentId}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, studentId: e.target.value }))}
                      className={INPUT_CLS}
                      disabled={Boolean(editingLesson)}
                      required
                    >
                      <option value="">{t('teacherLessons.fields.selectStudent') || '-- Select Student --'}</option>
                      {availableStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} {s.isHomelyStudent ? '(Homely Student)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                      {t('teacherLessons.fields.group') || 'Group / Class'} *
                    </label>
                    <select
                      value={lessonForm.groupId}
                      onChange={(e) => {
                        const gId = e.target.value;
                        const grp = availableGroups.find((g) => g.id === gId);
                        setLessonForm((prev) => ({
                          ...prev,
                          groupId: gId,
                          subject: grp?.subject || prev.subject
                        }));
                      }}
                      className={INPUT_CLS}
                      disabled={Boolean(editingLesson)}
                      required
                    >
                      <option value="">{t('teacherLessons.fields.selectGroup') || '-- Select Group / Class --'}</option>
                      {availableGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.subject} - {g.studentCount || 0} students)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subject and Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                      {t('teacherLessons.fields.subject') || 'Subject'} *
                    </label>
                    <input
                      type="text"
                      value={lessonForm.subject}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g. Mathematics, Calculus"
                      className={INPUT_CLS}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                      {t('teacherLessons.fields.date') || 'Lesson Date'} *
                    </label>
                    <input
                      type="date"
                      value={lessonForm.date}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, date: e.target.value }))}
                      className={INPUT_CLS}
                      required
                    />
                  </div>
                </div>

                {/* Times and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                      {t('teacherLessons.fields.startTime') || 'Start Time'} *
                    </label>
                    <input
                      type="time"
                      value={lessonForm.startTime}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, startTime: e.target.value }))}
                      className={INPUT_CLS}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                      {t('teacherLessons.fields.endTime') || 'End Time'} *
                    </label>
                    <input
                      type="time"
                      value={lessonForm.endTime}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, endTime: e.target.value }))}
                      className={INPUT_CLS}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                      {t('teacherLessons.fields.status') || 'Status'}
                    </label>
                    <select
                      value={lessonForm.lessonStatus}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, lessonStatus: e.target.value }))}
                      className={INPUT_CLS}
                    >
                      <option value="SCHEDULED">{t('teacherLessons.status.scheduled') || 'Scheduled'}</option>
                      <option value="COMPLETED">{t('teacherLessons.status.completed') || 'Completed'}</option>
                      <option value="CANCELLED">{t('teacherLessons.status.cancelled') || 'Cancelled'}</option>
                      <option value="NO_SHOW">{t('teacherLessons.status.noShow') || 'No Show'}</option>
                    </select>
                  </div>
                </div>

                {/* Teacher Private Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                    {t('teacherLessons.fields.notes') || 'Teacher Private Notes'}
                  </label>
                  <textarea
                    rows={2}
                    value={lessonForm.notes}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('teacherLessons.fields.notesPlaceholder') || 'Private remarks about lesson performance...'}
                    className={INPUT_CLS}
                  />
                </div>

                {/* Homework Section */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-red-600" />
                    <span>{t('teacherLessons.homeworkSection') || 'Homework & Assignments (Optional)'}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {t('teacherLessons.fields.homeworkTitle') || 'Homework Title'}
                      </label>
                      <input
                        type="text"
                        value={lessonForm.homeworkTitle}
                        onChange={(e) => setLessonForm((prev) => ({ ...prev, homeworkTitle: e.target.value }))}
                        placeholder="e.g. Chapter 4 Exercises 1-10"
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {t('teacherLessons.fields.dueDate') || 'Due Date'}
                      </label>
                      <input
                        type="date"
                        value={lessonForm.homeworkDueDate}
                        onChange={(e) => setLessonForm((prev) => ({ ...prev, homeworkDueDate: e.target.value }))}
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t('teacherLessons.fields.homeworkDesc') || 'Homework Description'}
                    </label>
                    <input
                      type="text"
                      value={lessonForm.homeworkDesc}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, homeworkDesc: e.target.value }))}
                      placeholder="Instructions, reading pages, or problem sets..."
                      className={INPUT_CLS}
                    />
                  </div>

                  {editingLesson && (
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={lessonForm.homeworkIsCompleted}
                        onChange={(e) => setLessonForm((prev) => ({ ...prev, homeworkIsCompleted: e.target.checked }))}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span>{t('teacherLessons.fields.isCompleted') || 'Homework Completed by Students'}</span>
                    </label>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/60">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all"
                  >
                    {t('teacherLessons.actions.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
                  >
                    {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>
                      {formSubmitting
                        ? t('teacherLessons.actions.saving') || 'Saving...'
                        : editingLesson
                        ? t('teacherLessons.actions.save') || 'Save Changes'
                        : t('teacherLessons.actions.create') || 'Schedule Lesson'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 2: LESSON DETAILS & ATTENDANCE TRACKING                */}
        {/* ============================================================ */}
        {selectedLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700/60 my-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedLesson.subject}
                      </h3>
                      {getStatusBadge(selectedLesson.lessonStatus)}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedLesson.date} &bull; {selectedLesson.startTime} - {selectedLesson.endTime}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lesson Overview Card */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Participant</p>
                  {selectedLesson.lessonType === 'ONE_ON_ONE' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedLesson.student?.fullName}
                      </span>
                      {selectedLesson.student?.isHomelyStudent && <HomelyStudentBadge />}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Layers className="w-4 h-4 text-teal-600" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedLesson.group?.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({selectedLesson.groupStudentCount || 0} students)
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Type</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">
                    {selectedLesson.lessonType === 'ONE_ON_ONE'
                      ? t('teacherLessons.types.oneOnOne') || 'One-on-One'
                      : t('teacherLessons.types.group') || 'Group Lesson'}
                  </p>
                </div>

                {selectedLesson.notes && (
                  <div className="sm:col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700/60">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Teacher Notes</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                      {selectedLesson.notes}
                    </p>
                  </div>
                )}

                {selectedLesson.homework?.title && (
                  <div className="sm:col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700/60">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Homework</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedLesson.homework.title}
                      </span>
                      {selectedLesson.homework.dueDate && (
                        <span className="text-xs text-gray-500">
                          Due: {selectedLesson.homework.dueDate}
                        </span>
                      )}
                    </div>
                    {selectedLesson.homework.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {selectedLesson.homework.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Attendance Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-white flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-red-600" />
                    <span>{t('teacherLessons.attendanceSection') || 'Attendance Tracking'}</span>
                  </h4>
                  {attendanceMessage && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {attendanceMessage}
                    </span>
                  )}
                </div>

                {loadingDetails ? (
                  <div className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin text-red-600 mx-auto mb-2" />
                    <p className="text-xs">Loading attendance details...</p>
                  </div>
                ) : attendanceState.length === 0 ? (
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 text-center text-xs text-gray-500">
                    No students available for attendance tracking in this lesson.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {attendanceState.map((att, idx) => (
                      <div
                        key={att.studentId || idx}
                        className="p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {att.studentName || 'Student'}
                          </span>
                          {att.isHomelyStudent && <HomelyStudentBadge />}
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={att.status || 'NOT_RECORDED'}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              setAttendanceState((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, status: newStatus } : item
                                )
                              );
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                          >
                            <option value="NOT_RECORDED">
                              {t('teacherLessons.attendanceStatus.notRecorded') || 'Not Recorded'}
                            </option>
                            <option value="PRESENT">
                              {t('teacherLessons.attendanceStatus.present') || 'Present'}
                            </option>
                            <option value="ABSENT">
                              {t('teacherLessons.attendanceStatus.absent') || 'Absent'}
                            </option>
                            <option value="EXCUSED">
                              {t('teacherLessons.attendanceStatus.excused') || 'Excused'}
                            </option>
                          </select>

                          <input
                            type="text"
                            placeholder="Note..."
                            value={att.note || ''}
                            onChange={(e) => {
                              const newNote = e.target.value;
                              setAttendanceState((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, note: newNote } : item
                                )
                              );
                            }}
                            className="w-36 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handleSaveAttendance}
                    disabled={savingAttendance || attendanceState.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
                  >
                    {savingAttendance ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{t('teacherLessons.actions.saveAttendance') || 'Save Attendance'}</span>
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700/60">
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all"
                >
                  {t('teacherLessons.actions.cancel') || 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 3: CANCEL / DELETE LESSON CONFIRMATION                 */}
        {/* ============================================================ */}
        {cancellingLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700/60 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('teacherLessons.actions.cancelConfirmTitle') || 'Cancel Lesson'}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('teacherLessons.actions.cancelConfirmMessage', {
                  subject: cancellingLesson.subject
                }) || `Are you sure you want to cancel this ${cancellingLesson.subject} lesson? Records will be preserved.`}
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingLesson(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all"
                >
                  {t('teacherLessons.actions.cancel') || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelLesson}
                  disabled={cancelling}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
                >
                  {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{cancelling ? 'Cancelling...' : 'Confirm Cancellation'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherLessons;
