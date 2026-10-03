// frontend/src/components/student/BookLessonModal.jsx
// ============================================================
// BOOK LESSON MODAL COMPONENT (STUDENT)
//
// Enables an authenticated student to request a lesson with an
// active teacher.
//
// BUSINESS RULES:
// 1. Target teacher must have an ACTIVE relationship with the student.
// 2. Submits to POST /api/students/bookings.
// 3. Client validates subject, date, and HH:mm times (endTime > startTime).
// 4. On success: Displays PENDING status confirmation (does NOT claim lesson is confirmed).
// 5. Handles backend conflicts, duplicates, and errors gracefully.
// ============================================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import {
  Calendar,
  Clock,
  BookOpen,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  User
} from 'lucide-react';

const INPUT_CLS =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all';

const BookLessonModal = ({ isOpen, onClose, teacher, onSuccess }) => {
  const { t } = useTranslation();

  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:00');
  const [studentNote, setStudentNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successBooking, setSuccessBooking] = useState(null);

  if (!isOpen || !teacher) return null;

  const teacherName = teacher.name || teacher.fullName || 'Teacher';
  const teacherId = teacher.id || teacher.teacherId || teacher._id;

  const availableSubjects = [
    ...(teacher.mainSubject ? [teacher.mainSubject] : []),
    ...(Array.isArray(teacher.additionalSubjects) ? teacher.additionalSubjects : [])
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!subject.trim()) {
      setErrorMessage(t('studentBookings.errors.subjectRequired') || 'Subject is required.');
      return;
    }

    if (!date) {
      setErrorMessage(t('studentBookings.errors.dateRequired') || 'Please select a date.');
      return;
    }

    // Time validation
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      setErrorMessage(t('studentBookings.errors.invalidTimeFormat') || 'Invalid time format. Please use HH:mm.');
      return;
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    if (endH * 60 + endM <= startH * 60 + startM) {
      setErrorMessage(t('studentBookings.errors.endTimeOrder') || 'End time must be after start time.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        teacherId,
        subject: subject.trim(),
        date,
        startTime,
        endTime,
        studentNote: studentNote.trim()
      };

      const res = await api.post('/api/students/bookings', payload);
      if (res.data?.success) {
        setSuccessBooking(res.data.booking);
        if (typeof onSuccess === 'function') {
          onSuccess(res.data.booking);
        }
      } else {
        setErrorMessage(res.data?.message || t('studentBookings.errors.submissionFailed') || 'Failed to submit booking request.');
      }
    } catch (err) {
      console.error('Booking request error:', err);
      const msg = err.response?.data?.message || t('studentBookings.errors.submissionFailed') || 'Failed to submit booking request.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('studentBookings.modalTitle') || 'Request a Lesson'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('studentBookings.withTeacher') || 'With'}: <span className="font-semibold text-gray-800 dark:text-gray-200">{teacherName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Confirmation State */}
        {successBooking ? (
          <div className="space-y-4 py-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                {t('studentBookings.requestSubmitted') || 'Booking Request Submitted!'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {t('studentBookings.pendingNotice') || 'Your request status is PENDING. The teacher will review your requested time slot.'}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('studentBookings.subject') || 'Subject'}:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{successBooking.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('studentBookings.date') || 'Date'}:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{successBooking.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('studentBookings.time') || 'Time'}:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{successBooking.startTime} - {successBooking.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('studentBookings.status') || 'Status'}:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  {t('studentBookings.statusPending') || 'PENDING'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all shadow-sm"
              >
                {t('studentBookings.closeBtn') || 'Done'}
              </button>
            </div>
          </div>
        ) : (
          /* Booking Request Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2.5 text-red-700 dark:text-red-300 text-xs">
                <AlertCircle size={16} className="shrink-0" />
                <p className="flex-1">{errorMessage}</p>
              </div>
            )}

            {/* Subject Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <BookOpen size={14} className="text-red-500" />
                <span>{t('studentBookings.subject') || 'Subject'}</span>
              </label>
              {availableSubjects.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={INPUT_CLS}
                  >
                    <option value="">{t('studentBookings.selectSubject') || 'Select a subject...'}</option>
                    {availableSubjects.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                    <option value="CUSTOM">{t('studentBookings.otherSubject') || 'Other / Custom'}</option>
                  </select>
                  {subject === 'CUSTOM' && (
                    <input
                      type="text"
                      placeholder={t('studentBookings.enterSubject') || 'Enter subject name...'}
                      onChange={(e) => setSubject(e.target.value)}
                      className={INPUT_CLS}
                      autoFocus
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t('studentBookings.enterSubject') || 'e.g. Mathematics, Physics...'}
                  className={INPUT_CLS}
                />
              )}
            </div>

            {/* Date Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Calendar size={14} className="text-red-500" />
                <span>{t('studentBookings.date') || 'Date'}</span>
              </label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className={INPUT_CLS}
              />
            </div>

            {/* Time Slots (Start Time & End Time) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Clock size={14} className="text-red-500" />
                  <span>{t('studentBookings.startTime') || 'Start Time'}</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={INPUT_CLS}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Clock size={14} className="text-red-500" />
                  <span>{t('studentBookings.endTime') || 'End Time'}</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* Student Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <FileText size={14} className="text-red-500" />
                <span>{t('studentBookings.noteOptional') || 'Note for Teacher (Optional)'}</span>
              </label>
              <textarea
                rows={3}
                value={studentNote}
                onChange={(e) => setStudentNote(e.target.value)}
                placeholder={t('studentBookings.notePlaceholder') || 'Describe topics you need help with or exam preparation details...'}
                className={INPUT_CLS}
                maxLength={1000}
              />
            </div>

            {/* Notice */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
              {t('studentBookings.pendingDisclaimer') || 'Note: Submitting this form sends a booking request. The lesson is not confirmed until accepted by the teacher.'}
            </div>

            {/* Form Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('studentBookings.cancelBtn') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                <span>{t('studentBookings.submitRequestBtn') || 'Submit Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookLessonModal;
