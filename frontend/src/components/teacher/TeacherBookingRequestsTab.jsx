// frontend/src/components/teacher/TeacherBookingRequestsTab.jsx
// ============================================================
// TEACHER BOOKING REQUESTS TAB COMPONENT
//
// Displays incoming student booking requests for the authenticated teacher.
// Actions:
// - Accept booking: POST /api/teachers/bookings/:id/accept
// - Reject booking: POST /api/teachers/bookings/:id/reject
//
// BUSINESS RULES:
// 1. Only PENDING requests may be accepted or rejected.
// 2. Re-validates conflicts backend-side; handles 409 conflict responses gracefully.
// 3. Confirming a booking DOES NOT create a TeacherLesson.
// 4. Tenancy isolation: Guaranteed server-side via req.userId.
// ============================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Search,
  Filter,
  Check,
  Ban,
  MessageSquare
} from 'lucide-react';

const TeacherBookingRequestsTab = ({ onUpdateCount }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Actions
  const [acceptingBooking, setAcceptingBooking] = useState(null);
  const [acceptNote, setAcceptNote] = useState('');
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/api/teachers/bookings', { params });
      if (res.data?.success) {
        const list = Array.isArray(res.data.bookings) ? res.data.bookings : [];
        setBookings(list);

        const pendingCount = list.filter((b) => b.status === 'PENDING').length;
        if (typeof onUpdateCount === 'function') {
          onUpdateCount(pendingCount);
        }
      }
    } catch (err) {
      console.error('Error fetching teacher bookings:', err);
      setErrorMessage(t('teacherBookings.loadError') || 'Failed to load booking requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, onUpdateCount, t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle Accept
  const handleConfirmAccept = async (e) => {
    e.preventDefault();
    if (!acceptingBooking) return;

    setActionSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.post(`/api/teachers/bookings/${acceptingBooking.id}/accept`, {
        note: acceptNote.trim()
      });

      if (res.data?.success) {
        setSuccessMessage(t('teacherBookings.acceptSuccess') || 'Booking confirmed successfully.');
        setAcceptingBooking(null);
        setAcceptNote('');
        await fetchBookings();
      }
    } catch (err) {
      console.error('Error accepting booking:', err);
      const msg = err.response?.data?.message || t('teacherBookings.acceptError') || 'Failed to accept booking.';
      setErrorMessage(msg);
    } finally {
      setActionSubmitting(false);
    }
  };

  // Handle Reject
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingBooking) return;

    setActionSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.post(`/api/teachers/bookings/${rejectingBooking.id}/reject`, {
        reason: rejectReason.trim()
      });

      if (res.data?.success) {
        setSuccessMessage(t('teacherBookings.rejectSuccess') || 'Booking request rejected.');
        setRejectingBooking(null);
        setRejectReason('');
        await fetchBookings();
      }
    } catch (err) {
      console.error('Error rejecting booking:', err);
      const msg = err.response?.data?.message || t('teacherBookings.rejectError') || 'Failed to reject booking.';
      setErrorMessage(msg);
    } finally {
      setActionSubmitting(false);
    }
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const studentMatch = (b.student?.fullName || '').toLowerCase().includes(q);
        const subjectMatch = (b.subject || '').toLowerCase().includes(q);
        if (!studentMatch && !subjectMatch) return false;
      }
      return true;
    });
  }, [bookings, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            {t('teacherBookings.statusConfirmed') || 'Confirmed'}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
            {t('teacherBookings.statusRejected') || 'Rejected'}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {t('teacherBookings.statusCancelled') || 'Cancelled'}
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            {t('teacherBookings.statusPending') || 'Pending Review'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('teacherBookings.searchPlaceholder') || 'Search requests by student or subject...'}
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
            <option value="ALL">{t('teacherBookings.filterAll') || 'All Statuses'}</option>
            <option value="PENDING">{t('teacherBookings.statusPending') || 'Pending'}</option>
            <option value="CONFIRMED">{t('teacherBookings.statusConfirmed') || 'Confirmed'}</option>
            <option value="REJECTED">{t('teacherBookings.statusRejected') || 'Rejected'}</option>
            <option value="CANCELLED">{t('teacherBookings.statusCancelled') || 'Cancelled'}</option>
          </select>
        </div>
      </div>

      {/* Bookings Content */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <Loader2 size={32} className="animate-spin text-red-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('teacherBookings.loading') || 'Loading booking requests...'}
          </p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
            <Calendar size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {t('teacherBookings.emptyTitle') || 'No booking requests'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {t('teacherBookings.emptySubtitle') || 'You do not have any pending or past student booking requests matching the filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBookings.map((b) => {
            const isPending = b.status === 'PENDING';
            const studentName = b.student?.fullName || b.studentRoster?.fullName || 'Student';

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Student Info & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {b.student?.avatar ? (
                        <img
                          src={b.student.avatar}
                          alt={studentName}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {studentName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {studentName}
                        </h4>
                        <span className="text-xs text-red-600 dark:text-red-400 font-semibold truncate block">
                          {b.subject}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">{getStatusBadge(b.status)}</div>
                  </div>

                  {/* Slot Date & Times */}
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

                  {/* Student Note */}
                  {b.studentNote && (
                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700/60 text-xs">
                      <span className="text-gray-400 block text-[11px] font-semibold">{t('teacherBookings.studentNote') || 'Student Note'}:</span>
                      <p className="text-gray-700 dark:text-gray-300 italic line-clamp-3">
                        "{b.studentNote}"
                      </p>
                    </div>
                  )}

                  {/* Teacher Note / Rejection Reason if processed */}
                  {b.teacherResponseNote && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300">
                      <span className="font-semibold block text-[11px]">{t('teacherBookings.yourResponse') || 'Your Response'}:</span>
                      <span>{b.teacherResponseNote}</span>
                    </div>
                  )}

                  {b.rejectionReason && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300">
                      <span className="font-semibold block text-[11px]">{t('teacherBookings.rejectionReason') || 'Rejection Reason'}:</span>
                      <span>{b.rejectionReason}</span>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                {isPending ? (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAcceptingBooking(b);
                        setAcceptNote('');
                      }}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} />
                      <span>{t('teacherBookings.acceptBtn') || 'Accept'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingBooking(b);
                        setRejectReason('');
                      }}
                      className="flex-1 py-1.5 px-3 rounded-xl border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      <X size={14} />
                      <span>{t('teacherBookings.rejectBtn') || 'Reject'}</span>
                    </button>
                  </div>
                ) : b.status === 'CONFIRMED' ? (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      <span>{t('teacherBookings.lessonScheduledNotice') || 'Lesson Scheduled in Lessons'}</span>
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Accept Booking */}
      {acceptingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <Check size={18} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">
                    {t('teacherBookings.confirmAcceptTitle') || 'Confirm Booking'}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {acceptingBooking.date} • {acceptingBooking.startTime} - {acceptingBooking.endTime}
                  </p>
                </div>
              </div>
              <button onClick={() => setAcceptingBooking(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmAccept} className="space-y-4 text-xs">
              <p className="text-gray-600 dark:text-gray-300">
                {t('teacherBookings.acceptNotice') || 'Accepting will confirm this booking slot for the student. Backend schedule conflicts will be rechecked.'}
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-gray-700 dark:text-gray-300">
                  {t('teacherBookings.optionalNoteLabel') || 'Note to Student (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={acceptNote}
                  onChange={(e) => setAcceptNote(e.target.value)}
                  placeholder={t('teacherBookings.notePlaceholder') || 'e.g. Looking forward to our session! Please prepare Chapter 3.'}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAcceptingBooking(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold"
                >
                  {t('teacherBookings.cancelBtn') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all disabled:opacity-50"
                >
                  {actionSubmitting && <Loader2 size={13} className="animate-spin" />}
                  <span>{t('teacherBookings.confirmAcceptBtn') || 'Confirm Acceptance'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reject Booking */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                  <X size={18} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">
                    {t('teacherBookings.rejectModalTitle') || 'Decline Booking Request'}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {rejectingBooking.date} • {rejectingBooking.startTime} - {rejectingBooking.endTime}
                  </p>
                </div>
              </div>
              <button onClick={() => setRejectingBooking(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <p className="text-gray-600 dark:text-gray-300">
                {t('teacherBookings.rejectNotice') || 'Please let the student know why you are unable to take this lesson request.'}
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-gray-700 dark:text-gray-300">
                  {t('teacherBookings.reasonLabel') || 'Reason for Rejection (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('teacherBookings.reasonPlaceholder') || 'e.g. Schedule conflict at that hour, please request another time.'}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingBooking(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold"
                >
                  {t('teacherBookings.cancelBtn') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-all disabled:opacity-50"
                >
                  {actionSubmitting && <Loader2 size={13} className="animate-spin" />}
                  <span>{t('teacherBookings.confirmRejectBtn') || 'Decline Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherBookingRequestsTab;
