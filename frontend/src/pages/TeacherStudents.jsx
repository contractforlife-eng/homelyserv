// frontend/src/pages/TeacherStudents.jsx
// ============================================================
// TEACHER STUDENTS PAGE
//
// CRITICAL ARCHITECTURE REQUIREMENTS:
// 1. ONE unified list: There are strictly NO separate tabs
//    (no "Homely Students" / "External Students" tabs).
// 2. Homely Student badge: Displayed next to a student's name
//    if and ONLY if they are linked to a real HomelyServ account
//    (student.isHomelyStudent === true).
// 3. Tenancy isolation: Teacher A can never see, modify, or delete
//    Teacher B's students (guaranteed server-side by req.userId).
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import HomelyStudentBadge from '../components/teacher/HomelyStudentBadge';
import api from '../utils/api';
import {
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
  Phone,
  Mail,
  GraduationCap,
  BookOpen,
  Calendar,
  MapPin,
  School,
  FileText,
  Filter
} from 'lucide-react';

const INPUT_CLS =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all';

const initialFormData = {
  firstName: '',
  lastName: '',
  fullName: '',
  gender: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  school: '',
  gradeLevel: '',
  educationLevel: '',
  subjects: [],
  subjectsInput: '',
  address: '',
  notes: '',
  status: 'ACTIVE'
};

