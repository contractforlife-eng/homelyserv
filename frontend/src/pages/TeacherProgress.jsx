// frontend/src/pages/TeacherProgress.jsx
// ============================================================
// TEACHER STUDENT PROGRESS PAGE
// ============================================================
// Core Teacher feature (available to all teachers).
// Strictly scoped to authenticated teacher (req.userId).
//
// FEATURES:
// 1. Student Selector: Choose from authenticated teacher's active students.
// 2. Summary Metric Cards: Attendance %, Homework %, Average Score %, Total Assessments.
// 3. Tabbed Views:
//    - Assessments & Grades (History table, Record assessment, Edit, Delete).
//    - Attendance & Homework (Breakdown with clear group-homework limitations).
//    - Performance Trend (Chronological score progression timeline).
// 4. Modal for creating / editing assessments.
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import api from '../utils/api';
import { downloadCsv } from '../utils/csvExport';
import {
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Filter,
  Users,
  ChevronRight,
  BarChart3,
  FileText,
  UserCheck,
  UserX,
  Check,
  Download,
  Info
} from 'lucide-react';

const INPUT_CLS =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all';

const SELECT_CLS =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all';

const ASSESSMENT_TYPES = [
  'EXAM',
  'QUIZ',
  'ASSIGNMENT',
  'PROJECT',
  'ORAL',
  'OTHER'
];

