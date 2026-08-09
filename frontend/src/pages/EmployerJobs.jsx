// src/pages/EmployerJobs.jsx — My Job Posts
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useDashboard } from '../components/layout/DashboardContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import { Plus, Eye, Pencil, Pause, Play, XCircle, MapPin, Calendar, Clock, Loader2 } from 'lucide-react';
import jobService from '../services/jobService';

const translations = {
  en: {
    title: 'My Job Posts',
    subtitle: 'Manage the jobs you have posted',
    postNewJob: 'Post a New Job',
    emptyTitle: 'No job posts yet',
    emptyDesc: 'Post your first job to start receiving applications.',
    view: 'View',
    edit: 'Edit',
    pause: 'Pause',
    reopen: 'Reopen',
    close: 'Close',
    salary: 'Salary',
    location: 'Location',
    type: 'Type',
    created: 'Posted',
    deadline: 'Deadline',
    schedule: 'Schedule',
    noDeadline: 'No deadline',
    open: 'Open',
    paused: 'Paused',
    closed: 'Closed',
    fullTime: 'Full Time',
    partTime: 'Part Time',
    contract: 'Contract',
    freelance: 'Freelance',
    urgent: 'Urgent',
    featured: 'Featured',
    error: 'Failed to load your jobs.',
    actionError: 'Action failed. Please try again.',
    statusUpdated: 'Job status updated',
  },
  ar: {
    title: 'وظائفي المنشورة',
    subtitle: 'إدارة الوظائف التي نشرتها',
    postNewJob: 'نشر وظيفة جديدة',
    emptyTitle: 'لا توجد وظائف منشورة بعد',
    emptyDesc: 'انشر وظيفتك الأولى لبدء استقبال الطلبات.',
    view: 'عرض',
    edit: 'تعديل',
    pause: 'إيقاف مؤقت',
    reopen: 'إعادة فتح',
    close: 'إغلاق',
    salary: 'الراتب',
    location: 'الموقع',
    type: 'النوع',
    created: 'تاريخ النشر',
    deadline: 'الموعد النهائي',
    schedule: 'الجدول',
    noDeadline: 'بدون موعد نهائي',
    open: 'مفتوحة',
    paused: 'متوقفة مؤقتاً',
    closed: 'مغلقة',
    fullTime: 'دوام كامل',
    partTime: 'دوام جزئي',
    contract: 'عقد',
    freelance: 'حر',
    urgent: 'عاجل',
    featured: 'مميزة',
    error: 'فشل تحميل وظائفك.',
    actionError: 'فشلت العملية. حاول مرة أخرى.',
    statusUpdated: 'تم تحديث حالة الوظيفة',
  },
};

const STATUS_LABELS = {
  open: { en: 'Open', ar: 'مفتوحة' },
  paused: { en: 'Paused', ar: 'متوقفة مؤقتاً' },
  closed: { en: 'Closed', ar: 'مغلقة' },
};

const TYPE_LABELS = {
  'full-time': { en: 'Full Time', ar: 'دوام كامل' },
  'part-time': { en: 'Part Time', ar: 'دوام جزئي' },
  contract: { en: 'Contract', ar: 'عقد' },
  freelance: { en: 'Freelance', ar: 'حر' },
};

