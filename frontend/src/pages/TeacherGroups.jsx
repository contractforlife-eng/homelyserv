// frontend/src/pages/TeacherGroups.jsx
// ============================================================
// TEACHER GROUPS & CLASSES PAGE
//
// CRITICAL ARCHITECTURE REQUIREMENTS:
// 1. Unified group management: List all Teacher's classes with real enrollment counts.
// 2. Group details: Displays group metadata and enrolled students.
// 3. Homely Student Badge: Reuses HomelyStudentBadge.jsx; shown if and only if
//    the enrolled student has `isHomelyStudent === true` (linkedUserId != null).
// 4. Student Enrollment:
//    - Select from existing TeacherStudent records belonging to the teacher.
//    - Does NOT create duplicate students.
//    - Prevent duplicate active enrollment in the same group.
//    - Removing a student removes the enrollment ONLY; never deletes TeacherStudent.
// 5. Tenancy isolation: Guaranteed server-side via req.userId.
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import HomelyStudentBadge from '../components/teacher/HomelyStudentBadge';
import { TEACHER_SUBJECTS, TEACHING_LEVELS } from '../constants/teacherTaxonomy';
import api from '../utils/api';
import {
  Layers,
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  BookOpen,
  GraduationCap,
  School,
  Phone,
  Mail,
  UserPlus,
  UserMinus,
  Sparkles,
  Palette,
  Clock,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

const INPUT_CLS =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all';

const DAYS_OF_WEEK = [
  { key: 'sunday', labelKey: 'teacherGroups.daysOfWeek.sunday' },
  { key: 'monday', labelKey: 'teacherGroups.daysOfWeek.monday' },
  { key: 'tuesday', labelKey: 'teacherGroups.daysOfWeek.tuesday' },
  { key: 'wednesday', labelKey: 'teacherGroups.daysOfWeek.wednesday' },
  { key: 'thursday', labelKey: 'teacherGroups.daysOfWeek.thursday' },
  { key: 'friday', labelKey: 'teacherGroups.daysOfWeek.friday' },
  { key: 'saturday', labelKey: 'teacherGroups.daysOfWeek.saturday' }
];

const PRESET_COLORS = [
  '#DC2626', // Red (platform primary)
  '#2563EB', // Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#7C3AED', // Purple
  '#DB2777', // Pink
  '#0891B2', // Cyan
  '#4B5563'  // Slate
];

const initialGroupForm = {
  name: '',
  subject: '',
  gradeLevel: '',
  academicYear: '',
  description: '',
  scheduleDays: [],
  color: '#DC2626',
  status: 'ACTIVE'
};

const TeacherGroups = () => {
  const { t } = useTranslation();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Selected group for details view
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupStudents, setGroupStudents] = useState([]);
  const [loadingGroupStudents, setLoadingGroupStudents] = useState(false);

  // Group Form (Create / Edit)
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState(initialGroupForm);
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [groupFormError, setGroupFormError] = useState('');

  // Archive / Delete Group Modal
  const [archivingGroup, setArchivingGroup] = useState(null);
  const [archiving, setArchiving] = useState(false);

  // Enroll Student Modal
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loadingAvailableStudents, setLoadingAvailableStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [enrollmentNotes, setEnrollmentNotes] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  // Remove Student from Group Modal
  const [removingStudent, setRemovingStudent] = useState(null);
  const [removing, setRemoving] = useState(false);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/api/teachers/groups', { params });
      if (res.data?.success) {
        setGroups(Array.isArray(res.data.groups) ? res.data.groups : []);
      } else {
        setGroups([]);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setErrorMessage(
        err.response?.data?.message ||
          t('teacherGroups.messages.loadError') ||
          'Failed to load groups.'
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, t]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Load details and students for selected group
  const loadGroupDetails = useCallback(async (groupId) => {
    try {
      setLoadingGroupStudents(true);
      const res = await api.get(`/api/teachers/groups/${groupId}`);
      if (res.data?.success) {
        setSelectedGroup(res.data.group);
        setGroupStudents(Array.isArray(res.data.students) ? res.data.students : []);
      }
    } catch (err) {
      console.error('Failed to load group details:', err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to load group details.'
      );
    } finally {
      setLoadingGroupStudents(false);
    }
  }, []);

  // Summary counts
  const stats = useMemo(() => {
    const total = groups.length;
    const active = groups.filter((g) => g.status === 'ACTIVE').length;
    const enrolledTotal = groups.reduce((acc, g) => acc + (g.studentCount || 0), 0);
    const avgSize = total > 0 ? Math.round((enrolledTotal / total) * 10) / 10 : 0;
    return { total, active, enrolledTotal, avgSize };
  }, [groups]);

  // Open Create Group
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupForm(initialGroupForm);
    setGroupFormError('');
    setIsGroupFormOpen(true);
  };

  // Open Edit Group
  const handleOpenEditGroup = (group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name || '',
      subject: group.subject || '',
      gradeLevel: group.gradeLevel || '',
      academicYear: group.academicYear || '',
      description: group.description || '',
      scheduleDays: Array.isArray(group.scheduleDays) ? group.scheduleDays : [],
      color: group.color || '#DC2626',
      status: group.status || 'ACTIVE'
    });
    setGroupFormError('');
    setIsGroupFormOpen(true);
  };

  // Toggle Schedule Day
  const handleToggleDay = (dayKey) => {
    setGroupForm((prev) => {
      const exists = prev.scheduleDays.includes(dayKey);
      return {
        ...prev,
        scheduleDays: exists
          ? prev.scheduleDays.filter((d) => d !== dayKey)
          : [...prev.scheduleDays, dayKey]
      };
    });
  };

  // Submit Group Form (Create / Update)
  const handleSubmitGroupForm = async (e) => {
    e.preventDefault();
    setGroupFormError('');

    if (!groupForm.name.trim() || !groupForm.subject.trim()) {
      setGroupFormError(
        t('teacherGroups.messages.nameRequired') ||
          'Group name and subject are required.'
      );
      return;
    }

    try {
      setGroupSubmitting(true);
      const payload = {
        name: groupForm.name.trim(),
        subject: groupForm.subject.trim(),
        gradeLevel: groupForm.gradeLevel.trim(),
        academicYear: groupForm.academicYear.trim(),
        description: groupForm.description.trim(),
        scheduleDays: groupForm.scheduleDays,
        color: groupForm.color,
        status: groupForm.status
      };

      if (editingGroup) {
        await api.put(`/api/teachers/groups/${editingGroup.id}`, payload);
        setSuccessMessage(
          t('teacherGroups.messages.updateSuccess') ||
            'Group details updated successfully.'
        );
      } else {
        await api.post('/api/teachers/groups', payload);
        setSuccessMessage(
          t('teacherGroups.messages.createSuccess') ||
            'Group created successfully.'
        );
      }

      setIsGroupFormOpen(false);
      setEditingGroup(null);
      await fetchGroups();
      if (selectedGroup) {
        await loadGroupDetails(selectedGroup.id);
      }
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to save group:', err);
      setGroupFormError(
        err.response?.data?.message || 'Failed to save group details.'
      );
    } finally {
      setGroupSubmitting(false);
    }
  };

  // Archive / Delete Group
  const handleConfirmArchiveGroup = async () => {
    if (!archivingGroup) return;
    try {
      setArchiving(true);
      await api.delete(`/api/teachers/groups/${archivingGroup.id}`);
      setSuccessMessage(
        t('teacherGroups.messages.archiveSuccess') ||
          'Group archived successfully.'
      );
      setArchivingGroup(null);
      if (selectedGroup?.id === archivingGroup.id) {
        setSelectedGroup(null);
      }
      await fetchGroups();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to archive group:', err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to archive group.'
      );
    } finally {
      setArchiving(false);
    }
  };

  // Open Enroll Student Modal
  const handleOpenEnrollModal = async () => {
    if (!selectedGroup) return;
    try {
      setEnrollError('');
      setSelectedStudentId('');
      setEnrollmentNotes('');
      setIsEnrollModalOpen(true);
      setLoadingAvailableStudents(true);

      // Fetch teacher's active students
      const res = await api.get('/api/teachers/students?status=ACTIVE');
      if (res.data?.success) {
        setAvailableStudents(Array.isArray(res.data.students) ? res.data.students : []);
      }
    } catch (err) {
      console.error('Failed to load eligible students:', err);
      setEnrollError('Failed to load eligible students.');
    } finally {
      setLoadingAvailableStudents(false);
    }
  };

  // Submit Enroll Student
  const handleSubmitEnrollment = async (e) => {
    e.preventDefault();
    setEnrollError('');

    if (!selectedStudentId) {
      setEnrollError(
        t('teacherGroups.messages.studentRequired') ||
          'Please select a student to enroll.'
      );
      return;
    }

    try {
      setEnrolling(true);
      await api.post(`/api/teachers/groups/${selectedGroup.id}/students`, {
        studentId: selectedStudentId,
        notes: enrollmentNotes.trim()
      });

      setSuccessMessage(
        t('teacherGroups.messages.enrollSuccess') ||
          'Student enrolled in group successfully.'
      );
      setIsEnrollModalOpen(false);
      await loadGroupDetails(selectedGroup.id);
      await fetchGroups();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to enroll student:', err);
      setEnrollError(
        err.response?.data?.message ||
          t('teacherGroups.alreadyEnrolledMsg') ||
          'Failed to enroll student.'
      );
    } finally {
      setEnrolling(false);
    }
  };

  // Remove Student from Group
  const handleConfirmRemoveStudent = async () => {
    if (!removingStudent || !selectedGroup) return;
    try {
      setRemoving(true);
      await api.delete(
        `/api/teachers/groups/${selectedGroup.id}/students/${removingStudent.studentId}`
      );
      setSuccessMessage(
        t('teacherGroups.messages.removeStudentSuccess') ||
          'Student removed from group successfully.'
      );
      setRemovingStudent(null);
      await loadGroupDetails(selectedGroup.id);
      await fetchGroups();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to remove student from group:', err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to remove student from group.'
      );
    } finally {
      setRemoving(false);
    }
  };

  return (
    <DashboardLayout requiredRole="TEACHER">
      <DashboardHeader
        title={t('teacherGroups.headerTitle') || 'Groups & Classes'}
        subtitle={
          t('teacherGroups.subtitle') ||
          'Organize your students into classes, grade levels, and study groups.'
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
        {/* Flash Notifications */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-400 hover:text-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 flex items-start gap-3 text-sm text-green-700 dark:text-green-300">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-green-400 hover:text-green-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 1: GROUP DETAILS VIEW (WHEN A GROUP IS SELECTED)     */}
        {/* ======================================================== */}
        {selectedGroup ? (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Back button and group header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedGroup(null)}
                    className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                    title="Back to all groups"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm font-bold text-lg"
                      style={{ backgroundColor: selectedGroup.color || '#DC2626' }}
                    >
                      <Layers size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedGroup.name}
                        </h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedGroup.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {selectedGroup.status === 'ACTIVE'
                            ? t('teacherGroups.fields.statusActive') || 'Active'
                            : t('teacherGroups.fields.statusArchived') || 'Archived'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {selectedGroup.subject}
                        {selectedGroup.gradeLevel && ` • ${selectedGroup.gradeLevel}`}
                        {selectedGroup.academicYear && ` • ${selectedGroup.academicYear}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenEditGroup(selectedGroup)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Edit size={15} />
                    <span>{t('teacherGroups.actions.edit') || 'Edit'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenEnrollModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium shadow-sm transition-colors"
                  >
                    <UserPlus size={16} />
                    <span>{t('teacherGroups.enrollStudentBtn') || 'Add Student'}</span>
                  </button>
                </div>
              </div>

              {/* Group Description & Days */}
              {(selectedGroup.description || (Array.isArray(selectedGroup.scheduleDays) && selectedGroup.scheduleDays.length > 0)) && (
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {selectedGroup.description && (
                    <div>
                      <span className="font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                        {t('teacherGroups.fields.description') || 'Description'}
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedGroup.description}
                      </p>
                    </div>
                  )}

                  {Array.isArray(selectedGroup.scheduleDays) && selectedGroup.scheduleDays.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
                        {t('teacherGroups.fields.scheduleDays') || 'Schedule Days'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedGroup.scheduleDays.map((dayKey) => {
                          const dayObj = DAYS_OF_WEEK.find((d) => d.key === dayKey);
                          return (
                            <span
                              key={dayKey}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium"
                            >
                              {dayObj ? t(dayObj.labelKey) : dayKey}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Students List in Group */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="text-red-600" size={18} />
                    <span>{t('teacherGroups.studentsInGroup') || 'Enrolled Students'}</span>
                    <span className="text-sm font-normal text-gray-500">
                      ({groupStudents.length})
                    </span>
                  </h3>
                </div>
              </div>

              {loadingGroupStudents ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-2" />
                  <p className="text-xs text-gray-400">Loading students...</p>
                </div>
              ) : groupStudents.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={t('teacherGroups.noStudentsInGroup') || 'No students enrolled in this group yet.'}
                  description={
                    t('teacherGroups.noStudentsInGroupDesc') ||
                    'Click "Add Student" to enroll students from your students list.'
                  }
                  action={
                    <button
                      type="button"
                      onClick={handleOpenEnrollModal}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                    >
                      <UserPlus size={16} />
                      <span>{t('teacherGroups.enrollStudentBtn') || 'Add Student to Group'}</span>
                    </button>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/75 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <th className="py-3 px-4 text-start">
                          {t('teacherStudents.fields.fullName') || 'Student Name'}
                        </th>
                        <th className="py-3 px-4 text-start">
                          {t('teacherStudents.fields.school') || 'School / Grade'}
                        </th>
                        <th className="py-3 px-4 text-start">
                          {t('teacherStudents.fields.phone') || 'Contact'}
                        </th>
                        <th className="py-3 px-4 text-end">
                          {t('teacherGroups.actions.removeStudent') || 'Action'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                      {groupStudents.map((st) => (
                        <tr
                          key={st.enrollmentId}
                          className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          {/* Student Name + Homely Badge */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {st.fullName}
                              </span>
                              {st.isHomelyStudent && (
                                <HomelyStudentBadge size="sm" />
                              )}
                            </div>
                            {st.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs mt-0.5">
                                {st.email}
                              </div>
                            )}
                          </td>

                          {/* Grade & School */}
                          <td className="py-3.5 px-4">
                            <div className="text-gray-800 dark:text-gray-200 text-xs">
                              {st.gradeLevel || '—'}
                            </div>
                            {st.school && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs mt-0.5">
                                {st.school}
                              </div>
                            )}
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-4">
                            {st.phone ? (
                              <span className="text-xs text-gray-700 dark:text-gray-300" dir="ltr">
                                {st.phone}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>

                          {/* Remove Student Action */}
                          <td className="py-3.5 px-4 text-end">
                            <button
                              type="button"
                              onClick={() => setRemovingStudent(st)}
                              title={t('teacherGroups.actions.removeStudent') || 'Remove Student'}
                              className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            >
                              <UserMinus size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW 2: ALL GROUPS LIST & STATS                          */
          /* ======================================================== */
          <>
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center shrink-0">
                    <Layers size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('teacherGroups.totalGroups') || 'Total Groups'}
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {stats.total}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/50 text-green-600 flex items-center justify-center shrink-0">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('teacherGroups.activeGroups') || 'Active Groups'}
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {stats.active}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('teacherGroups.totalEnrolled') || 'Enrolled Students'}
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {stats.enrolledTotal}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('teacherGroups.avgGroupSize') || 'Avg Group Size'}
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {stats.avgSize}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Actions Toolbar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      t('teacherGroups.searchPlaceholder') ||
                      'Search groups by name, subject, grade, or academic year...'
                    }
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                >
                  <option value="ALL">
                    {t('teacherGroups.allStatuses') || 'All Statuses'}
                  </option>
                  <option value="ACTIVE">
                    {t('teacherGroups.fields.statusActive') || 'Active'}
                  </option>
                  <option value="ARCHIVED">
                    {t('teacherGroups.fields.statusArchived') || 'Archived'}
                  </option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateGroup}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium shadow-sm transition-colors shrink-0"
              >
                <Plus size={18} />
                <span>{t('teacherGroups.createGroupBtn') || 'Create Group'}</span>
              </button>
            </div>

            {/* Groups Grid / List */}
            {loading ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Loading groups...
                </p>
              </div>
            ) : groups.length === 0 ? (
              <EmptyState
                icon={Layers}
                title={
                  searchQuery || statusFilter !== 'ALL'
                    ? t('teacherGroups.noSearchResults') || 'No matching groups found'
                    : t('teacherGroups.noGroups') || 'No groups found'
                }
                description={
                  searchQuery || statusFilter !== 'ALL'
                    ? t('teacherGroups.noSearchResultsDesc') ||
                      'Try adjusting your search terms or filters.'
                    : t('teacherGroups.noGroupsDesc') ||
                      'You have not created any groups or classes yet. Click "Create Group" to start organizing your students.'
                }
                action={
                  !searchQuery && statusFilter === 'ALL' ? (
                    <button
                      type="button"
                      onClick={handleOpenCreateGroup}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                    >
                      <Plus size={16} />
                      <span>{t('teacherGroups.createGroupBtn') || 'Create Group'}</span>
                    </button>
                  ) : null
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Color bar + status badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: group.color || '#DC2626' }}
                          />
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {group.subject}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            group.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {group.status === 'ACTIVE'
                            ? t('teacherGroups.fields.statusActive') || 'Active'
                            : t('teacherGroups.fields.statusArchived') || 'Archived'}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">
                        {group.name}
                      </h4>

                      {/* Grade & Year */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3 flex-wrap">
                        {group.gradeLevel && <span>{group.gradeLevel}</span>}
                        {group.gradeLevel && group.academicYear && <span>•</span>}
                        {group.academicYear && <span>{group.academicYear}</span>}
                      </div>

                      {/* Schedule Days Chips */}
                      {Array.isArray(group.scheduleDays) && group.scheduleDays.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {group.scheduleDays.map((dayKey) => {
                            const dayObj = DAYS_OF_WEEK.find((d) => d.key === dayKey);
                            return (
                              <span
                                key={dayKey}
                                className="px-2 py-0.5 rounded-md text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                              >
                                {dayObj ? t(dayObj.labelKey) : dayKey}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer: Student count + action buttons */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-2 mt-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <Users size={15} className="text-gray-400" />
                        <span>{group.studentCount || 0}</span>
                        <span className="text-gray-400 font-normal">
                          {t('teacherNav.students') || 'Students'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGroup(group);
                            loadGroupDetails(group.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors"
                        >
                          <Eye size={13} />
                          <span>{t('teacherGroups.actions.viewGroup') || 'View'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditGroup(group)}
                          title={t('teacherGroups.actions.edit') || 'Edit'}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setArchivingGroup(group)}
                          title={t('teacherGroups.actions.archive') || 'Archive'}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: CREATE / EDIT GROUP                             */}
      {/* ======================================================== */}
      {isGroupFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="text-red-600" size={20} />
                <span>
                  {editingGroup
                    ? t('teacherGroups.editGroupTitle') || 'Edit Group'
                    : t('teacherGroups.createGroupTitle') || 'Create New Group / Class'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsGroupFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            {groupFormError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{groupFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitGroupForm} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('teacherGroups.fields.name') || 'Group / Class Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, name: e.target.value })
                  }
                  placeholder={
                    t('teacherGroups.fields.namePlaceholder') ||
                    'e.g. Advanced Physics Grade 12'
                  }
                  className={INPUT_CLS}
                />
              </div>

              {/* Subject & Grade Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('teacherGroups.fields.subject') || 'Subject *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={groupForm.subject}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, subject: e.target.value })
                    }
                    placeholder="e.g. Mathematics"
                    className={INPUT_CLS}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('teacherGroups.fields.gradeLevel') || 'Grade / Class Level'}
                  </label>
                  <input
                    type="text"
                    value={groupForm.gradeLevel}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, gradeLevel: e.target.value })
                    }
                    placeholder="e.g. Grade 11"
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              {/* Academic Year & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('teacherGroups.fields.academicYear') || 'Academic Year'}
                  </label>
                  <input
                    type="text"
                    value={groupForm.academicYear}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, academicYear: e.target.value })
                    }
                    placeholder={
                      t('teacherGroups.fields.academicYearPlaceholder') ||
                      'e.g. 2026/2027'
                    }
                    className={INPUT_CLS}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('teacherGroups.fields.status') || 'Status'}
                  </label>
                  <select
                    value={groupForm.status}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, status: e.target.value })
                    }
                    className={INPUT_CLS}
                  >
                    <option value="ACTIVE">
                      {t('teacherGroups.fields.statusActive') || 'Active'}
                    </option>
                    <option value="ARCHIVED">
                      {t('teacherGroups.fields.statusArchived') || 'Archived'}
                    </option>
                  </select>
                </div>
              </div>

              {/* Schedule Days */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('teacherGroups.fields.scheduleDays') || 'Schedule Days'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = groupForm.scheduleDays.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => handleToggleDay(d.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {t(d.labelKey)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display Color */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('teacherGroups.fields.color') || 'Badge / Accent Color'}
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setGroupForm({ ...groupForm, color: c })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        groupForm.color === c ? 'scale-115 ring-2 ring-offset-2 ring-red-500' : 'opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('teacherGroups.fields.description') || 'Description / Notes'}
                </label>
                <textarea
                  rows={2}
                  value={groupForm.description}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, description: e.target.value })
                  }
                  placeholder={
                    t('teacherGroups.fields.descriptionPlaceholder') ||
                    'Brief description of the curriculum or class guidelines...'
                  }
                  className={INPUT_CLS}
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsGroupFormOpen(false)}
                  disabled={groupSubmitting}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('teacherGroups.actions.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={groupSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {groupSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t('teacherGroups.actions.saving') || 'Saving...'}</span>
                    </>
                  ) : (
                    <span>
                      {editingGroup
                        ? t('teacherGroups.actions.save') || 'Save Changes'
                        : t('teacherGroups.actions.create') || 'Create Group'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ENROLL STUDENT IN GROUP                         */}
      {/* ======================================================== */}
      {isEnrollModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="text-red-600" size={20} />
                <span>
                  {t('teacherGroups.enrollStudentTitle') || 'Enroll Student in Group'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            {enrollError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{enrollError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEnrollment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('teacherGroups.selectStudent') || 'Select Student *'}
                </label>
                {loadingAvailableStudents ? (
                  <div className="py-4 flex items-center justify-center text-xs text-gray-400">
                    <Loader2 size={16} className="animate-spin me-2" />
                    Loading your students...
                  </div>
                ) : (
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className={INPUT_CLS}
                  >
                    <option value="">
                      {t('teacherGroups.selectStudent') ||
                        '-- Select Student from Your List --'}
                    </option>
                    {availableStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.fullName} {st.isHomelyStudent ? `(${t('teacherStudents.homelyStudentBadge') || 'Homely Student'})` : ''} {st.gradeLevel ? `[${st.gradeLevel}]` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('teacherGroups.fields.enrollmentNotes') || 'Enrollment Remarks (Optional)'}
                </label>
                <input
                  type="text"
                  value={enrollmentNotes}
                  onChange={(e) => setEnrollmentNotes(e.target.value)}
                  placeholder="e.g. Joined mid-semester"
                  className={INPUT_CLS}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  disabled={enrolling}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('teacherGroups.actions.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={enrolling}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {enrolling ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t('teacherGroups.actions.saving') || 'Saving...'}</span>
                    </>
                  ) : (
                    <span>{t('teacherGroups.actions.enroll') || 'Enroll Student'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: REMOVE STUDENT FROM GROUP CONFIRMATION          */}
      {/* ======================================================== */}
      {removingStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
                <UserMinus size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('teacherGroups.actions.removeStudentConfirmTitle') ||
                  'Remove Student from Group'}
              </h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300">
              {(
                t('teacherGroups.actions.removeStudentConfirmMessage') ||
                'Are you sure you want to remove {{name}} from this group? This will not delete the student from your students list.'
              ).replace('{{name}}', removingStudent.fullName)}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setRemovingStudent(null)}
                disabled={removing}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {t('teacherGroups.actions.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveStudent}
                disabled={removing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                {removing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{t('teacherGroups.actions.removing') || 'Removing...'}</span>
                  </>
                ) : (
                  <span>{t('teacherGroups.actions.removeStudent') || 'Remove'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: ARCHIVE GROUP CONFIRMATION                      */}
      {/* ======================================================== */}
      {archivingGroup && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('teacherGroups.actions.archiveConfirmTitle') ||
                  'Archive Group'}
              </h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300">
              {(
                t('teacherGroups.actions.archiveConfirmMessage') ||
                'Are you sure you want to archive {{name}}? Student enrollment records will be preserved.'
              ).replace('{{name}}', archivingGroup.name)}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setArchivingGroup(null)}
                disabled={archiving}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {t('teacherGroups.actions.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmArchiveGroup}
                disabled={archiving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                {archiving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{t('teacherGroups.actions.saving') || 'Saving...'}</span>
                  </>
                ) : (
                  <span>{t('teacherGroups.actions.archive') || 'Archive Group'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherGroups;
