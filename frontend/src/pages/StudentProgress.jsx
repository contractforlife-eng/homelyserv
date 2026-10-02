// frontend/src/pages/StudentProgress.jsx
// ============================================================
// STUDENT PROGRESS PAGE (READ-ONLY)
// Displays academic progress, assessment scores, attendance history,
// homework status, and performance trends for the authenticated student.
// Single source of truth: TeacherAssessment & TeacherLesson collections.
// ============================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import {
  TrendingUp,
  Award,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  BookOpen,
  User,
  Users,
  Clock,
  Filter,
  Eye,
  X,
  Loader2,
  Sparkles,
  BarChart3,
  Calendar,
  FileCheck,
  FileText
} from 'lucide-react';

const StudentProgress = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('overview'); // overview | assessments | attendance | homework
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [overviewError, setOverviewError] = useState('');

  // Assessment listing state
  const [assessments, setAssessments] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [assessmentsError, setAssessmentsError] = useState('');

  // Filters for assessments
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedTeacher, setSelectedTeacher] = useState('ALL');

  // Selected assessment for read-only modal
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  // Fetch overview
  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    setOverviewError('');
    try {
      const res = await api.get('/api/students/progress/overview');
      if (res.data?.success) {
        setOverviewData(res.data.data);
      } else {
        setOverviewError(t('studentProgress.loadError', 'Failed to load progress data.'));
      }
    } catch (err) {
      console.error('Error fetching student progress overview:', err);
      setOverviewError(t('studentProgress.loadError', 'Failed to load progress data.'));
    } finally {
      setLoadingOverview(false);
    }
  }, [t]);

  // Fetch assessments list
  const fetchAssessments = useCallback(async () => {
    setLoadingAssessments(true);
    setAssessmentsError('');
    try {
      const params = {};
      if (selectedSubject !== 'ALL') params.subject = selectedSubject;
      if (selectedType !== 'ALL') params.assessmentType = selectedType;
      if (selectedTeacher !== 'ALL') params.teacherId = selectedTeacher;

      const res = await api.get('/api/students/progress/assessments', { params });
      if (res.data?.success) {
        setAssessments(res.data.data?.assessments || []);
      } else {
        setAssessmentsError(t('studentProgress.loadError', 'Failed to load progress data.'));
      }
    } catch (err) {
      console.error('Error fetching student assessments:', err);
      setAssessmentsError(t('studentProgress.loadError', 'Failed to load progress data.'));
    } finally {
      setLoadingAssessments(false);
    }
  }, [selectedSubject, selectedType, selectedTeacher, t]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeTab === 'assessments' || activeTab === 'overview') {
      fetchAssessments();
    }
  }, [activeTab, fetchAssessments]);

  // Unique subjects and teachers for filters
  const filterOptions = useMemo(() => {
    const subjects = new Set();
    const teachersMap = new Map();

    assessments.forEach((item) => {
      if (item.subject) subjects.add(item.subject);
      if (item.teacher?.id && item.teacher?.name) {
        teachersMap.set(item.teacher.id, item.teacher.name);
      }
    });

    return {
      subjects: Array.from(subjects),
      teachers: Array.from(teachersMap.entries()).map(([id, name]) => ({ id, name }))
    };
  }, [assessments]);

  // Format dates nicely
  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const getAssessmentTypeLabel = (type) => {
    switch (type) {
      case 'EXAM':
        return t('studentProgress.typeExam', 'Exam');
      case 'QUIZ':
        return t('studentProgress.typeQuiz', 'Quiz');
      case 'ASSIGNMENT':
        return t('studentProgress.typeAssignment', 'Assignment');
      case 'PROJECT':
        return t('studentProgress.typeProject', 'Project');
      case 'ORAL':
        return t('studentProgress.typeOral', 'Oral');
      default:
        return t('studentProgress.typeOther', 'Other');
    }
  };

  const getAttendanceBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('studentProgress.attendancePresent', 'Present')}
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800">
            <XCircle className="w-3.5 h-3.5" />
            {t('studentProgress.attendanceAbsent', 'Absent')}
          </span>
        );
      case 'EXCUSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-3.5 h-3.5" />
            {t('studentProgress.attendanceExcused', 'Excused')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <HelpCircle className="w-3.5 h-3.5" />
            {t('studentProgress.attendanceNotRecorded', 'Not Recorded')}
          </span>
        );
    }
  };

  const stats = overviewData?.stats || {
    attendanceRate: null,
    homeworkCompletionRate: null,
    averageGradePercentage: null,
    totalAssessments: 0
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('studentProgress.headerTitle', 'Progress')}
        subtitle={t('studentProgress.subTitle', 'Track your academic achievements, assessment scores, attendance, and homework progress.')}
      />

      <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
        {/* Read-Only Disclosure Banner */}
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-xl p-4 text-xs sm:text-sm text-sky-800 dark:text-sky-300 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{t('studentProgress.readOnlyNotice', 'This is a read-only academic record managed by your teachers.')}</p>
            <p className="text-sky-700 dark:text-sky-400 text-xs">
              {t('studentProgress.groupHomeworkNotice', 'Note: Group homework is tracked at class/lesson level rather than individually by student.')}
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Attendance Rate */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('studentProgress.attendanceRate', 'Attendance Rate')}
              </span>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.attendanceRate !== null ? `${stats.attendanceRate}%` : '—'}
              </span>
              {stats.attendanceRate !== null && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({overviewData?.attendanceBreakdown?.present || 0} / {(overviewData?.attendanceBreakdown?.present || 0) + (overviewData?.attendanceBreakdown?.absent || 0) + (overviewData?.attendanceBreakdown?.excused || 0)})
                </span>
              )}
            </div>
          </div>

          {/* Homework Completion */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('studentProgress.homeworkRate', 'Homework Completion')}
              </span>
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.homeworkCompletionRate !== null ? `${stats.homeworkCompletionRate}%` : '—'}
              </span>
              {stats.homeworkCompletionRate !== null && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({overviewData?.homeworkBreakdown?.completed || 0} / {overviewData?.homeworkBreakdown?.totalAssigned || 0})
                </span>
              )}
            </div>
          </div>

          {/* Average Grade / Percentage */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('studentProgress.averageGrade', 'Average Score')}
              </span>
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.averageGradePercentage !== null ? `${stats.averageGradePercentage}%` : '—'}
              </span>
            </div>
          </div>

          {/* Total Assessments */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('studentProgress.totalAssessments', 'Total Assessments')}
              </span>
              <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalAssessments}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto">
          {[
            { id: 'overview', label: t('studentProgress.tabOverview', 'Overview'), icon: BarChart3 },
            { id: 'assessments', label: t('studentProgress.tabAssessments', 'Assessments'), icon: Award },
            { id: 'attendance', label: t('studentProgress.tabAttendance', 'Attendance'), icon: CalendarCheck },
            { id: 'homework', label: t('studentProgress.tabHomework', 'Homework'), icon: FileCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {loadingOverview ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
                <p>{t('studentProgress.loading', 'Loading your academic progress...')}</p>
              </div>
            ) : overviewError ? (
              <div className="p-6 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-center">
                <p>{overviewError}</p>
                <button
                  onClick={fetchOverview}
                  className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700"
                >
                  {t('studentProgress.retry', 'Retry')}
                </button>
              </div>
            ) : (
              <>
                {/* Visual Performance Trend Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                      {t('studentProgress.performanceTrendTitle', 'Performance Over Time')}
                    </h3>
                  </div>

                  {(!overviewData?.performanceTrend || overviewData.performanceTrend.length === 0) ? (
                    <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                      <BarChart3 className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                      {t('studentProgress.noTrendData', 'Not enough assessment records to render trend chart yet.')}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Bar-based visual progress progression */}
                      <div className="h-44 sm:h-52 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
                        {overviewData.performanceTrend.map((item, idx) => {
                          const pct = Math.min(Math.max(item.percentage || 0, 0), 100);
                          let barColor = 'bg-teal-500 hover:bg-teal-600';
                          if (pct < 50) barColor = 'bg-rose-500 hover:bg-rose-600';
                          else if (pct < 75) barColor = 'bg-amber-500 hover:bg-amber-600';

                          return (
                            <div
                              key={idx}
                              className="flex flex-col items-center flex-1 min-w-[48px] h-full justify-end group relative"
                            >
                              {/* Tooltip on hover */}
                              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                                <div className="bg-slate-900 text-white text-[11px] rounded py-1 px-2 whitespace-nowrap shadow-lg">
                                  <p className="font-bold">{item.title}</p>
                                  <p>{pct}% ({item.score}/{item.maxScore})</p>
                                  <p className="text-[10px] text-slate-300">{item.subject} • {formatDate(item.date)}</p>
                                </div>
                                <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                              </div>

                              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                {pct}%
                              </span>
                              <div
                                style={{ height: `${pct}%` }}
                                className={`w-full max-w-[36px] rounded-t-md transition-all duration-300 ${barColor}`}
                              />
                              <span className="text-[10px] text-slate-400 truncate max-w-[50px] mt-1.5 block">
                                {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : '-'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
                        {overviewData.performanceTrend.length} assessments plotted chronologically
                      </p>
                    </div>
                  )}
                </div>

                {/* 2-Column Overview: Recent Assessments & Recent Lessons */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Assessments */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center justify-between mb-4">
                      <span className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-indigo-500" />
                        {t('studentProgress.recentAssessmentsTitle', 'Recent Assessments')}
                      </span>
                      <button
                        onClick={() => setActiveTab('assessments')}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        {t('studentProgress.tabAssessments', 'Assessments')} →
                      </button>
                    </h3>

                    {(!overviewData?.recentAssessments || overviewData.recentAssessments.length === 0) ? (
                      <p className="text-sm text-slate-500 py-6 text-center">
                        {t('studentProgress.noRecentAssessments', 'No recent assessments recorded.')}
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {overviewData.recentAssessments.map((item) => (
                          <div
                            key={item.id}
                            className="py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-lg px-2 -mx-2 transition cursor-pointer"
                            onClick={() => setSelectedAssessment(item)}
                          >
                            <div className="min-w-0 pr-3">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>{item.subject}</span>
                                <span>•</span>
                                <span>{getAssessmentTypeLabel(item.assessmentType)}</span>
                                <span>•</span>
                                <span>{formatDate(item.date)}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                                {item.percentage}%
                              </span>
                              <p className="text-xs text-slate-400">
                                {item.score}/{item.maxScore}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Lesson Activity */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center justify-between mb-4">
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-amber-500" />
                        {t('studentProgress.recentLessonsTitle', 'Recent Lesson Activity')}
                      </span>
                      <button
                        onClick={() => setActiveTab('attendance')}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        {t('studentProgress.tabAttendance', 'Attendance')} →
                      </button>
                    </h3>

                    {(!overviewData?.recentLessons || overviewData.recentLessons.length === 0) ? (
                      <p className="text-sm text-slate-500 py-6 text-center">
                        {t('studentProgress.noRecentLessons', 'No recent lessons found.')}
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {overviewData.recentLessons.map((item) => (
                          <div key={item.id} className="py-3 flex items-center justify-between">
                            <div className="min-w-0 pr-3">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {item.subject}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>{formatDate(item.date)}</span>
                                <span>•</span>
                                <span>{item.lessonType === 'GROUP' ? t('studentLessons.group', 'Group') : t('studentLessons.oneOnOne', '1-on-1')}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {getAttendanceBadge(item.attendanceStatus)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: ASSESSMENTS */}
        {activeTab === 'assessments' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium mr-2">
                <Filter className="w-4 h-4" />
                <span>{t('studentProgress.filterAll', 'Filter')}:</span>
              </div>

              {/* Subject Filter */}
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="ALL">{t('studentProgress.filterSubject', 'Subject')}: {t('studentProgress.filterAll', 'All')}</option>
                {filterOptions.subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Assessment Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="ALL">{t('studentProgress.filterType', 'Type')}: {t('studentProgress.filterAll', 'All')}</option>
                <option value="EXAM">{t('studentProgress.typeExam', 'Exam')}</option>
                <option value="QUIZ">{t('studentProgress.typeQuiz', 'Quiz')}</option>
                <option value="ASSIGNMENT">{t('studentProgress.typeAssignment', 'Assignment')}</option>
                <option value="PROJECT">{t('studentProgress.typeProject', 'Project')}</option>
                <option value="ORAL">{t('studentProgress.typeOral', 'Oral')}</option>
                <option value="OTHER">{t('studentProgress.typeOther', 'Other')}</option>
              </select>

              {/* Teacher Filter */}
              {filterOptions.teachers.length > 1 && (
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                >
                  <option value="ALL">{t('studentProgress.filterTeacher', 'Teacher')}: {t('studentProgress.filterAll', 'All')}</option>
                  {filterOptions.teachers.map((teach) => (
                    <option key={teach.id} value={teach.id}>{teach.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Assessment Cards / Table */}
            {loadingAssessments ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
                <p>{t('studentProgress.loading', 'Loading assessments...')}</p>
              </div>
            ) : assessmentsError ? (
              <div className="p-6 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-center">
                <p>{assessmentsError}</p>
                <button
                  onClick={fetchAssessments}
                  className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700"
                >
                  {t('studentProgress.retry', 'Retry')}
                </button>
              </div>
            ) : assessments.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500 dark:text-slate-400">
                <Award className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {t('studentProgress.noRecentAssessments', 'No assessments found.')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assessments.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-teal-500/40 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {getAssessmentTypeLabel(item.assessmentType)}
                        </span>
                        <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                          {item.percentage}%
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1 mb-1">
                        {item.title}
                      </h4>

                      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 mb-4">
                        <p><span className="font-medium text-slate-500">{t('studentProgress.assessmentSubject', 'Subject')}:</span> {item.subject}</p>
                        <p><span className="font-medium text-slate-500">{t('studentProgress.assessmentScore', 'Score')}:</span> {item.score} / {item.maxScore}</p>
                        {item.grade && (
                          <p><span className="font-medium text-slate-500">{t('studentProgress.assessmentGrade', 'Grade')}:</span> <span className="font-bold text-slate-900 dark:text-white">{item.grade}</span></p>
                        )}
                        <p><span className="font-medium text-slate-500">{t('studentProgress.assessmentDate', 'Date')}:</span> {formatDate(item.date)}</p>
                        {item.teacher?.name && (
                          <p><span className="font-medium text-slate-500">{t('studentProgress.teacherLabel', 'Teacher')}:</span> {item.teacher.name}</p>
                        )}
                      </div>

                      {item.feedback && (
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 italic">
                          "{item.feedback}"
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedAssessment(item)}
                      className="w-full mt-2 py-2 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t('studentProgress.viewDetailsBtn', 'View Details')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-emerald-600" />
                  {t('studentProgress.attendanceHistoryTitle', 'Attendance History')}
                </h3>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    {t('studentProgress.attendancePresent', 'Present')}: {overviewData?.attendanceBreakdown?.present || 0}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    {t('studentProgress.attendanceAbsent', 'Absent')}: {overviewData?.attendanceBreakdown?.absent || 0}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    {t('studentProgress.attendanceExcused', 'Excused')}: {overviewData?.attendanceBreakdown?.excused || 0}
                  </span>
                </div>
              </div>

              {(!overviewData?.recentLessons || overviewData.recentLessons.length === 0) ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                  <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                  {t('studentProgress.noRecentLessons', 'No attendance records found.')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                        <th className="py-3 px-3">{t('studentProgress.assessmentDate', 'Date')}</th>
                        <th className="py-3 px-3">{t('studentProgress.assessmentSubject', 'Subject')}</th>
                        <th className="py-3 px-3">{t('studentLessons.typeLabel', 'Type')}</th>
                        <th className="py-3 px-3">{t('studentLessons.teacherLabel', 'Teacher')}</th>
                        <th className="py-3 px-3 text-right">{t('studentLessons.attendanceTitle', 'Status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {overviewData.recentLessons.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                            {formatDate(item.date)}
                          </td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{item.subject}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {item.lessonType === 'GROUP' ? (
                              <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                <Users className="w-3.5 h-3.5" />
                                {t('studentLessons.group', 'Group')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400">
                                <User className="w-3.5 h-3.5" />
                                {t('studentLessons.oneOnOne', '1-on-1')}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{item.teacher?.name || '-'}</td>
                          <td className="py-3 px-3 text-right">
                            {getAttendanceBadge(item.attendanceStatus)}
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

        {/* Tab 4: HOMEWORK */}
        {activeTab === 'homework' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-600" />
                  {t('studentProgress.homeworkHistoryTitle', 'Homework & Assignments')}
                </h3>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    {t('studentProgress.homeworkCompleted', 'Completed')}: {overviewData?.homeworkBreakdown?.completed || 0}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    {t('studentProgress.homeworkIncomplete', 'Pending')}: {overviewData?.homeworkBreakdown?.pending || 0}
                  </span>
                </div>
              </div>

              {(!overviewData?.recentLessons || overviewData.recentLessons.filter(l => l.homework?.hasHomework).length === 0) ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                  <p>{t('studentLessons.noHomework', 'No homework assignments found.')}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {overviewData.recentLessons
                    .filter((l) => l.homework?.hasHomework)
                    .map((item) => (
                      <div key={item.id} className="py-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">
                            {item.subject} • {formatDate(item.date)}
                          </span>
                          {item.homework.isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {t('studentProgress.homeworkCompleted', 'Completed')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <Clock className="w-3.5 h-3.5" />
                              {t('studentProgress.homeworkIncomplete', 'Pending')}
                            </span>
                          )}
                        </div>

                        {item.homework.title && (
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {item.homework.title}
                          </p>
                        )}

                        {item.homework.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.homework.description}
                          </p>
                        )}

                        {item.homework.dueDate && (
                          <p className="text-[11px] text-slate-400">
                            {t('studentProgress.homeworkDueDate', 'Due Date')}: {formatDate(item.homework.dueDate)}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Read-Only Assessment Details Modal */}
        {selectedAssessment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {t('studentProgress.detailsModalTitle', 'Assessment Details')}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAssessment(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">
                    {t('studentProgress.assessmentTitle', 'Title')}
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedAssessment.title}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold">{t('studentProgress.assessmentSubject', 'Subject')}</span>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedAssessment.subject}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold">{t('studentProgress.assessmentType', 'Type')}</span>
                    <p className="font-medium text-slate-900 dark:text-white">{getAssessmentTypeLabel(selectedAssessment.assessmentType)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold">{t('studentProgress.assessmentScore', 'Score')}</span>
                    <p className="font-medium text-teal-600 dark:text-teal-400 font-bold">
                      {selectedAssessment.score} / {selectedAssessment.maxScore} ({selectedAssessment.percentage}%)
                    </p>
                  </div>
                  {selectedAssessment.grade && (
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">{t('studentProgress.assessmentGrade', 'Grade')}</span>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedAssessment.grade}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-slate-400 font-semibold">{t('studentProgress.assessmentDate', 'Date')}</span>
                    <p className="font-medium text-slate-900 dark:text-white">{formatDate(selectedAssessment.date)}</p>
                  </div>
                  {selectedAssessment.teacher?.name && (
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">{t('studentProgress.teacherLabel', 'Teacher')}</span>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedAssessment.teacher.name}</p>
                    </div>
                  )}
                </div>

                {/* Teacher Feedback */}
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">
                    {t('studentProgress.assessmentFeedback', 'Teacher Feedback')}
                  </span>
                  {selectedAssessment.feedback ? (
                    <div className="mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {selectedAssessment.feedback}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-1">
                      {t('studentProgress.noFeedback', 'No written feedback provided.')}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedAssessment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
                >
                  {t('studentProgress.closeBtn', 'Close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentProgress;