const EmployerJobs = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const dashboard = useDashboard();
  const isArabic = dashboard.language === 'ar';
  const t = translations[dashboard.language] || translations.en;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionJobId, setActionJobId] = useState(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await jobService.getMyJobs();
      if (data?.success) {
        setJobs(data.jobs || []);
      } else {
        setError(t.error);
      }
    } catch (loadError) {
      console.error('Load my jobs error:', loadError);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }
    if (authUser.role !== 'EMPLOYER') {
      navigate('/login');
      return;
    }
    loadJobs();
  }, [authLoading, isAuthenticated, authUser, navigate, loadJobs]);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  const handleStatusChange = async (job, status) => {
    setActionJobId(job.id);
    try {
      const data = await jobService.updateJobStatus(job.id, status);
      if (data?.success) {
        alert(t.statusUpdated);
        setJobs(prev => prev.map(j => j.id === job.id ? data.job : j));
      } else {
        alert(t.actionError);
      }
    } catch (statusError) {
      console.error('Update job status error:', statusError);
      alert(statusError.response?.data?.message || t.actionError);
    } finally {
      setActionJobId(null);
    }
  };

  const formatSalary = (job) => {
    const min = job.salaryMin !== null && job.salaryMin !== undefined ? job.salaryMin : null;
    const max = job.salaryMax !== null && job.salaryMax !== undefined ? job.salaryMax : null;
    if (min === null && max === null) return '—';
    if (min !== null && max !== null && min === max) return `${Math.round(min).toLocaleString()} EGP`;
    if (min !== null && max !== null) return `${Math.round(min).toLocaleString()} - ${Math.round(max).toLocaleString()} EGP`;
    if (min !== null) return `${Math.round(min).toLocaleString()}+ EGP`;
    return `${Math.round(max).toLocaleString()} EGP`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const statusBadgeClass = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'closed':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <DashboardLayout requiredRole="EMPLOYER">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
      />

      <div className="p-4 md:p-6">
        <RolePageHeader
          title={t.title}
          subtitle={t.subtitle}
          actions={
            <button
              onClick={() => navigate('/employer-post-job')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-teal-700 rounded-lg hover:bg-teal-50 transition whitespace-nowrap font-medium"
            >
              <Plus size={18} />
              {t.postNewJob}
            </button>
          }
        />

        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-teal-600 mx-auto" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <div className="text-5xl mb-4">💼</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t.emptyTitle}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{t.emptyDesc}</p>
              <button
                onClick={() => navigate('/employer-post-job')}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                {t.postNewJob}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white break-words">{job.jobTitle}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(job.status)}`}>
                          {STATUS_LABELS[job.status]?.[dashboard.language] || job.status}
                        </span>
                        {job.isUrgent && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            {t.urgent}
                          </span>
                        )}
                        {job.isFeatured && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {t.featured}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                        {job.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} /> {job.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={14} /> {t.type}: {TYPE_LABELS[job.employmentType]?.[dashboard.language] || job.employmentType}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>{t.salary}: <span className="text-gray-700 dark:text-gray-300 font-medium">{formatSalary(job)}</span></span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={14} /> {t.created}: {formatDate(job.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={14} /> {t.deadline}: {formatDate(job.deadline) || t.noDeadline}
                        </span>
                      </div>

                      {job.weeklyDaysOff && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={14} /> {t.schedule}: {job.weeklyDaysOff}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => navigate(`/job/${job.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                      >
                        <Eye size={16} /> {t.view}
                      </button>
                      <button
                        onClick={() => navigate('/employer-post-job', { state: { editJob: job } })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                      >
                        <Pencil size={16} /> {t.edit}
                      </button>
                      {job.status === 'open' && (
                        <button
                          onClick={() => handleStatusChange(job, 'paused')}
                          disabled={actionJobId === job.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-yellow-600 text-white hover:bg-yellow-700 transition disabled:opacity-50"
                        >
                          <Pause size={16} /> {t.pause}
                        </button>
                      )}
                      {(job.status === 'paused' || job.status === 'closed') && (
                        <button
                          onClick={() => handleStatusChange(job, 'open')}
                          disabled={actionJobId === job.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                        >
                          <Play size={16} /> {t.reopen}
                        </button>
                      )}
                      {job.status !== 'closed' && (
                        <button
                          onClick={() => handleStatusChange(job, 'closed')}
                          disabled={actionJobId === job.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-600 text-white hover:bg-gray-700 transition disabled:opacity-50"
                        >
                          <XCircle size={16} /> {t.close}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployerJobs;
