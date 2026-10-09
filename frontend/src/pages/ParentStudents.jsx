// frontend/src/pages/ParentStudents.jsx
// ============================================================
// PARENT / CHILD LEARNING MANAGEMENT (PHASE 10)
//
// Accessible to WORKER, EMPLOYER and DOCTOR accounts acting as parents/guardians.
// Allows monitoring linked children, academic overviews, connected teachers,
// lessons, progress, homework, and booking lessons on behalf of children.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import RolePageHeader from '../components/common/RolePageHeader';
import {
  getParentChildren,
  requestChildLink,
  cancelParentRequest,
  endParentStudentRelationship,
  getChildOverview,
  getChildTeachers,
  getChildLessons,
  getChildProgress,
  getChildHomework,
  getChildBookings,
  createChildBooking,
  discoverChildTeachers,
  requestChildTeacher
} from '../services/parentStudentService';
import {
  GraduationCap,
  Users,
  UserPlus,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  FileText,
  TrendingUp,
  Award,
  ChevronRight,
  Plus,
  Search,
  ShieldCheck
} from 'lucide-react';

const ParentStudents = () => {
  const { t } = useTranslation();
  const authUser = useAuthStore(state => state.user);

  // Parent relationships state
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Link Child Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({
    studentEmail: '',
    studentUserId: '',
    relationshipType: 'PARENT',
    personalNote: ''
  });
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkError, setLinkError] = useState(null);

  // Active Child Inspection State
  const [selectedChild, setSelectedChild] = useState(null);
  const [childTab, setChildTab] = useState('overview'); // 'overview' | 'teachers' | 'lessons' | 'progress' | 'homework' | 'bookings'
  const [childDataLoading, setChildDataLoading] = useState(false);
  const [childData, setChildData] = useState({
    overview: null,
    teachers: [],
    lessons: [],
    progress: null,
    homework: [],
    bookings: []
  });

  // Book Lesson on Behalf Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    teacherStudentId: '',
    subject: '',
    lessonDate: '',
    startTime: '',
    endTime: '',
    notes: ''
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // Request Teacher Modal State
  const [isRequestTeacherModalOpen, setIsRequestTeacherModalOpen] = useState(false);
  const [requestTeacherTargetChild, setRequestTeacherTargetChild] = useState(null);
  const [discoveredTeachers, setDiscoveredTeachers] = useState([]);
  const [teacherSearchLoading, setTeacherSearchLoading] = useState(false);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [requestingTeacherId, setRequestingTeacherId] = useState(null);
  const [requestTeacherError, setRequestTeacherError] = useState(null);
  const [requestTeacherSuccess, setRequestTeacherSuccess] = useState(null);
  const [teacherPagination, setTeacherPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [teacherCurrentPage, setTeacherCurrentPage] = useState(1);

  // Fetch linked children
  const fetchChildren = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getParentChildren();
      if (res?.success) {
        setChildren(res.children || []);
      }
    } catch (err) {
      console.error('Error fetching linked children:', err);
      setError(err?.response?.data?.message || t('parentStudents.linkError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // Load active child detail tab
  const loadChildTabData = useCallback(async (studentId, tab) => {
    try {
      setChildDataLoading(true);
      if (tab === 'overview') {
        const res = await getChildOverview(studentId);
        if (res?.success) {
          setChildData(prev => ({ ...prev, overview: res.overview }));
        }
      } else if (tab === 'teachers') {
        const res = await getChildTeachers(studentId);
        if (res?.success) {
          setChildData(prev => ({ ...prev, teachers: res.teachers || [] }));
        }
      } else if (tab === 'lessons') {
        const res = await getChildLessons(studentId);
        if (res?.success) {
          setChildData(prev => ({ ...prev, lessons: res.lessons || [] }));
        }
      } else if (tab === 'progress') {
        const res = await getChildProgress(studentId);
        if (res?.success) {
          setChildData(prev => ({ ...prev, progress: res.progress }));
        }
      } else if (tab === 'homework') {
        const res = await getChildHomework(studentId);
        if (res?.success) {
          setChildData(prev => ({ ...prev, homework: res.homework || [] }));
        }
      } else if (tab === 'bookings') {
        const res = await getChildBookings(studentId);
        if (res?.success) {
          setChildData(prev => ({ ...prev, bookings: res.bookings || [] }));
        }
      }
    } catch (err) {
      console.error(`Error loading child ${tab}:`, err);
    } finally {
      setChildDataLoading(false);
    }
  }, []);

  const handleSelectChild = (child) => {
    setSelectedChild(child);
    setChildTab('overview');
    loadChildTabData(child.studentId, 'overview');
  };

  const handleTabChange = (tab) => {
    setChildTab(tab);
    if (selectedChild) {
      loadChildTabData(selectedChild.studentId, tab);
    }
  };

  // Submit Link Child Request
  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    setLinkError(null);
    if (!linkForm.studentEmail.trim() && !linkForm.studentUserId.trim()) {
      setLinkError(t('parentStudents.linkChildDesc'));
      return;
    }

    try {
      setLinkSubmitting(true);
      const res = await requestChildLink({
        studentEmail: linkForm.studentEmail.trim() || undefined,
        studentUserId: linkForm.studentUserId.trim() || undefined,
        relationshipType: linkForm.relationshipType,
        personalNote: linkForm.personalNote.trim() || undefined
      });

      if (res?.success) {
        setSuccessMessage(t('parentStudents.linkSuccess'));
        setIsLinkModalOpen(false);
        setLinkForm({
          studentEmail: '',
          studentUserId: '',
          relationshipType: 'PARENT',
          personalNote: ''
        });
        fetchChildren();
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      setLinkError(err?.response?.data?.message || t('parentStudents.linkError'));
    } finally {
      setLinkSubmitting(false);
    }
  };

  // Cancel Request
  const handleCancelRequest = async (relationshipId) => {
    try {
      const res = await cancelParentRequest(relationshipId);
      if (res?.success) {
        fetchChildren();
        if (selectedChild?.relationshipId === relationshipId) {
          setSelectedChild(null);
        }
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to cancel request');
    }
  };

  // End Relationship
  const handleEndRelationship = async (relationshipId) => {
    if (!window.confirm('Are you sure you want to end this parent-child relationship?')) return;
    try {
      const res = await endParentStudentRelationship(relationshipId);
      if (res?.success) {
        fetchChildren();
        if (selectedChild?.relationshipId === relationshipId) {
          setSelectedChild(null);
        }
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to end relationship');
    }
  };

  // Open Booking Modal for active child
  const handleOpenBookingModal = async (child) => {
    setSelectedChild(child);
    setBookingError(null);
    setBookingForm({
      teacherStudentId: '',
      subject: '',
      lessonDate: '',
      startTime: '',
      endTime: '',
      notes: ''
    });
    // Ensure teachers are loaded for teacher dropdown
    try {
      const res = await getChildTeachers(child.studentId);
      if (res?.success) {
        setChildData(prev => ({ ...prev, teachers: res.teachers || [] }));
      }
    } catch (err) {
      console.error('Failed to load child teachers:', err);
    }
    setIsBookingModalOpen(true);
  };

  // Request Teacher: discover teachers for a linked child (parent discovery)
  const fetchTeachersForChild = useCallback(async (studentId, page = 1, search = '') => {
    try {
      setTeacherSearchLoading(true);
      setRequestTeacherError(null);
      const params = { page, limit: 12 };
      if (search && search.trim()) params.search = search.trim();
      const res = await discoverChildTeachers(studentId, params);
      if (res?.success) {
        setDiscoveredTeachers(res.teachers || []);
        setTeacherPagination(res.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });
      } else {
        setDiscoveredTeachers([]);
      }
    } catch (err) {
      console.error('Error discovering teachers for child:', err);
      setRequestTeacherError(err?.response?.data?.message || t('parentStudents.requestTeacherLoadError'));
      setDiscoveredTeachers([]);
    } finally {
      setTeacherSearchLoading(false);
    }
  }, [t]);

  const openRequestTeacherModal = (child) => {
    setRequestTeacherTargetChild(child);
    setTeacherSearchQuery('');
    setTeacherCurrentPage(1);
    setRequestTeacherError(null);
    setRequestTeacherSuccess(null);
    setIsRequestTeacherModalOpen(true);
    fetchTeachersForChild(child.studentId, 1, '');
  };

  const handleRequestTeacherSearch = (e) => {
    e.preventDefault();
    setTeacherCurrentPage(1);
    if (requestTeacherTargetChild) {
      fetchTeachersForChild(requestTeacherTargetChild.studentId, 1, teacherSearchQuery);
    }
  };

  const handleTeacherPageChange = (page) => {
    setTeacherCurrentPage(page);
    if (requestTeacherTargetChild) {
      fetchTeachersForChild(requestTeacherTargetChild.studentId, page, teacherSearchQuery);
    }
  };

  const handleRequestTeacher = async (teacherId) => {
    if (!requestTeacherTargetChild) return;
    try {
      setRequestingTeacherId(teacherId);
      setRequestTeacherError(null);
      setRequestTeacherSuccess(null);
      const res = await requestChildTeacher(requestTeacherTargetChild.studentId, teacherId);
      if (res?.success) {
        setRequestTeacherSuccess(t('parentStudents.requestTeacherSuccess'));
        fetchTeachersForChild(requestTeacherTargetChild.studentId, teacherCurrentPage, teacherSearchQuery);
        if (selectedChild?.studentId === requestTeacherTargetChild.studentId) {
          loadChildTabData(requestTeacherTargetChild.studentId, 'teachers');
        }
        setTimeout(() => setRequestTeacherSuccess(null), 5000);
      }
    } catch (err) {
      setRequestTeacherError(err?.response?.data?.message || t('parentStudents.requestTeacherError'));
    } finally {
      setRequestingTeacherId(null);
    }
  };

  const closeRequestTeacherModal = () => {
    setIsRequestTeacherModalOpen(false);
    setRequestTeacherTargetChild(null);
    setDiscoveredTeachers([]);
    setRequestTeacherError(null);
    setRequestTeacherSuccess(null);
  };

  // Submit Booking on behalf of child
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError(null);

    if (!bookingForm.teacherStudentId) {
      setBookingError(t('parentStudents.selectTeacher'));
      return;
    }
    if (!bookingForm.lessonDate || !bookingForm.startTime || !bookingForm.endTime) {
      setBookingError('Please select lesson date, start time, and end time.');
      return;
    }

    try {
      setBookingSubmitting(true);
      const res = await createChildBooking(selectedChild.studentId, {
        teacherStudentId: bookingForm.teacherStudentId,
        subject: bookingForm.subject.trim() || undefined,
        lessonDate: bookingForm.lessonDate,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        notes: bookingForm.notes.trim() || undefined
      });

      if (res?.success) {
        setSuccessMessage(t('parentStudents.bookingSuccess'));
        setIsBookingModalOpen(false);
        if (childTab === 'bookings') {
          loadChildTabData(selectedChild.studentId, 'bookings');
        }
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      setBookingError(err?.response?.data?.message || t('parentStudents.bookingError'));
    } finally {
      setBookingSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <CheckCircle size={12} /> {t('parentStudents.statusActive')}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            <Clock size={12} /> {t('parentStudents.statusPending')}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
            <XCircle size={12} /> {t('parentStudents.statusRejected')}
          </span>
        );
      case 'ENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <XCircle size={12} /> {t('parentStudents.statusEnded')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <RolePageHeader
          title={t('parentStudents.pageTitle')}
          subtitle={t('parentStudents.subtitle')}
          icon={GraduationCap}
          actions={
            <button
              onClick={() => {
                setLinkError(null);
                setIsLinkModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl backdrop-blur-sm transition-all shadow-sm"
            >
              <UserPlus size={18} />
              {t('parentStudents.linkChildBtn')}
            </button>
          }
        />

        {successMessage && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl">
            <CheckCircle size={20} className="flex-shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Children Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users size={20} className="text-teal-600 dark:text-teal-400" />
              {t('parentStudents.pageTitle')} ({children.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
              <p className="text-sm">{t('parentStudents.loadingChildren')}</p>
            </div>
          ) : children.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {t('parentStudents.noChildren')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                {t('parentStudents.noChildrenDesc')}
              </p>
              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl shadow-sm transition"
              >
                <Plus size={16} />
                {t('parentStudents.linkChildBtn')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => (
                <div
                  key={child.relationshipId}
                  className={`border rounded-xl p-5 transition-all ${
                    selectedChild?.relationshipId === child.relationshipId
                      ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        {child.firstName} {child.lastName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {child.email}
                      </p>
                    </div>
                    {getStatusBadge(child.relationshipStatus)}
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('parentStudents.school')}:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{child.school || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('parentStudents.grade')}:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{child.grade || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('parentStudents.relationshipTypeLabel')}:</span>
                      <span className="font-medium text-teal-700 dark:text-teal-300">{child.relationshipType}</span>
                    </div>
                  </div>

                  {child.relationshipStatus === 'ACTIVE' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectChild(child)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition"
                      >
                        <BookOpen size={14} />
                        {t('parentStudents.viewOverview')}
                      </button>
                      <button
                        onClick={() => handleOpenBookingModal(child)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition"
                      >
                        <Calendar size={14} />
                        {t('parentStudents.bookLessonBtn')}
                      </button>
                    </div>
                  ) : child.relationshipStatus === 'PENDING' ? (
                    <button
                      onClick={() => handleCancelRequest(child.relationshipId)}
                      className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-medium rounded-lg transition"
                    >
                      {t('parentStudents.cancelBtn')}
                    </button>
                  ) : (
                    <span className="block text-center text-xs text-gray-400 italic">
                      {t('parentStudents.statusEnded')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Child Details Inspector */}
        {selectedChild && selectedChild.relationshipStatus === 'ACTIVE' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="text-teal-600" />
                  {selectedChild.firstName} {selectedChild.lastName} — {t('parentStudents.modalOverviewTitle')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedChild.email} • {selectedChild.school} • {selectedChild.grade}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openRequestTeacherModal(selectedChild)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  <UserPlus size={15} />
                  {t('parentStudents.requestTeacherBtn')}
                </button>
                <button
                  onClick={() => handleOpenBookingModal(selectedChild)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  <Calendar size={15} />
                  {t('parentStudents.bookLessonBtn')}
                </button>
                <button
                  onClick={() => handleEndRelationship(selectedChild.relationshipId)}
                  className="px-3.5 py-2 border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold rounded-xl transition"
                >
                  {t('parentStudents.statusEnded')}
                </button>
              </div>
            </div>

            {/* Sub-tabs Navigation */}
            <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 gap-2">
              {[
                { id: 'overview', label: t('parentStudents.overviewTab'), icon: BookOpen },
                { id: 'teachers', label: t('parentStudents.teachersTab'), icon: Users },
                { id: 'lessons', label: t('parentStudents.lessonsTab'), icon: Calendar },
                { id: 'progress', label: t('parentStudents.progressTab'), icon: TrendingUp },
                { id: 'homework', label: t('parentStudents.homeworkTab'), icon: FileText },
                { id: 'bookings', label: t('parentStudents.bookingsTab'), icon: Clock }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const active = childTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                      active
                        ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <TabIcon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            {childDataLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600 mr-2" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <div>
                {/* 1. OVERVIEW TAB */}
                {childTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-teal-50/50 dark:bg-teal-950/20 p-4 rounded-xl border border-teal-100 dark:border-teal-900/40">
                        <span className="text-xs font-medium text-teal-700 dark:text-teal-300">
                          {t('parentStudents.activeTeachers')}
                        </span>
                        <p className="text-2xl font-bold text-teal-900 dark:text-teal-100 mt-1">
                          {childData.overview?.activeTeachersCount ?? 0}
                        </p>
                      </div>

                      <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          {t('parentStudents.attendanceRate')}
                        </span>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                          {childData.overview?.academicProgress?.attendanceRate ?? 100}%
                        </p>
                      </div>

                      <div className="bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/40">
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                          {t('parentStudents.homeworkCompletion')}
                        </span>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                          {childData.overview?.academicProgress?.homeworkCompletionRate ?? 100}%
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/40 p-4 rounded-xl">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {t('parentStudents.nextLesson')}
                      </h4>
                      {childData.overview?.nextLesson ? (
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {childData.overview.nextLesson.subject || 'Lesson'}
                            </span>{' '}
                            with Teacher
                          </div>
                          <div className="text-gray-500">
                            {new Date(childData.overview.nextLesson.scheduledAt).toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">
                          {t('parentStudents.noUpcomingLesson')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. TEACHERS TAB */}
                {childTab === 'teachers' && (
                  <div>
                    {childData.teachers.length === 0 ? (
                      <p className="text-sm text-gray-500 py-6 text-center">
                        {t('parentStudents.noTeachersLinked')}
                      </p>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {childData.teachers.map((tItem) => (
                          <div key={tItem.id} className="py-3 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                {tItem.teacherName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {tItem.subject || 'General'}
                              </p>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                              Active
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. LESSONS TAB */}
                {childTab === 'lessons' && (
                  <div>
                    {childData.lessons.length === 0 ? (
                      <p className="text-sm text-gray-500 py-6 text-center">
                        {t('parentStudents.noLessonsFound')}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {childData.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="p-3 border rounded-xl border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                                {lesson.title || lesson.subject}
                              </h5>
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                {lesson.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {lesson.scheduledAt ? new Date(lesson.scheduledAt).toLocaleString() : 'TBD'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. PROGRESS TAB */}
                {childTab === 'progress' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                        <span className="text-xs text-gray-500">{t('parentStudents.attendanceRate')}</span>
                        <p className="text-lg font-bold text-teal-600 mt-1">
                          {childData.progress?.attendanceRate ?? 100}%
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                        <span className="text-xs text-gray-500">{t('parentStudents.homeworkCompletion')}</span>
                        <p className="text-lg font-bold text-blue-600 mt-1">
                          {childData.progress?.homeworkCompletionRate ?? 100}%
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                        <span className="text-xs text-gray-500">{t('parentStudents.averageGrade')}</span>
                        <p className="text-lg font-bold text-purple-600 mt-1">
                          {childData.progress?.averageGrade ?? 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                        <span className="text-xs text-gray-500">{t('parentStudents.totalAssessments')}</span>
                        <p className="text-lg font-bold text-amber-600 mt-1">
                          {childData.progress?.totalAssessments ?? 0}
                        </p>
                      </div>
                    </div>

                    {(!childData.progress?.assessments || childData.progress.assessments.length === 0) ? (
                      <p className="text-xs text-gray-500 py-4 text-center">
                        {t('parentStudents.noAssessmentsFound')}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {childData.progress.assessments.map((a, idx) => (
                          <div key={idx} className="p-3 border rounded-lg text-xs flex justify-between">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{a.title}</p>
                              <p className="text-gray-500">{a.subject}</p>
                            </div>
                            <span className="font-bold text-teal-600">{a.score}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. HOMEWORK TAB */}
                {childTab === 'homework' && (
                  <div>
                    {childData.homework.length === 0 ? (
                      <p className="text-sm text-gray-500 py-6 text-center">
                        {t('parentStudents.noHomeworkFound')}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {childData.homework.map((hw) => (
                          <div key={hw.id} className="p-3 border rounded-xl border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-bold text-xs text-gray-900 dark:text-white">
                                {hw.title || hw.lessonTitle}
                              </h5>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  hw.isCompleted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {hw.isCompleted ? t('parentStudents.completed') : t('parentStudents.pending')}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {hw.description || hw.instructions}
                            </p>
                            {hw.dueDate && (
                              <p className="text-[10px] text-gray-400 mt-1">
                                {t('parentStudents.dueDate')}: {new Date(hw.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. BOOKINGS TAB */}
                {childTab === 'bookings' && (
                  <div>
                    {childData.bookings.length === 0 ? (
                      <p className="text-sm text-gray-500 py-6 text-center">
                        {t('parentStudents.noBookingsFound')}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {childData.bookings.map((b) => (
                          <div key={b.id} className="p-3 border rounded-xl border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-gray-900 dark:text-white">
                                {b.subject || 'Lesson'}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                {b.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {b.lessonDate} ({b.startTime} - {b.endTime})
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal: Link Child Account */}
        {isLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('parentStudents.linkChildModalTitle')}
                </h3>
                <button
                  onClick={() => setIsLinkModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {t('parentStudents.linkChildDesc')}
              </p>

              {linkError && (
                <div className="mb-4 p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
                  {linkError}
                </div>
              )}

              <form onSubmit={handleLinkSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('parentStudents.studentEmailLabel')}
                  </label>
                  <input
                    type="email"
                    value={linkForm.studentEmail}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, studentEmail: e.target.value }))}
                    placeholder={t('parentStudents.studentEmailPlaceholder')}
                    className="w-full px-3 py-2 text-sm border rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('parentStudents.studentIdLabel')}
                  </label>
                  <input
                    type="text"
                    value={linkForm.studentUserId}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, studentUserId: e.target.value }))}
                    placeholder={t('parentStudents.studentIdPlaceholder')}
                    className="w-full px-3 py-2 text-sm border rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('parentStudents.relationshipTypeLabel')}
                  </label>
                  <select
                    value={linkForm.relationshipType}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, relationshipType: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="PARENT">{t('parentStudents.relationParent')}</option>
                    <option value="GUARDIAN">{t('parentStudents.relationGuardian')}</option>
                    <option value="FAMILY_MEMBER">{t('parentStudents.relationFamily')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('parentStudents.notesLabel')}
                  </label>
                  <textarea
                    rows={2}
                    value={linkForm.personalNote}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, personalNote: e.target.value }))}
                    placeholder={t('parentStudents.notesPlaceholder')}
                    className="w-full px-3 py-2 text-sm border rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                  >
                    {t('parentStudents.cancelBtn')}
                  </button>
                  <button
                    type="submit"
                    disabled={linkSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    {linkSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                    {linkSubmitting ? t('parentStudents.sendingRequest') : t('parentStudents.sendRequestBtn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Book Lesson on Behalf of Child */}
        {isBookingModalOpen && selectedChild && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('parentStudents.modalBookLessonTitle')}
                </h3>
                <button
                  onClick={() => setIsBookingModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={18} />
                </button>
              </div>

              {bookingError && (
                <div className="mb-4 p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
                  {bookingError}
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('parentStudents.selectTeacher')}
                  </label>
                  <select
                    value={bookingForm.teacherStudentId}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, teacherStudentId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    <option value="">-- Choose connected teacher --</option>
                    {childData.teachers.map((tItem) => (
                      <option key={tItem.id} value={tItem.id}>
                        {tItem.teacherName} ({tItem.subject || 'All Subjects'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('parentStudents.subject')}
                  </label>
                  <input
                    type="text"
                    value={bookingForm.subject}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g. Mathematics"
                    className="w-full px-3 py-2 text-sm border rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('parentStudents.date')}
                  </label>
                  <input
                    type="date"
                    value={bookingForm.lessonDate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, lessonDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t('parentStudents.startTime')}
                    </label>
                    <input
                      type="time"
                      value={bookingForm.startTime}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t('parentStudents.endTime')}
                    </label>
                    <input
                      type="time"
                      value={bookingForm.endTime}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('parentStudents.noteForTeacher')}
                  </label>
                  <textarea
                    rows={2}
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('parentStudents.notePlaceholder')}
                    className="w-full px-3 py-2 text-sm border rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                  >
                    {t('parentStudents.cancelBtn')}
                  </button>
                  <button
                    type="submit"
                    disabled={bookingSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    {bookingSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                    {t('parentStudents.submitBookingBtn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal: Request Teacher for Child */}
        {isRequestTeacherModalOpen && requestTeacherTargetChild && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('parentStudents.requestTeacherTitle')}
                </h3>
                <button
                  onClick={closeRequestTeacherModal}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {t('parentStudents.requestTeacherFor', {
                  name: `${requestTeacherTargetChild.firstName} ${requestTeacherTargetChild.lastName}`
                })}
              </p>

              {requestTeacherSuccess && (
                <div className="mb-4 p-3 text-xs bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                  {requestTeacherSuccess}
                </div>
              )}
              {requestTeacherError && (
                <div className="mb-4 p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
                  {requestTeacherError}
                </div>
              )}

              <form onSubmit={handleRequestTeacherSearch} className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  placeholder={t('parentStudents.requestTeacherSearchPlaceholder')}
                  className="flex-1 px-3 py-2 text-sm border rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition inline-flex items-center gap-1"
                >
                  <Search size={14} />
                </button>
              </form>

              {teacherSearchLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : discoveredTeachers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  {t('parentStudents.requestTeacherEmpty')}
                </p>
              ) : (
                <div className="space-y-3">
                  {discoveredTeachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className={`p-3 border rounded-xl flex items-center justify-between gap-3 transition ${
                        teacher.isPremium
                          ? 'border-purple-400 dark:border-purple-500 bg-purple-100/80 dark:bg-purple-900/30 shadow-[0_0_16px_rgba(168,85,247,0.40)]'
                          : 'border-gray-100 dark:border-gray-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                          <span className="truncate">{teacher.fullName}</span>
                          {teacher.isVerified && (
                            <span title={t('parentStudents.verifiedBadge') || 'Verified Teacher'}>
                              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {teacher.mainSubject || 'General'} · {teacher.yearsOfExperience} {t('parentStudents.yearsSuffix')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {teacher.lessonRate > 0 ? `${teacher.lessonRate} ${teacher.pricingCurrency}` : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {teacher.relationshipStatus && teacher.relationshipStatus !== 'NONE' ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            teacher.relationshipStatus === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : teacher.relationshipStatus === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-600'
                          }`}>
                            {teacher.relationshipStatus === 'PENDING'
                              ? t('parentStudents.statusPending')
                              : teacher.relationshipStatus === 'ACTIVE'
                                ? t('parentStudents.statusActive')
                                : t('parentStudents.statusEnded')}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRequestTeacher(teacher.id)}
                            disabled={requestingTeacherId === teacher.id}
                            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            {requestingTeacherId === teacher.id ? <Loader2 size={12} className="animate-spin" /> : null}
                            {t('parentStudents.requestTeacherBtn')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {teacherPagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    onClick={() => handleTeacherPageChange(Math.max(1, teacherCurrentPage - 1))}
                    disabled={teacherCurrentPage <= 1}
                    className="px-3 py-1 text-xs border rounded-lg disabled:opacity-50 text-gray-600"
                  >
                    <ChevronRight size={12} className="rotate-180" />
                  </button>
                  <span className="text-xs text-gray-500">
                    {teacherCurrentPage} / {teacherPagination.totalPages}
                  </span>
                  <button
                    onClick={() => handleTeacherPageChange(Math.min(teacherPagination.totalPages, teacherCurrentPage + 1))}
                    disabled={teacherCurrentPage >= teacherPagination.totalPages}
                    className="px-3 py-1 text-xs border rounded-lg disabled:opacity-50 text-gray-600"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ParentStudents;
