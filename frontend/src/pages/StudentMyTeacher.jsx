// frontend/src/pages/StudentMyTeacher.jsx
// ============================================================
// STUDENT MY TEACHER PAGE
// Displays the teachers currently connected with the student.
// Supports safe modal view of teacher details, relationship status,
// and accept/end connection actions.
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Award,
  Globe,
  Loader2,
  X,
  Search,
  ExternalLink,
  ShieldCheck,
  Tag,
  DollarSign
} from 'lucide-react';
import BookLessonModal from '../components/student/BookLessonModal';

const StudentMyTeacher = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Selected teacher for details modal
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Booking modal state
  const [bookingTeacher, setBookingTeacher] = useState(null);

  // Discovery notice state
  const [showDiscoveryNotice, setShowDiscoveryNotice] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get('/api/students/teachers');
      if (res.data?.success) {
        setTeachers(Array.isArray(res.data.teachers) ? res.data.teachers : []);
      }
    } catch (err) {
      console.error('Failed to load student teachers:', err);
      setErrorMessage(t('studentTeachers.loadError') || 'Failed to load connected teachers.');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleAccept = async (relationshipId) => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.post(`/api/students/teachers/${relationshipId}/accept`);
      if (res.data?.success) {
        setSuccessMessage(t('studentTeachers.acceptSuccess') || 'Teacher connection accepted.');
        await fetchTeachers();
        if (selectedRelationship?.id === relationshipId) {
          setSelectedRelationship((prev) => prev ? { ...prev, relationshipStatus: 'ACTIVE' } : null);
        }
      }
    } catch (err) {
      console.error('Failed to accept relationship:', err);
      setErrorMessage(err.response?.data?.message || t('studentTeachers.actionError') || 'Failed to update relationship.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnd = async (relationshipId) => {
    if (!window.confirm(t('studentTeachers.confirmEnd') || 'Are you sure you want to end this connection with your teacher?')) {
      return;
    }
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.post(`/api/students/teachers/${relationshipId}/end`);
      if (res.data?.success) {
        setSuccessMessage(t('studentTeachers.endSuccess') || 'Teacher connection ended.');
        await fetchTeachers();
        if (selectedRelationship?.id === relationshipId) {
          setSelectedRelationship((prev) => prev ? { ...prev, relationshipStatus: 'ENDED' } : null);
        }
      }
    } catch (err) {
      console.error('Failed to end relationship:', err);
      setErrorMessage(err.response?.data?.message || t('studentTeachers.actionError') || 'Failed to update relationship.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return {
          label: t('studentTeachers.statusActive') || 'Active',
          classes: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: CheckCircle2
        };
      case 'PENDING':
        return {
          label: t('studentTeachers.statusPending') || 'Pending',
          classes: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: Clock
        };
      case 'ENDED':
        return {
          label: t('studentTeachers.statusEnded') || 'Ended',
          classes: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
          icon: XCircle
        };
      case 'REJECTED':
        return {
          label: t('studentTeachers.statusRejected') || 'Declined',
          classes: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
          icon: XCircle
        };
      default:
        return {
          label: status || 'Active',
          classes: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
          icon: CheckCircle2
        };
    }
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('studentTeachers.headerTitle') || 'My Teacher'}
        badge={t('studentNav.studentPortal') || 'Student Portal'}
        badgeColor="red"
      />

      <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
        {/* Alerts */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200"
            >
              <X size={16} />
            </button>
          </div>
        )}

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

        {/* Discovery Notice Callout */}
        {showDiscoveryNotice && (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{t('studentTeachers.findTeacherComingSoon') || 'Teacher discovery and marketplace will be available soon.'}</span>
            </div>
            <button
              onClick={() => setShowDiscoveryNotice(false)}
              className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-200"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('studentTeachers.headerTitle') || 'My Teacher'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('studentTeachers.subTitle') || 'Teachers connected with your academic profile and coursework.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student-find-teacher"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm transition-colors shadow-sm"
            >
              <Search size={16} className="text-red-500" />
              <span>{t('studentTeachers.findTeacherBtn') || 'Find a Teacher'}</span>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <Loader2 size={32} className="animate-spin text-red-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('studentTeachers.loading') || 'Loading your teachers...'}
            </p>
          </div>
        ) : teachers.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <GraduationCap size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {t('studentTeachers.emptyTitle') || 'No teachers connected yet'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {t('studentTeachers.emptySubtitle') || 'You do not have any teachers connected to your account yet.'}
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/student-find-teacher"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all shadow-sm"
              >
                <Search size={16} />
                <span>{t('studentTeachers.findTeacherBtn') || 'Find a Teacher'}</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Teacher Relationship Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((item) => {
              const teacher = item.teacher || {};
              const statusInfo = getStatusBadge(item.relationshipStatus);
              const StatusIcon = statusInfo.icon;
              const allSubjects = teacher.mainSubject
                ? [teacher.mainSubject, ...(teacher.additionalSubjects || [])]
                : teacher.additionalSubjects || [];

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-6 transition-shadow flex flex-col justify-between space-y-5 ${
                    teacher.isPremium
                      ? 'border-purple-400 dark:border-purple-500 bg-purple-100/80 dark:bg-purple-900/30 shadow-[0_0_16px_rgba(168,85,247,0.40)] hover:shadow-[0_0_22px_rgba(168,85,247,0.50)]'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Teacher Top Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {teacher.avatar ? (
                          <img
                            src={teacher.avatar}
                            alt={teacher.name}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                            {teacher.name ? teacher.name.charAt(0).toUpperCase() : 'T'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                            {teacher.name}
                          </h3>
                          {teacher.title && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {teacher.title}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border shrink-0 ${statusInfo.classes}`}
                      >
                        <StatusIcon size={12} />
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    {/* Teacher Subjects */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {t('studentTeachers.subjectsLabel') || 'Subjects'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {allSubjects.length > 0 ? (
                          allSubjects.slice(0, 3).map((sub, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-medium border border-red-100 dark:border-red-900/50"
                            >
                              {sub}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">—</span>
                        )}
                        {allSubjects.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                            +{allSubjects.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats Summary (Lesson Rate & Verification) */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs">
                      <div>
                        <span className="text-gray-400 block">{t('studentTeachers.lessonRateLabel') || 'Lesson Rate'}</span>
                        <span className="font-bold text-gray-900 dark:text-white mt-0.5 block">
                          {teacher.lessonRate > 0
                            ? `${teacher.lessonRate} ${teacher.pricingCurrency || ''}`.trim()
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">{t('studentTeachers.verificationLabel') || 'Verification'}</span>
                        {teacher.isVerified ? (
                          <span className="mt-0.5 flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck size={14} />
                            <span>{t('studentTeachers.verifiedBadge') || 'Verified Teacher'}</span>
                          </span>
                        ) : (
                          <span className="font-semibold text-gray-500 dark:text-gray-400 mt-0.5 block">
                            {t('studentTeachers.unverifiedBadge') || 'Not Verified'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRelationship(item)}
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 inline-flex items-center gap-1"
                    >
                      <span>{t('studentTeachers.viewTeacherBtn') || 'View Details'}</span>
                      <ExternalLink size={12} />
                    </button>

                    <div className="flex items-center gap-2">
                      {item.relationshipStatus === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => setBookingTeacher({
                            ...item.teacher,
                            id: item.teacherId || item.teacher?.id,
                            relationshipId: item.id
                          })}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-sm inline-flex items-center gap-1"
                        >
                          <Calendar size={12} />
                          <span>{t('studentBookings.bookLessonBtn') || 'Book Lesson'}</span>
                        </button>
                      )}
                      {item.relationshipStatus === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleAccept(item.id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {t('studentTeachers.acceptBtn') || 'Accept'}
                        </button>
                      )}
                      {(item.relationshipStatus === 'ACTIVE' || item.relationshipStatus === 'PENDING') && (
                        <button
                          type="button"
                          onClick={() => handleEnd(item.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-600 hover:border-red-200 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {t('studentTeachers.endBtn') || 'End'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Teacher Relationship Details */}
        {selectedRelationship && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {selectedRelationship.teacher?.avatar ? (
                    <img
                      src={selectedRelationship.teacher.avatar}
                      alt={selectedRelationship.teacher.name}
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-bold text-xl">
                      {selectedRelationship.teacher?.name ? selectedRelationship.teacher.name.charAt(0).toUpperCase() : 'T'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedRelationship.teacher?.name}
                      </h3>
                      {selectedRelationship.teacher?.isVerified && (
                        <ShieldCheck size={16} className="text-emerald-500" title={t('studentTeachers.verifiedBadge') || 'Verified Teacher'} />
                      )}
                    </div>
                    {selectedRelationship.teacher?.title && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedRelationship.teacher.title}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRelationship(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Details List */}
              <div className="space-y-3 text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
                {/* Subjects */}
                <div className="pt-2">
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                    {t('studentTeachers.subjectsLabel') || 'Subjects'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRelationship.teacher?.mainSubject && (
                      <span className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-medium border border-red-100 dark:border-red-900/50">
                        {selectedRelationship.teacher.mainSubject}
                      </span>
                    )}
                    {Array.isArray(selectedRelationship.teacher?.additionalSubjects) &&
                      selectedRelationship.teacher.additionalSubjects.map((sub, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium"
                        >
                          {sub}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Teaching Levels */}
                {Array.isArray(selectedRelationship.teacher?.teachingLevels) &&
                  selectedRelationship.teacher.teachingLevels.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                        {t('studentTeachers.gradesLabel') || 'Teaching Levels'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRelationship.teacher.teachingLevels.map((lvl, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs"
                          >
                            {lvl}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Rates & Format */}
                <div className="pt-2 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-400 block">{t('studentTeachers.lessonRateLabel') || 'Lesson Rate'}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 block">
                      {selectedRelationship.teacher?.lessonRate > 0
                        ? `${selectedRelationship.teacher.lessonRate} ${selectedRelationship.teacher.pricingCurrency || ''}`
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">{t('studentTeachers.relationshipStatusLabel') || 'Relationship Status'}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 block">
                      {getStatusBadge(selectedRelationship.relationshipStatus).label}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                {selectedRelationship.teacher?.bio && (
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                      {t('studentTeachers.bioLabel') || 'About Teacher'}
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedRelationship.teacher.bio}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRelationship(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('studentTeachers.closeBtn') || 'Close'}
                </button>
                {selectedRelationship.relationshipStatus === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => {
                      const tData = {
                        ...selectedRelationship.teacher,
                        id: selectedRelationship.teacherId || selectedRelationship.teacher?.id,
                        relationshipId: selectedRelationship.id
                      };
                      setSelectedRelationship(null);
                      setBookingTeacher(tData);
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Calendar size={14} />
                    <span>{t('studentBookings.bookLessonBtn') || 'Book Lesson'}</span>
                  </button>
                )}
                {selectedRelationship.relationshipStatus === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleAccept(selectedRelationship.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {t('studentTeachers.acceptBtn') || 'Accept Connection'}
                  </button>
                )}
                {(selectedRelationship.relationshipStatus === 'ACTIVE' || selectedRelationship.relationshipStatus === 'PENDING') && (
                  <button
                    type="button"
                    onClick={() => handleEnd(selectedRelationship.id)}
                    disabled={actionLoading}
                    className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {t('studentTeachers.endBtn') || 'End Connection'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Book Lesson */}
        {bookingTeacher && (
          <BookLessonModal
            isOpen={Boolean(bookingTeacher)}
            onClose={() => setBookingTeacher(null)}
            teacher={bookingTeacher}
            onSuccess={() => {
              setSuccessMessage(t('studentBookings.requestSuccessNotice') || 'Booking request sent successfully!');
              setTimeout(() => setSuccessMessage(''), 5000);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentMyTeacher;