export default function TeacherProgress() {
  const { t } = useTranslation();

  // Selected student state
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Groups and lessons for modal dropdowns
  const [teacherGroups, setTeacherGroups] = useState([]);

  // Progress summary data for selected student
  const [progressData, setProgressData] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  // Overview metrics (teacher-level)
  const [overviewData, setOverviewData] = useState(null);

  // Assessments list state
  const [assessments, setAssessments] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('');

  // Active Tab: 'assessments' | 'attendanceHomework' | 'trend'
  const [activeTab, setActiveTab] = useState('assessments');

  // Flash messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    studentId: '',
    groupId: '',
    title: '',
    subject: '',
    assessmentType: 'QUIZ',
    score: '',
    maxScore: '100',
    grade: '',
    date: new Date().toISOString().split('T')[0],
    feedback: '',
    notes: ''
  });

  // Delete modal state
  const [deletingAssessment, setDeletingAssessment] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // 1. Fetch Students & Groups list for teacher
  const fetchInitialData = useCallback(async () => {
    try {
      setStudentsLoading(true);
      const [studentsRes, groupsRes, overviewRes] = await Promise.all([
        api.get('/api/teachers/students', { params: { status: 'ACTIVE' } }),
        api.get('/api/teachers/groups'),
        api.get('/api/teachers/progress/overview').catch(() => ({ data: { success: false } }))
      ]);

      if (studentsRes.data?.success && Array.isArray(studentsRes.data.students)) {
        const stdList = studentsRes.data.students;
        setStudents(stdList);
        if (stdList.length > 0 && !selectedStudentId) {
          setSelectedStudentId(stdList[0]._id || stdList[0].id);
        }
      }

      if (groupsRes.data?.success && Array.isArray(groupsRes.data.groups)) {
        setTeacherGroups(groupsRes.data.groups);
      }

      if (overviewRes.data?.success && overviewRes.data.overview) {
        setOverviewData(overviewRes.data.overview);
      }
    } catch (err) {
      console.error('Failed to load initial progress data:', err);
      setErrorMessage(
        t('teacherProgress.messages.loadError') || 'Failed to load student progress data.'
      );
    } finally {
      setStudentsLoading(false);
    }
  }, [selectedStudentId, t]);

  useEffect(() => {
    fetchInitialData();
  }, []); // Run once on mount

  // 2. Fetch Progress & Assessments for selected student
  const fetchStudentProgress = useCallback(async (studentId) => {
    if (!studentId) return;
    try {
      setProgressLoading(true);
      setAssessmentsLoading(true);

      const [progressRes, assessmentsRes] = await Promise.all([
        api.get(`/api/teachers/progress/students/${studentId}`),
        api.get('/api/teachers/progress/assessments', { params: { studentId } })
      ]);

      if (progressRes.data?.success) {
        setProgressData(progressRes.data);
      } else {
        setProgressData(null);
      }

      if (assessmentsRes.data?.success && Array.isArray(assessmentsRes.data.assessments)) {
        setAssessments(assessmentsRes.data.assessments);
      } else {
        setAssessments([]);
      }
    } catch (err) {
      console.error('Failed to load student progress:', err);
      setErrorMessage(
        t('teacherProgress.messages.loadError') || 'Failed to load student progress data.'
      );
    } finally {
      setProgressLoading(false);
      setAssessmentsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentProgress(selectedStudentId);
    }
  }, [selectedStudentId, fetchStudentProgress]);

  // Filtered assessments list
  const filteredAssessments = useMemo(() => {
    return assessments.filter((item) => {
      if (typeFilter !== 'ALL' && item.assessmentType !== typeFilter) {
        return false;
      }
      if (subjectFilter.trim()) {
        const query = subjectFilter.trim().toLowerCase();
        if (!item.subject?.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [assessments, typeFilter, subjectFilter]);

  // CSV Export handler
  const handleExportProgressCsv = () => {
    const studentName = selectedStudent?.fullName || 'student';
    const sanitizedStudentName = studentName.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');

    if (activeTab === 'attendanceHomework') {
      const headers = [
        t('teacherProgress.csv.student') || 'Student',
        t('teacherProgress.csv.metric') || 'Metric',
        t('teacherProgress.csv.value') || 'Value',
        t('teacherProgress.csv.details') || 'Details'
      ];
      const rows = [
        [
          studentName,
          'Attendance Rate',
          `${progressData?.attendance?.attendancePercentage || 0}%`,
          `Present: ${progressData?.attendance?.present || 0}, Absent: ${progressData?.attendance?.absent || 0}, Excused: ${progressData?.attendance?.excused || 0}`
        ],
        [
          studentName,
          'Homework Completion Rate',
          `${progressData?.homework?.homeworkPercentage || 0}%`,
          `Completed: ${progressData?.homework?.completed || 0}, Total: ${progressData?.homework?.totalWithHomework || 0}`
        ],
        [
          studentName,
          'Total Evaluated Lessons',
          progressData?.attendance?.totalEvaluated || 0,
          ''
        ]
      ];
      downloadCsv(`student-progress-attendance-${sanitizedStudentName}`, headers, rows);
    } else {
      // Default & assessments tab
      const headers = [
        t('teacherProgress.csv.date') || 'Date',
        t('teacherProgress.csv.title') || 'Assessment Title',
        t('teacherProgress.csv.subject') || 'Subject',
        t('teacherProgress.csv.type') || 'Type',
        t('teacherProgress.csv.score') || 'Score',
        t('teacherProgress.csv.maxScore') || 'Max Score',
        t('teacherProgress.csv.percentage') || 'Percentage (%)',
        t('teacherProgress.csv.grade') || 'Grade',
        t('teacherProgress.csv.feedback') || 'Teacher Feedback',
        t('teacherProgress.csv.notes') || 'Internal Notes'
      ];
      const rows = filteredAssessments.map((a) => [
        a.date ? new Date(a.date).toISOString().split('T')[0] : '',
        a.title || '',
        a.subject || '',
        a.assessmentType || '',
        a.score,
        a.maxScore || 100,
        a.percentage !== undefined && a.percentage !== null ? `${a.percentage}%` : '',
        a.grade || '',
        a.feedback || '',
        a.notes || ''
      ]);
      downloadCsv(`student-assessments-${sanitizedStudentName}`, headers, rows);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAssessment(null);
    setFormData({
      studentId: selectedStudentId || (students[0]?._id || students[0]?.id || ''),
      groupId: '',
      title: '',
      subject: '',
      assessmentType: 'QUIZ',
      score: '',
      maxScore: '100',
      grade: '',
      date: new Date().toISOString().split('T')[0],
      feedback: '',
      notes: ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (assessment) => {
    setEditingAssessment(assessment);
    setFormData({
      studentId: assessment.studentId || selectedStudentId,
      groupId: assessment.groupId || '',
      title: assessment.title || '',
      subject: assessment.subject || '',
      assessmentType: assessment.assessmentType || 'QUIZ',
      score: String(assessment.score),
      maxScore: String(assessment.maxScore || 100),
      grade: assessment.grade || '',
      date: assessment.date ? assessment.date.split('T')[0] : new Date().toISOString().split('T')[0],
      feedback: assessment.feedback || '',
      notes: assessment.notes || ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveAssessment = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.studentId || !formData.title.trim() || !formData.subject.trim()) {
      setModalError(
        t('teacherProgress.messages.requiredFields') || 'Please fill in all required fields.'
      );
      return;
    }

    const numScore = parseFloat(formData.score);
    const numMaxScore = parseFloat(formData.maxScore);

    if (isNaN(numScore) || numScore < 0) {
      setModalError('Score must be a positive number or zero.');
      return;
    }

    if (isNaN(numMaxScore) || numMaxScore <= 0) {
      setModalError('Max score must be greater than zero.');
      return;
    }

    if (numScore > numMaxScore) {
      setModalError(
        t('teacherProgress.messages.invalidScore') ||
          'Score cannot be greater than the maximum score.'
      );
      return;
    }

    try {
      setModalSubmitting(true);
      const payload = {
        studentId: formData.studentId,
        groupId: formData.groupId || null,
        title: formData.title.trim(),
        subject: formData.subject.trim(),
        assessmentType: formData.assessmentType,
        score: numScore,
        maxScore: numMaxScore,
        grade: formData.grade.trim(),
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        feedback: formData.feedback.trim(),
        notes: formData.notes.trim()
      };

      if (editingAssessment) {
        await api.put(`/api/teachers/progress/assessments/${editingAssessment.id}`, payload);
        setSuccessMessage(
          t('teacherProgress.messages.saveSuccess') || 'Assessment saved successfully.'
        );
      } else {
        await api.post('/api/teachers/progress/assessments', payload);
        setSuccessMessage(
          t('teacherProgress.messages.saveSuccess') || 'Assessment saved successfully.'
        );
      }

      setIsModalOpen(false);
      // Refresh selected student progress
      await fetchStudentProgress(selectedStudentId);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to save assessment:', err);
      setModalError(
        err.response?.data?.message ||
          t('teacherProgress.messages.saveError') ||
          'Failed to save assessment.'
      );
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete Assessment
  const handleDeleteConfirm = async () => {
    if (!deletingAssessment) return;
    try {
      setDeleteSubmitting(true);
      await api.delete(`/api/teachers/progress/assessments/${deletingAssessment.id}`);
      setSuccessMessage(
        t('teacherProgress.messages.deleteSuccess') || 'Assessment removed successfully.'
      );
      setDeletingAssessment(null);
      await fetchStudentProgress(selectedStudentId);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to delete assessment:', err);
      setErrorMessage(
        err.response?.data?.message ||
          t('teacherProgress.messages.deleteError') ||
          'Failed to remove assessment.'
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const selectedStudent = useMemo(() => {
    return students.find((s) => (s._id || s.id) === selectedStudentId);
  }, [students, selectedStudentId]);

  return (
    <DashboardLayout requiredRole="TEACHER">
      <DashboardHeader
        title={t('teacherProgress.headerTitle') || 'Student Progress'}
        subtitle={
          t('teacherProgress.subtitle') ||
          'Track student attendance, homework completion, assessment grades, and academic performance over time.'
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

        {/* Student Selector Card */}
        <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                {t('teacherProgress.selectStudent') || 'Select Student'}
              </label>
              {students.length > 0 ? (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="mt-1 font-semibold text-gray-900 dark:text-white bg-transparent border-0 focus:ring-0 p-0 text-base cursor-pointer focus:outline-none"
                >
                  {students.map((s) => (
                    <option
                      key={s._id || s.id}
                      value={s._id || s.id}
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {s.fullName} {s.gradeLevel ? `(${s.gradeLevel})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {studentsLoading
                    ? 'Loading students...'
                    : t('teacherProgress.noStudents') || 'No active students found.'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportProgressCsv}
              disabled={!selectedStudent || assessmentsLoading || progressLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('teacherProgress.csv.exportBtn') || 'Export CSV'}
            >
              <Download size={16} className="text-red-600 dark:text-red-400" />
              <span>{t('teacherProgress.csv.exportBtn') || 'Export CSV'}</span>
            </button>
            <button
              onClick={handleOpenCreate}
              disabled={students.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              <span>{t('teacherProgress.assessments.recordBtn') || 'Record Assessment'}</span>
            </button>
          </div>
        </div>

        {/* Selected Student Metrics Cards */}
        {selectedStudent && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Attendance Rate */}
            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('teacherProgress.cards.attendanceRate') || 'Attendance Rate'}
                </span>
                <span className="p-2 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400">
                  <UserCheck size={18} />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progressData?.attendance ? `${progressData.attendance.attendancePercentage}%` : '0%'}
                </span>
                <span className="text-xs text-gray-500">
                  ({progressData?.attendance?.present || 0} / {progressData?.attendance?.totalEvaluated || 0})
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, progressData?.attendance?.attendancePercentage || 0)}%` }}
                />
              </div>
            </div>

            {/* Card 2: Homework Completion Rate */}
            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('teacherProgress.cards.homeworkCompletion') || 'Homework Completion'}
                </span>
                <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <BookOpen size={18} />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progressData?.homework?.individual ? `${progressData.homework.individual.completionPercentage}%` : '0%'}
                </span>
                <span className="text-xs text-gray-500">
                  ({progressData?.homework?.individual?.completed || 0} / {progressData?.homework?.individual?.assigned || 0})
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, progressData?.homework?.individual?.completionPercentage || 0)}%` }}
                />
              </div>
            </div>

            {/* Card 3: Average Assessment Grade */}
            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('teacherProgress.cards.averageScore') || 'Average Grade'}
                </span>
                <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Award size={18} />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progressData?.assessments ? `${progressData.assessments.averagePercentage}%` : '0%'}
                </span>
                {progressData?.assessments?.total > 0 && (
                  <span className="text-xs text-gray-500">
                    (Max: {progressData.assessments.highestPercentage}%)
                  </span>
                )}
              </div>
              {/* Progress bar */}
              <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, progressData?.assessments?.averagePercentage || 0)}%` }}
                />
              </div>
            </div>

            {/* Card 4: Total Assessments */}
            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('teacherProgress.cards.totalAssessments') || 'Total Assessments'}
                </span>
                <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                  <TrendingUp size={18} />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progressData?.assessments?.total || 0}
                </span>
                <span className="text-xs text-gray-500">recorded</span>
              </div>
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar size={12} />
                <span>Across all subjects</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-6 rtl:space-x-reverse">
          <button
            onClick={() => setActiveTab('assessments')}
            className={`pb-3 font-medium text-sm transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'assessments'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Award size={16} />
            <span>{t('teacherProgress.tabs.assessments') || 'Assessments & Grades'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {assessments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('attendanceHomework')}
            className={`pb-3 font-medium text-sm transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'attendanceHomework'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <CheckCircle size={16} />
            <span>{t('teacherProgress.tabs.attendanceHomework') || 'Attendance & Homework'}</span>
          </button>

          <button
            onClick={() => setActiveTab('trend')}
            className={`pb-3 font-medium text-sm transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'trend'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <BarChart3 size={16} />
            <span>{t('teacherProgress.tabs.trend') || 'Performance Trend'}</span>
          </button>
        </div>

        {/* TAB 1: Assessments & Grades */}
        {activeTab === 'assessments' && (
          <div className="space-y-4">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none"
                >
                  <option value="ALL">{t('teacherProgress.assessments.filterType') || 'All Types'}</option>
                  {ASSESSMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`teacherProgress.assessments.types.${type}`) || type}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder={t('teacherProgress.assessments.filterSubject') || 'Filter by Subject'}
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 focus:outline-none w-44"
                />
              </div>

              <span className="text-xs text-gray-500 self-end sm:self-center">
                Showing {filteredAssessments.length} assessment{filteredAssessments.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Assessments Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              {assessmentsLoading ? (
                <div className="p-12 flex justify-center items-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                </div>
              ) : filteredAssessments.length === 0 ? (
                <div className="p-8 text-center">
                  <EmptyState
                    icon={Award}
                    title={t('teacherProgress.assessments.empty') || 'No assessments recorded yet.'}
                    description={
                      t('teacherProgress.assessments.emptyDesc') ||
                      'Record tests, quizzes, assignments, or oral exams to evaluate student mastery.'
                    }
                  />
                  <button
                    onClick={handleOpenCreate}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
                  >
                    <Plus size={14} />
                    <span>{t('teacherProgress.assessments.recordBtn') || 'Record Assessment'}</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left rtl:text-right text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5">{t('teacherProgress.assessments.tableDate') || 'Date'}</th>
                        <th className="px-4 py-3.5">{t('teacherProgress.assessments.tableTitle') || 'Title'}</th>
                        <th className="px-4 py-3.5">{t('teacherProgress.assessments.tableType') || 'Type'}</th>
                        <th className="px-4 py-3.5">{t('teacherProgress.assessments.tableSubject') || 'Subject'}</th>
                        <th className="px-4 py-3.5">{t('teacherProgress.assessments.tableScore') || 'Score / Max'}</th>
                        <th className="px-4 py-3.5">{t('teacherProgress.assessments.tablePercentage') || 'Percentage'}</th>
                        <th className="px-4 py-3.5">{t('teacherProgress.assessments.tableGrade') || 'Grade'}</th>
                        <th className="px-4 py-3.5">{t('teacherProgress.assessments.tableFeedback') || 'Feedback'}</th>
                        <th className="px-4 py-3.5 text-right rtl:text-left">{t('teacherProgress.assessments.tableActions') || 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-gray-700 dark:text-gray-300">
                      {filteredAssessments.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                            {a.date ? a.date.split('T')[0] : '—'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                            {a.title}
                            {a.groupName && (
                              <span className="block text-[10px] text-gray-400 font-normal">
                                Class: {a.groupName}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md font-medium text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {t(`teacherProgress.assessments.types.${a.assessmentType}`) || a.assessmentType}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">
                            {a.subject}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono font-medium">
                            {a.score} / {a.maxScore}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                a.percentage >= 85
                                  ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300'
                                  : a.percentage >= 65
                                  ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                                  : a.percentage >= 50
                                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                                  : 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                              }`}
                            >
                              {a.percentage}%
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-600 dark:text-gray-400">
                            {a.grade || '—'}
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate text-gray-500" title={a.feedback}>
                            {a.feedback || '—'}
                          </td>
                          <td className="px-4 py-3 text-right rtl:text-left whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEdit(a)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                title="Edit"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => setDeletingAssessment(a)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Attendance & Homework Breakdown */}
        {activeTab === 'attendanceHomework' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance Breakdown Card */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                  <UserCheck className="text-green-600" size={18} />
                  <span>{t('teacherProgress.attendanceHomework.attendanceTitle') || 'Attendance Breakdown'}</span>
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300">
                  {progressData?.attendance?.attendancePercentage || 0}% overall
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    {t('teacherProgress.attendanceHomework.totalEvaluated') || 'Total Sessions'}
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white mt-1 block">
                    {progressData?.attendance?.totalEvaluated || 0}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-green-50/60 dark:bg-green-950/30 border border-green-100 dark:border-green-900/40">
                  <span className="text-[11px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider block">
                    {t('teacherProgress.attendanceHomework.present') || 'Present'}
                  </span>
                  <span className="text-lg font-bold text-green-800 dark:text-green-300 mt-1 block">
                    {progressData?.attendance?.present || 0}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
                  <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider block">
                    {t('teacherProgress.attendanceHomework.absent') || 'Absent'}
                  </span>
                  <span className="text-lg font-bold text-red-800 dark:text-red-300 mt-1 block">
                    {progressData?.attendance?.absent || 0}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                    {t('teacherProgress.attendanceHomework.excused') || 'Excused'}
                  </span>
                  <span className="text-lg font-bold text-amber-800 dark:text-amber-300 mt-1 block">
                    {progressData?.attendance?.excused || 0}
                  </span>
                </div>
              </div>

              {progressData?.attendance?.notRecorded > 0 && (
                <div className="text-xs text-gray-400 flex items-center gap-1.5 pt-1">
                  <Clock size={13} />
                  <span>
                    {progressData.attendance.notRecorded} session(s) pending attendance recording.
                  </span>
                </div>
              )}
            </div>

            {/* Homework Breakdown Card */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                  <BookOpen className="text-blue-600" size={18} />
                  <span>{t('teacherProgress.attendanceHomework.homeworkTitle') || 'Homework Completion'}</span>
                </h3>
              </div>

              {/* 1-on-1 Reliable Individual Tracking */}
              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                  {t('teacherProgress.attendanceHomework.individualSubtitle') || '1-on-1 Lessons (Individual Tracking)'}
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase block">
                      {t('teacherProgress.attendanceHomework.assigned') || 'Assigned'}
                    </span>
                    <span className="text-base font-bold text-gray-900 dark:text-white mt-0.5 block">
                      {progressData?.homework?.individual?.assigned || 0}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                    <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase block">
                      {t('teacherProgress.attendanceHomework.completed') || 'Completed'}
                    </span>
                    <span className="text-base font-bold text-blue-800 dark:text-blue-300 mt-0.5 block">
                      {progressData?.homework?.individual?.completed || 0}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase block">
                      {t('teacherProgress.attendanceHomework.pending') || 'Pending'}
                    </span>
                    <span className="text-base font-bold text-amber-800 dark:text-amber-300 mt-0.5 block">
                      {progressData?.homework?.individual?.pending || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Group-level Homework Notice (Clearly labeled limitation) */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <Info size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block">
                    {t('teacherProgress.attendanceHomework.groupSubtitle') || 'Group / Class Lessons'}
                  </span>
                  <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                    {t('teacherProgress.attendanceHomework.groupNote') ||
                      'Group lesson homework is recorded at the class unit level and cannot reflect individual student completion.'}
                  </p>
                  {progressData?.homework?.groupLevel?.assigned > 0 && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 block pt-0.5">
                      Class units with homework: {progressData.homework.groupLevel.assigned} ({progressData.homework.groupLevel.completed} marked done)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Performance Trend */}
        {activeTab === 'trend' && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                <TrendingUp className="text-red-600" size={18} />
                <span>{t('teacherProgress.trend.title') || 'Academic Trajectory & Score History'}</span>
              </h3>
              <span className="text-xs text-gray-400">
                {progressData?.assessments?.trend?.length || 0} chronological milestones
              </span>
            </div>

            {(!progressData?.assessments?.trend || progressData.assessments.trend.length === 0) ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-sm">
                  {t('teacherProgress.trend.empty') || 'Not enough assessment data to generate a progress trend.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual score bars list */}
                {progressData.assessments.trend.map((point, idx) => (
                  <div key={point.id || idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {point.title}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">
                          {point.subject}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {point.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-500">
                          {point.score} / {point.maxScore}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {point.percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Linear score progression indicator */}
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          point.percentage >= 85
                            ? 'bg-green-500'
                            : point.percentage >= 65
                            ? 'bg-blue-500'
                            : point.percentage >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, point.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Add / Edit Assessment */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Award className="text-red-600" size={18} />
                  <span>
                    {editingAssessment
                      ? t('teacherProgress.form.editTitle') || 'Edit Assessment'
                      : t('teacherProgress.form.addTitle') || 'Record Assessment'}
                  </span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAssessment} className="p-5 space-y-4">
                {modalError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Student Select */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    {t('teacherProgress.form.student') || 'Student'} *
                  </label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className={SELECT_CLS}
                    required
                  >
                    <option value="" disabled>Select Student</option>
                    {students.map((s) => (
                      <option key={s._id || s.id} value={s._id || s.id}>
                        {s.fullName} {s.gradeLevel ? `(${s.gradeLevel})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    {t('teacherProgress.form.title') || 'Title'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('teacherProgress.form.titlePlaceholder') || 'e.g. Midterm Exam, Chapter 3 Quiz'}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={INPUT_CLS}
                  />
                </div>

                {/* Subject & Type Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      {t('teacherProgress.form.subject') || 'Subject'} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t('teacherProgress.form.subjectPlaceholder') || 'e.g. Mathematics, English'}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      {t('teacherProgress.form.type') || 'Assessment Type'} *
                    </label>
                    <select
                      value={formData.assessmentType}
                      onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
                      className={SELECT_CLS}
                    >
                      {ASSESSMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {t(`teacherProgress.assessments.types.${type}`) || type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Score & Max Score Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      {t('teacherProgress.form.score') || 'Score'} *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      placeholder="e.g. 85"
                      value={formData.score}
                      onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      {t('teacherProgress.form.maxScore') || 'Max Score'} *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      required
                      placeholder="e.g. 100"
                      value={formData.maxScore}
                      onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      {t('teacherProgress.form.grade') || 'Grade'}
                    </label>
                    <input
                      type="text"
                      placeholder={t('teacherProgress.form.gradePlaceholder') || 'e.g. A+, 90%'}
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>

                {/* Date & Optional Group */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      {t('teacherProgress.form.date') || 'Evaluation Date'} *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      {t('teacherProgress.form.group') || 'Associated Class (Optional)'}
                    </label>
                    <select
                      value={formData.groupId}
                      onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                      className={SELECT_CLS}
                    >
                      <option value="">None / 1-on-1</option>
                      {teacherGroups.map((g) => (
                        <option key={g._id || g.id} value={g._id || g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    {t('teacherProgress.form.feedback') || 'Teacher Feedback (Optional)'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={t('teacherProgress.form.feedbackPlaceholder') || 'Personalized guidance, areas for improvement...'}
                    value={formData.feedback}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    className={INPUT_CLS}
                  />
                </div>

                {/* Private Notes */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    {t('teacherProgress.form.notes') || 'Private Notes (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={t('teacherProgress.form.notesPlaceholder') || 'Private teacher notes'}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className={INPUT_CLS}
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-medium transition-colors"
                  >
                    {t('teacherProgress.form.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {modalSubmitting && <Loader2 size={13} className="animate-spin" />}
                    <span>
                      {modalSubmitting
                        ? t('teacherProgress.form.saving') || 'Saving...'
                        : t('teacherProgress.form.save') || 'Save Assessment'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Delete Confirmation */}
        {deletingAssessment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-2xl max-w-sm w-full p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    {t('teacherProgress.deleteModal.title') || 'Delete Assessment'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {deletingAssessment.title}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('teacherProgress.deleteModal.message') ||
                  'Are you sure you want to remove this assessment record? This action cannot be undone.'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setDeletingAssessment(null)}
                  className="px-3.5 py-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleteSubmitting}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {deleteSubmitting && <Loader2 size={13} className="animate-spin" />}
                  <span>
                    {deleteSubmitting
                      ? t('teacherProgress.deleteModal.deleting') || 'Deleting...'
                      : t('teacherProgress.deleteModal.deleteBtn') || 'Delete Record'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
