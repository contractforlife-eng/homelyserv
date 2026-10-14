// frontend/src/pages/StudentMyBookings.jsx
// ============================================================
// STUDENT MY BOOKINGS PAGE
//
// Displays all lesson booking requests submitted by the authenticated student.
// Single source of truth: GET /api/students/bookings
// Cancellation action:   POST /api/students/bookings/:id/cancel
//
// STATE MACHINE REPRESENTATION:
// - PENDING:   Awaiting teacher response (can be cancelled by student)
// - CONFIRMED: Booking confirmed by teacher (can be cancelled according to policy)
// - REJECTED:  Declined by teacher (shows rejectionReason if available)
// - CANCELLED: Cancelled
//
// BOUNDARY NOTE:
// A CONFIRMED booking is distinct from a TeacherLesson.
// ============================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import {
  Calendar,
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
  Search,
  Filter,
  Eye,
  GraduationCap,
  MessageSquare,
  Ban,
  BookOpen,
  Globe
} from 'lucide-react';

const StudentMyBookings = () => {
  const { t } = useTranslation();

  // Tab State: 'INDIVIDUAL' or 'GROUPS'
  const [activeTab, setActiveTab] = useState('INDIVIDUAL');

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Group enrollments state
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupEnrollments, setGroupEnrollments] = useState([]);
  const [selectedGroupEnrollment, setSelectedGroupEnrollment] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected booking for details modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/api/students/bookings', { params });
      if (res.data?.success) {
        setBookings(Array.isArray(res.data.bookings) ? res.data.bookings : []);
      }
    } catch (err) {
      console.error('Failed to load student bookings:', err);
      setErrorMessage(t('studentBookings.loadError') || 'Failed to load booking requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  const fetchGroupEnrollments = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const res = await api.get('/api/students/groups/enrollments');
      if (res.data?.success) {
        setGroupEnrollments(Array.isArray(res.data.enrollments) ? res.data.enrollments : []);
      }
    } catch (err) {
      console.error('Failed to load student group enrollments:', err);
      setErrorMessage(t('studentBookings.groupsLoadError') || 'Failed to load group enrollment requests.');
    } finally {
      setGroupsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (activeTab === 'GROUPS') {
      fetchGroupEnrollments();
    }
  }, [activeTab, fetchGroupEnrollments]);

  // Handle Cancel Booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(t('studentBookings.confirmCancel') || 'Are you sure you want to cancel this booking request?')) {
      return;
    }

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.post(`/api/students/bookings/${bookingId}/cancel`);
      if (res.data?.success) {
        setSuccessMessage(t('studentBookings.cancelSuccess') || 'Booking cancelled successfully.');
        await fetchBookings();
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(res.data.booking);
        }
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      setErrorMessage(err.response?.data?.message || t('studentBookings.cancelError') || 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered bookings list
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const subjectMatch = (b.subject || '').toLowerCase().includes(q);
        const teacherMatch = (b.teacher?.fullName || '').toLowerCase().includes(q);
        if (!subjectMatch && !teacherMatch) return false;
      }
      return true;
    });
  }, [bookings, searchQuery]);

  // Filtered group enrollments list
  const filteredGroupEnrollments = useMemo(() => {
    return groupEnrollments.filter((e) => {
      if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const groupNameMatch = (e.group?.name || '').toLowerCase().includes(q);
        const subjectMatch = (e.group?.subject || '').toLowerCase().includes(q);
        const teacherMatch = (e.teacher?.fullName || '').toLowerCase().includes(q);
        if (!groupNameMatch && !subjectMatch && !teacherMatch) return false;
      }
      return true;
    });
  }, [groupEnrollments, statusFilter, searchQuery]);

  // Statistics for active tab
  const stats = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let rejected = 0;
    let cancelled = 0;

    if (activeTab === 'INDIVIDUAL') {
      bookings.forEach((b) => {
        if (b.status === 'PENDING') pending += 1;
        if (b.status === 'CONFIRMED') confirmed += 1;
        if (b.status === 'REJECTED') rejected += 1;
        if (b.status === 'CANCELLED') cancelled += 1;
      });
      return { pending, confirmed, rejected, cancelled, total: bookings.length };
    } else {
      groupEnrollments.forEach((e) => {
        if (e.status === 'PENDING') pending += 1;
        if (e.status === 'ACTIVE') confirmed += 1;
        if (e.status === 'REJECTED') rejected += 1;
      });
      return { pending, confirmed, rejected, cancelled: 0, total: groupEnrollments.length };
    }
  }, [activeTab, bookings, groupEnrollments]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
      case 'ACTIVE':
        return {
          label: status === 'ACTIVE'
            ? (t('studentBookings.groupStatusActive') || 'Enrolled / Active')
            : (t('studentBookings.statusConfirmed') || 'Confirmed'),
          classes: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: CheckCircle2
        };
      case 'REJECTED':
        return {
          label: activeTab === 'GROUPS'
            ? (t('studentBookings.groupStatusRejected') || 'Enrollment Declined')
            : (t('studentBookings.statusRejected') || 'Rejected'),
          classes: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          icon: XCircle
        };
      case 'CANCELLED':
        return {
          label: t('studentBookings.statusCancelled') || 'Cancelled',
          classes: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
          icon: Ban
        };
      case 'PENDING':
      default:
        return {
          label: activeTab === 'GROUPS'
            ? (t('studentBookings.groupStatusPending') || 'Pending Teacher Approval')
            : (t('studentBookings.statusPending') || 'Pending Review'),
          classes: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: Clock3
        };
    }
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('studentBookings.headerTitle') || 'My Bookings'}
        subtitle={t('studentBookings.subTitle') || 'Track and manage your lesson booking requests with teachers.'}
      />

      <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
        {/* Alerts */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-between gap-3 text-red-700 dark:text-red-300 text-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage('')} className="p-1 hover:text-red-900">
              <X size={16} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-emerald-700 dark:text-emerald-300 text-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="p-1 hover:text-emerald-900">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tab Switcher: Individual Lessons vs Group Enrollments */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => { setActiveTab('INDIVIDUAL'); setStatusFilter('ALL'); setSearchQuery(''); }}
            className={`pb-3 px-4 text-sm font-semibold inline-flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'INDIVIDUAL'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <User size={16} />
            <span>{t('studentBookings.tabIndividual') || '1-on-1 Lessons'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {bookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('GROUPS'); setStatusFilter('ALL'); setSearchQuery(''); }}
            className={`pb-3 px-4 text-sm font-semibold inline-flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'GROUPS'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Users size={16} />
            <span>{t('studentBookings.tabGroups') || 'Group Enrollments'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {groupEnrollments.length}
            </span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
              <Clock3 size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('studentBookings.statPending') || 'Pending'}</p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">{stats.pending}</h4>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activeTab === 'GROUPS' ? (t('studentBookings.groupStatusActive') || 'Active') : (t('studentBookings.statConfirmed') || 'Confirmed')}
              </p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">{stats.confirmed}</h4>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('studentBookings.statRejected') || 'Rejected'}</p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">{stats.rejected}</h4>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 flex items-center justify-center shrink-0">
              <Ban size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activeTab === 'GROUPS' ? (t('studentBookings.filterAll') || 'Total') : (t('studentBookings.statCancelled') || 'Cancelled')}
              </p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                {activeTab === 'GROUPS' ? stats.total : stats.cancelled}
              </h4>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'GROUPS'
                ? (t('studentBookings.searchPlaceholderGroups') || 'Search by group name, subject, or teacher...')
                : (t('studentBookings.searchPlaceholder') || 'Search bookings by subject or teacher...')}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="ALL">{t('studentBookings.filterAll') || 'All Statuses'}</option>
              <option value="PENDING">{t('studentBookings.statusPending') || 'Pending'}</option>
              {activeTab === 'GROUPS' ? (
                <option value="ACTIVE">{t('studentBookings.groupStatusActive') || 'Active'}</option>
              ) : (
                <option value="CONFIRMED">{t('studentBookings.statusConfirmed') || 'Confirmed'}</option>
              )}
              <option value="REJECTED">{t('studentBookings.statusRejected') || 'Rejected'}</option>
              {activeTab === 'INDIVIDUAL' && (
                <option value="CANCELLED">{t('studentBookings.statusCancelled') || 'Cancelled'}</option>
              )}
            </select>

            <Link
              to={activeTab === 'GROUPS' ? '/student-find-teacher' : '/student-teacher'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-sm transition-all shrink-0"
            >
              {activeTab === 'GROUPS' ? <Users size={14} /> : <Calendar size={14} />}
              <span>
                {activeTab === 'GROUPS'
                  ? (t('studentBookings.browseTeachersForGroups') || 'Find Teachers & Groups')
                  : (t('studentBookings.bookNewBtn') || 'Book a Lesson')}
              </span>
            </Link>
          </div>
        </div>

        {/* Tab 1: Individual Lessons Bookings List */}
        {activeTab === 'INDIVIDUAL' && (
          loading ? (
            <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <Loader2 size={32} className="animate-spin text-red-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('studentBookings.loading') || 'Loading booking requests...'}
              </p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
                <Calendar size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {t('studentBookings.emptyTitle') || 'No booking requests found'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {t('studentBookings.emptySubtitle') || 'You have not submitted any lesson booking requests matching this criteria.'}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/student-teacher"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <GraduationCap size={16} />
                  <span>{t('studentBookings.goToTeachersBtn') || 'View My Teachers'}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBookings.map((b) => {
                const statusInfo = getStatusBadge(b.status);
                const StatusIcon = statusInfo.icon;
                const canCancel = b.status === 'PENDING' || b.status === 'CONFIRMED';

                return (
                  <div
                    key={b.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Header: Teacher and Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {b.teacher?.avatar ? (
                            <img
                              src={b.teacher.avatar}
                              alt={b.teacher.fullName}
                              className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                              {b.teacher?.fullName ? b.teacher.fullName.charAt(0).toUpperCase() : 'T'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                              {b.teacher?.fullName || 'Teacher'}
                            </h4>
                            <span className="text-xs text-red-600 dark:text-red-400 font-semibold truncate block">
                              {b.subject}
                            </span>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border shrink-0 ${statusInfo.classes}`}>
                          <StatusIcon size={12} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </div>

                      {/* Schedule Date & Times */}
                      <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Calendar size={13} className="text-red-500 shrink-0" />
                          <span className="font-medium">{b.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Clock size={13} className="text-red-500 shrink-0" />
                          <span>{b.startTime} - {b.endTime}</span>
                        </div>
                      </div>

                      {/* Note Preview if present */}
                      {b.studentNote && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic">
                          "{b.studentNote}"
                        </p>
                      )}

                      {/* Rejection notice if present */}
                      {b.status === 'REJECTED' && b.rejectionReason && (
                        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-[11px] text-rose-700 dark:text-rose-300">
                          <span className="font-semibold block">{t('studentBookings.rejectionReason') || 'Rejection reason'}:</span>
                          <span>{b.rejectionReason}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 inline-flex items-center gap-1"
                        >
                          <Eye size={13} />
                          <span>{t('studentBookings.viewDetailsBtn') || 'Details'}</span>
                        </button>

                        {b.status === 'CONFIRMED' && b.lessonId && (
                          <Link
                            to="/student-lessons"
                            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 inline-flex items-center gap-1"
                          >
                            <BookOpen size={13} />
                            <span>{t('studentBookings.viewLessonBtn') || 'View Scheduled Lesson'}</span>
                          </Link>
                        )}
                      </div>

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-rose-600 hover:border-rose-200 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {t('studentBookings.cancelBookingBtn') || 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Tab 2: Group Enrollments List */}
        {activeTab === 'GROUPS' && (
          groupsLoading ? (
            <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <Loader2 size={32} className="animate-spin text-red-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('studentBookings.loading') || 'Loading group enrollments...'}
              </p>
            </div>
          ) : filteredGroupEnrollments.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
                <Users size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {t('studentBookings.groupsEmptyTitle') || 'No group requests found'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {t('studentBookings.groupsEmptySubtitle') || 'You have not submitted any group enrollment requests matching this criteria.'}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/student-find-teacher"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Users size={16} />
                  <span>{t('studentBookings.browseTeachersForGroups') || 'Find Teachers & Groups'}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGroupEnrollments.map((e) => {
                const statusInfo = getStatusBadge(e.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={e.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Header: Group Name and Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-base text-gray-900 dark:text-white truncate">
                            {e.group?.name || 'Class Group'}
                          </h4>
                          <span className="text-xs text-red-600 dark:text-red-400 font-semibold truncate block">
                            {e.group?.subject || 'Subject'}
                          </span>
                        </div>

                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border shrink-0 ${statusInfo.classes}`}>
                          <StatusIcon size={12} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </div>

                      {/* Group Details */}
                      <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span className="text-gray-400">{t('studentBookings.groupTeacherLabel') || 'Teacher'}:</span>
                          <span className="font-medium">{e.teacher?.fullName || 'Teacher'}</span>
                        </div>
                        {e.group?.gradeLevel && (
                          <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                            <span className="text-gray-400">{t('studentBookings.groupGradeLabel') || 'Grade Level'}:</span>
                            <span>{e.group.gradeLevel}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span className="text-gray-400">{t('studentBookings.groupModeLabel') || 'Mode'}:</span>
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Globe size={12} className="text-red-500" />
                            {e.group?.onlineMode === 'ONLINE'
                              ? (t('studentBookings.groupModeOnline') || 'Online')
                              : (t('studentBookings.groupModeInPerson') || 'In Person')}
                          </span>
                        </div>
                      </div>

                      {/* Notes / Message Preview if present */}
                      {e.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic">
                          "{e.notes}"
                        </p>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedGroupEnrollment(e)}
                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 inline-flex items-center gap-1"
                      >
                        <Eye size={13} />
                        <span>{t('studentBookings.viewDetailsBtn') || 'Details'}</span>
                      </button>

                      {e.status === 'ACTIVE' && (
                        <Link
                          to="/student-lessons"
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 inline-flex items-center gap-1"
                        >
                          <BookOpen size={13} />
                          <span>{t('studentBookings.viewLessonBtn') || 'View Lessons'}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Modal: Booking Request Details */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {t('studentBookings.detailsModalTitle') || 'Booking Details'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('studentBookings.createdOn') || 'Requested on'}: {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-500">{t('studentBookings.status') || 'Current Status'}</span>
                {(() => {
                  const s = getStatusBadge(selectedBooking.status);
                  const SIcon = s.icon;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${s.classes}`}>
                      <SIcon size={14} />
                      <span>{s.label}</span>
                    </span>
                  );
                })()}
              </div>

              {/* Core Details */}
              <div className="space-y-3 text-xs divide-y divide-gray-100 dark:divide-gray-700/60">
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-400">{t('studentBookings.teacher') || 'Teacher'}:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedBooking.teacher?.fullName || 'Teacher'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-400">{t('studentBookings.subject') || 'Subject'}:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedBooking.subject}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-400">{t('studentBookings.date') || 'Date'}:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedBooking.date}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-400">{t('studentBookings.time') || 'Slot'}:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedBooking.startTime} - {selectedBooking.endTime}</span>
                </div>

                {selectedBooking.studentNote && (
                  <div className="pt-2 space-y-1">
                    <span className="text-gray-400 block">{t('studentBookings.studentNote') || 'Your Note'}:</span>
                    <p className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedBooking.studentNote}
                    </p>
                  </div>
                )}

                {selectedBooking.teacherResponseNote && (
                  <div className="pt-2 space-y-1">
                    <span className="text-gray-400 block">{t('studentBookings.teacherNote') || 'Teacher Response'}:</span>
                    <p className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 leading-relaxed whitespace-pre-wrap border border-emerald-100 dark:border-emerald-900/50">
                      {selectedBooking.teacherResponseNote}
                    </p>
                  </div>
                )}

                {selectedBooking.rejectionReason && (
                  <div className="pt-2 space-y-1">
                    <span className="text-rose-500 font-semibold block">{t('studentBookings.rejectionReason') || 'Rejection Reason'}:</span>
                    <p className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 leading-relaxed whitespace-pre-wrap border border-rose-100 dark:border-rose-900/50">
                      {selectedBooking.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('studentBookings.closeBtn') || 'Close'}
                </button>
                {selectedBooking.status === 'CONFIRMED' && selectedBooking.lessonId && (
                  <Link
                    to="/student-lessons"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                  >
                    <BookOpen size={13} />
                    <span>{t('studentBookings.viewLessonBtn') || 'View Scheduled Lesson'}</span>
                  </Link>
                )}
                {(selectedBooking.status === 'PENDING' || selectedBooking.status === 'CONFIRMED') && (
                  <button
                    type="button"
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {t('studentBookings.cancelBookingBtn') || 'Cancel Booking'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Group Enrollment Details */}
        {selectedGroupEnrollment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {selectedGroupEnrollment.group?.name || 'Class Group'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedGroupEnrollment.enrolledAt
                        ? `${t('studentBookings.groupEnrolledAt') || 'Enrolled on'}: ${new Date(selectedGroupEnrollment.enrolledAt).toLocaleDateString()}`
                        : t('studentBookings.tabGroups') || 'Group Enrollment'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGroupEnrollment(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-500">{t('studentBookings.status') || 'Current Status'}</span>
                {(() => {
                  const s = getStatusBadge(selectedGroupEnrollment.status);
                  const SIcon = s.icon;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${s.classes}`}>
                      <SIcon size={14} />
                      <span>{s.label}</span>
                    </span>
                  );
                })()}
              </div>

              {/* Core Details */}
              <div className="space-y-3 text-xs divide-y divide-gray-100 dark:divide-gray-700/60">
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-400">{t('studentBookings.groupTeacherLabel') || 'Teacher'}:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedGroupEnrollment.teacher?.fullName || 'Teacher'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-400">{t('studentBookings.groupSubjectLabel') || 'Subject'}:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedGroupEnrollment.group?.subject || '—'}</span>
                </div>
                {selectedGroupEnrollment.group?.gradeLevel && (
                  <div className="pt-2 flex justify-between">
                    <span className="text-gray-400">{t('studentBookings.groupGradeLabel') || 'Grade Level'}:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedGroupEnrollment.group.gradeLevel}</span>
                  </div>
                )}
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-400">{t('studentBookings.groupModeLabel') || 'Mode'}:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedGroupEnrollment.group?.onlineMode === 'ONLINE'
                      ? (t('studentBookings.groupModeOnline') || 'Online')
                      : (t('studentBookings.groupModeInPerson') || 'In Person')}
                  </span>
                </div>

                {selectedGroupEnrollment.notes && (
                  <div className="pt-2 space-y-1">
                    <span className="text-gray-400 block">{t('studentBookings.groupNotes') || 'Notes'}:</span>
                    <p className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedGroupEnrollment.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGroupEnrollment(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('studentBookings.closeBtn') || 'Close'}
                </button>
                {selectedGroupEnrollment.status === 'ACTIVE' && (
                  <Link
                    to="/student-lessons"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                  >
                    <BookOpen size={13} />
                    <span>{t('studentBookings.viewLessonBtn') || 'View Lessons'}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentMyBookings;