const TeacherStudents = () => {
  const { t } = useTranslation();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Details modal
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Delete confirmation modal
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/api/teachers/students', { params });
      if (res.data?.success) {
        setStudents(Array.isArray(res.data.students) ? res.data.students : []);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setErrorMessage(
        err.response?.data?.message ||
          t('teacherStudents.messages.loadError') ||
          'Failed to load students.'
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, t]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Summary counts
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.status === 'ACTIVE').length;
    const inactive = students.filter(s => s.status !== 'ACTIVE').length;
    const homely = students.filter(s => s.isHomelyStudent).length;
    return { total, active, inactive, homely };
  }, [students]);

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingStudent(null);
    setFormData(initialFormData);
    setFormError('');
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    const dobFormatted = student.dateOfBirth
      ? new Date(student.dateOfBirth).toISOString().split('T')[0]
      : '';

    setFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      fullName: student.fullName || '',
      gender: student.gender || '',
      dateOfBirth: dobFormatted,
      phone: student.phone || '',
      email: student.email || '',
      school: student.school || '',
      gradeLevel: student.gradeLevel || '',
      educationLevel: student.educationLevel || '',
      subjects: Array.isArray(student.subjects) ? student.subjects : [],
      subjectsInput: '',
      address: student.address || '',
      notes: student.notes || '',
      status: student.status || 'ACTIVE'
    });
    setFormError('');
    setIsFormOpen(true);
  };

  // Subject chip management
  const handleAddSubject = () => {
    const val = formData.subjectsInput.trim();
    if (!val) return;
    if (!formData.subjects.includes(val)) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, val],
        subjectsInput: ''
      }));
    } else {
      setFormData(prev => ({ ...prev, subjectsInput: '' }));
    }
  };

  const handleRemoveSubject = (idx) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== idx)
    }));
  };

  // Save student (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    const resolvedFullName =
      formData.fullName.trim() ||
      `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

    if (!resolvedFullName) {
      setFormError(
        t('teacherStudents.messages.nameRequired') ||
          'Full name or first/last name is required.'
      );
      return;
    }

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      fullName: resolvedFullName,
      gender: formData.gender || null,
      dateOfBirth: formData.dateOfBirth || null,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      school: formData.school.trim(),
      gradeLevel: formData.gradeLevel.trim(),
      educationLevel: formData.educationLevel.trim(),
      subjects: formData.subjects,
      address: formData.address.trim(),
      notes: formData.notes.trim(),
      status: formData.status
    };

    try {
      setFormSubmitting(true);
      if (editingStudent) {
        await api.put(`/api/teachers/students/${editingStudent.id}`, payload);
        setSuccessMessage(
          t('teacherStudents.messages.updateSuccess') ||
            'Student details updated successfully.'
        );
      } else {
        await api.post('/api/teachers/students', payload);
        setSuccessMessage(
          t('teacherStudents.messages.createSuccess') ||
            'Student added successfully.'
        );
      }
      setIsFormOpen(false);
      setEditingStudent(null);
      await fetchStudents();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to save student:', err);
      setFormError(
        err.response?.data?.message ||
          t('teacherStudents.messages.saveError') ||
          'Failed to save student.'
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete student
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    try {
      setDeleting(true);
      await api.delete(`/api/teachers/students/${deletingStudent.id}`);
      setSuccessMessage(
        t('teacherStudents.messages.deleteSuccess') ||
          'Student removed successfully.'
      );
      setDeletingStudent(null);
      if (selectedStudent?.id === deletingStudent.id) {
        setSelectedStudent(null);
      }
      await fetchStudents();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to delete student:', err);
      setErrorMessage(
        err.response?.data?.message ||
          t('teacherStudents.messages.deleteError') ||
          'Failed to remove student.'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout requiredRole="TEACHER">
      <DashboardHeader
        title={t('teacherStudents.headerTitle') || 'Students'}
        subtitle={
          t('teacherStudents.subtitle') ||
          'Manage all your students in one unified place.'
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

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('teacherStudents.totalCount') || 'Total Students'}
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
                  {t('teacherStudents.activeCount') || 'Active Students'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats.active}
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
                  {t('teacherStudents.homelyCount') || 'Homely Students'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats.homely}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0">
                <Filter size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('teacherStudents.inactiveCount') || 'Inactive Students'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats.inactive}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Search & Actions Toolbar (CRITICAL: NO Homely vs External tabs!) */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
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
                  t('teacherStudents.searchPlaceholder') ||
                  'Search by name, phone, email, school, or grade...'
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            >
              <option value="ALL">
                {t('teacherStudents.allStatuses') || 'All Statuses'}
              </option>
              <option value="ACTIVE">
                {t('teacherStudents.fields.statusActive') || 'Active'}
              </option>
              <option value="INACTIVE">
                {t('teacherStudents.fields.statusInactive') || 'Inactive'}
              </option>
              <option value="SUSPENDED">
                {t('teacherStudents.fields.statusSuspended') || 'Suspended'}
              </option>
            </select>
          </div>

          {/* Add Student Action Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium shadow-sm transition-colors shrink-0"
          >
            <Plus size={18} />
            <span>
              {t('teacherStudents.addStudentBtn') || 'Add Student'}
            </span>
          </button>
        </div>

        {/* Unified Students List / Table */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t('teacherStudents.messages.loadError')
                ? 'Loading students...'
                : 'Loading students...'}
            </p>
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title={
              searchQuery || statusFilter !== 'ALL'
                ? t('teacherStudents.noSearchResults') || 'No matching students found'
                : t('teacherStudents.noStudents') || 'No students found'
            }
            description={
              searchQuery || statusFilter !== 'ALL'
                ? t('teacherStudents.noSearchResultsDesc') ||
                  'Try adjusting your search terms or filters.'
                : t('teacherStudents.noStudentsDesc') ||
                  'You have not added any students yet. Click "Add Student" to get started.'
            }
            action={
              !searchQuery && statusFilter === 'ALL' ? (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                >
                  <Plus size={16} />
                  <span>
                    {t('teacherStudents.addStudentBtn') || 'Add Student'}
                  </span>
                </button>
              ) : null
            }
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/75 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-start">
                      {t('teacherStudents.fields.fullName') || 'Student Name'}
                    </th>
                    <th className="py-3.5 px-4 text-start">
                      {t('teacherStudents.fields.gradeLevel') || 'Grade / School'}
                    </th>
                    <th className="py-3.5 px-4 text-start">
                      {t('teacherStudents.fields.subjects') || 'Subjects'}
                    </th>
                    <th className="py-3.5 px-4 text-start">
                      {t('teacherStudents.fields.phone') || 'Contact'}
                    </th>
                    <th className="py-3.5 px-4 text-start">
                      {t('teacherStudents.fields.status') || 'Status'}
                    </th>
                    <th className="py-3.5 px-4 text-end">
                      {t('teacherProfile.editProfileBtn') ? 'Actions' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      {/* Name + Homely Student Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {student.fullName}
                          </span>
                          {/* CRITICAL: Homely Student Badge ONLY if isHomelyStudent */}
                          {student.isHomelyStudent && (
                            <HomelyStudentBadge size="sm" />
                          )}
                        </div>
                        {student.email && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs mt-0.5">
                            {student.email}
                          </div>
                        )}
                      </td>

                      {/* Grade / School */}
                      <td className="py-3.5 px-4">
                        <div className="text-gray-900 dark:text-gray-200">
                          {student.gradeLevel || student.educationLevel || '—'}
                        </div>
                        {student.school && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs flex items-center gap-1 mt-0.5">
                            <School size={12} className="shrink-0" />
                            <span>{student.school}</span>
                          </div>
                        )}
                      </td>

                      {/* Subjects */}
                      <td className="py-3.5 px-4">
                        {Array.isArray(student.subjects) &&
                        student.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {student.subjects.slice(0, 3).map((sub, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300"
                              >
                                {sub}
                              </span>
                            ))}
                            {student.subjects.length > 3 && (
                              <span className="text-xs text-gray-400 self-center">
                                +{student.subjects.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        {student.phone ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                            <Phone size={13} className="text-gray-400 shrink-0" />
                            <span dir="ltr">{student.phone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            student.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300'
                              : student.status === 'SUSPENDED'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {student.status === 'ACTIVE'
                            ? t('teacherStudents.fields.statusActive') || 'Active'
                            : student.status === 'SUSPENDED'
                            ? t('teacherStudents.fields.statusSuspended') ||
                              'Suspended'
                            : t('teacherStudents.fields.statusInactive') ||
                              'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-end">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedStudent(student)}
                            title={
                              t('teacherStudents.actions.viewDetails') ||
                              'View Details'
                            }
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(student)}
                            title={t('teacherStudents.actions.edit') || 'Edit'}
                            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingStudent(student)}
                            title={
                              t('teacherStudents.actions.delete') || 'Remove'
                            }
                            className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* ADD / EDIT STUDENT MODAL                                 */}
      {/* ======================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="text-red-600" size={20} />
                <span>
                  {editingStudent
                    ? t('teacherStudents.editStudentTitle') ||
                      'Edit Student'
                    : t('teacherStudents.addStudentTitle') ||
                      'Add New Student'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('teacherStudents.fields.firstName') || 'First Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('teacherStudents.fields.lastName') || 'Last Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('teacherStudents.fields.fullName') || 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder={
                    formData.firstName || formData.lastName
                      ? `${formData.firstName} ${formData.lastName}`.trim()
                      : ''
                  }
                  className={INPUT_CLS}
                />
              </div>

              {/* Gender & DOB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('teacherStudents.fields.gender') || 'Gender'}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className={INPUT_CLS}
                  >
                    <option value="">
                      {t('teacherStudents.fields.genderSelect') ||
                        '-- Select Gender --'}
                    </option>
                    <option value="MALE">
                      {t('teacherStudents.fields.male') || 'Male'}
                    </option>
                    <option value="FEMALE">
                      {t('teacherStudents.fields.female') || 'Female'}
                    </option>
                    <option value="OTHER">
                      {t('teacherStudents.fields.other') || 'Other'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('teacherStudents.fields.dateOfBirth') ||
                      'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('teacherStudents.fields.phone') || 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    dir="ltr"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('teacherStudents.fields.email') || 'Email'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    dir="ltr"
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              {/* School, Grade, and Education Level */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('teacherStudents.fields.school') ||
                      'School / Institution'}
                  </label>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) =>
                      setFormData({ ...formData, school: e.target.value })
                    }
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('teacherStudents.fields.gradeLevel') || 'Grade / Class'}
                  </label>
                  <input
                    type="text"
                    value={formData.gradeLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, gradeLevel: e.target.value })
                    }
                    placeholder="e.g. Grade 10"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('teacherStudents.fields.status') || 'Status'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className={INPUT_CLS}
                  >
                    <option value="ACTIVE">
                      {t('teacherStudents.fields.statusActive') || 'Active'}
                    </option>
                    <option value="INACTIVE">
                      {t('teacherStudents.fields.statusInactive') || 'Inactive'}
                    </option>
                    <option value="SUSPENDED">
                      {t('teacherStudents.fields.statusSuspended') ||
                        'Suspended'}
                    </option>
                  </select>
                </div>
              </div>

              {/* Subjects Chips */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('teacherStudents.fields.subjects') || 'Enrolled Subjects'}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.subjectsInput}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subjectsInput: e.target.value
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubject();
                      }
                    }}
                    placeholder={
                      t('teacherStudents.fields.subjectsPlaceholder') ||
                      'e.g. Mathematics, Physics'
                    }
                    className={INPUT_CLS}
                  />
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium transition-colors shrink-0"
                  >
                    {t('teacherStudents.fields.addSubject') || 'Add'}
                  </button>
                </div>
                {formData.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.subjects.map((sub, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/50"
                      >
                        <span>{sub}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(idx)}
                          className="hover:text-red-900 dark:hover:text-red-100"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('teacherStudents.fields.address') || 'Address / Location'}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className={INPUT_CLS}
                />
              </div>

              {/* Private Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('teacherStudents.fields.notes') || 'Private Notes'}
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder={
                    t('teacherStudents.fields.notesPlaceholder') ||
                    'Private teacher notes about this student...'
                  }
                  className={INPUT_CLS}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('teacherStudents.actions.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>
                        {t('teacherStudents.actions.saving') || 'Saving...'}
                      </span>
                    </>
                  ) : (
                    <span>
                      {editingStudent
                        ? t('teacherStudents.actions.save') || 'Save Changes'
                        : t('teacherStudents.actions.create') || 'Add Student'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STUDENT DETAILS MODAL                                    */}
      {/* ======================================================== */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedStudent.fullName}
                  </h3>
                  {selectedStudent.isHomelyStudent && (
                    <HomelyStudentBadge size="sm" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedStudent.isHomelyStudent
                    ? t('teacherStudents.fields.homelyAccountLinked') ||
                      'Linked to HomelyServ Account'
                    : t('teacherStudents.fields.externalAccountDesc') ||
                      'External student record (managed directly by you).'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    {t('teacherStudents.fields.gradeLevel') || 'Grade / Level'}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedStudent.gradeLevel || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    {t('teacherStudents.fields.school') || 'School'}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedStudent.school || '—'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    {t('teacherStudents.fields.phone') || 'Phone'}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white" dir="ltr">
                    {selectedStudent.phone || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    {t('teacherStudents.fields.email') || 'Email'}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white truncate block" dir="ltr">
                    {selectedStudent.email || '—'}
                  </span>
                </div>
              </div>

              {selectedStudent.address && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    {t('teacherStudents.fields.address') || 'Address'}
                  </span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {selectedStudent.address}
                  </span>
                </div>
              )}

              {Array.isArray(selectedStudent.subjects) &&
                selectedStudent.subjects.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
                      {t('teacherStudents.fields.subjects') || 'Enrolled Subjects'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStudent.subjects.map((sub, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/50 font-medium"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {selectedStudent.notes && (
                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 block mb-1 flex items-center gap-1">
                    <FileText size={13} />
                    <span>
                      {t('teacherStudents.fields.notes') || 'Private Notes'}
                    </span>
                  </span>
                  <p className="text-xs text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
                    {selectedStudent.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  const s = selectedStudent;
                  setSelectedStudent(null);
                  handleOpenEdit(s);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 text-sm font-medium transition-colors"
              >
                <Edit size={15} />
                <span>{t('teacherStudents.actions.edit') || 'Edit'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {t('teacherStudents.actions.cancel') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL                                */}
      {/* ======================================================== */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('teacherStudents.actions.deleteConfirmTitle') ||
                  'Remove Student'}
              </h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300">
              {(
                t('teacherStudents.actions.deleteConfirmMessage') ||
                'Are you sure you want to remove {{name}} from your students list?'
              ).replace('{{name}}', deletingStudent.fullName)}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {t('teacherStudents.actions.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>
                      {t('teacherStudents.actions.deleting') ||
                        'Removing...'}
                    </span>
                  </>
                ) : (
                  <span>
                    {t('teacherStudents.actions.delete') || 'Remove'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherStudents;
