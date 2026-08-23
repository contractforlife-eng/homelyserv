// src/pages/EmployerJobs.jsx — My Job Posts
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import { Plus, Eye, Pencil, Pause, Play, XCircle, MapPin, Calendar, Clock, Loader2, Users, RotateCcw } from 'lucide-react';
import jobService from '../services/jobService';
import { formatJobCompensation } from '../utils/jobCompensationDisplay';

const EmployerJobs = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { t, i18n } = useTranslation();

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
        setError(t('employerJobs.error'));
      }
    } catch (loadError) {
      console.error('Load my jobs error:', loadError);
      setError(t('employerJobs.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
        alert(t('employerJobs.statusUpdated'));
        setJobs(prev => prev.map(j => j.id === job.id ? data.job : j));
      } else {
        alert(t('employerJobs.actionError'));
      }
    } catch (statusError) {
      console.error('Update job status error:', statusError);
      alert(statusError.response?.data?.message || t('employerJobs.actionError'));
    } finally {
      setActionJobId(null);
    }
  };

  const handleRepost = async (job) => {
    setActionJobId(job.id);
    try {
      const data = await jobService.repostJob(job.id);
      if (data?.success && data.job) {
        setJobs(prev => [data.job, ...prev]);
      } else {
        alert(t('employerJobs.actionError'));
      }
    } catch (repostError) {
      console.error('Repost job error:', repostError);
      alert(repostError.response?.data?.message || t('employerJobs.actionError'));
    } finally {
      setActionJobId(null);
    }
  };

  const formatSalary = (job) => formatJobCompensation(job, t, i18n.resolvedLanguage);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    const locales = { en: 'en-US', ar: 'ar-EG', fr: 'fr-FR', ru: 'ru-RU', tr: 'tr-TR', de: 'de-DE' };
    return d.toLocaleDateString(locales[i18n.resolvedLanguage] || locales.en, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const statusBadgeClass = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'closed':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      case 'expired':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('employerJobs.loading')}</p>
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
        title={t('employerJobs.title')}
        notificationUserId={authUser?.id || authUser?.email}
      />

      <div className="p-4 md:p-6">
        <RolePageHeader
          title={t('employerJobs.title')}
          subtitle={t('employerJobs.subtitle')}
          actions={
            <button
              onClick={() => navigate('/employer-post-job')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-teal-700 rounded-lg hover:bg-teal-50 transition whitespace-nowrap font-medium"
            >
              <Plus size={18} />
              {t('employerJobs.postNewJob')}
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
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('employerJobs.emptyTitle')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{t('employerJobs.emptyDesc')}</p>
              <button
                onClick={() => navigate('/employer-post-job')}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                {t('employerJobs.postNewJob')}
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
                          {t(`employerJobs.status.${job.status}`, { defaultValue: job.status })}
                        </span>
                        {job.isUrgent && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            {t('employerJobs.urgent')}
                          </span>
                        )}
                        {job.isFeatured && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {t('employerJobs.featured')}
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
                          <Calendar size={14} /> {t('employerJobs.type')}: {t(`employerJobs.employmentType.${job.employmentType}`, { defaultValue: job.employmentType })}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>{t('employerJobs.salary')}: <span className="text-gray-700 dark:text-gray-300 font-medium">{formatSalary(job)}</span></span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={14} /> {t('employerJobs.created')}: {formatDate(job.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={14} /> {t('employerJobs.deadline')}: {formatDate(job.deadline) || t('employerJobs.noDeadline')}
                        </span>
                        {job.expiresAt && (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={14} /> {job.status === 'expired' ? t('employerJobs.expiredOn') : t('employerJobs.expires')}: {formatDate(job.expiresAt)}
                          </span>
                        )}
                      </div>

                      {job.weeklyDaysOff && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={14} /> {t('employerJobs.schedule')}: {job.weeklyDaysOff}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => navigate(`/job/${job.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                      >
                        <Eye size={16} /> {t('employerJobs.view')}
                      </button>
                      <button
                        onClick={() => navigate(`/employer-jobs/${job.id}/applicants`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-teal-600 text-white hover:bg-teal-700 transition"
                      >
                        <Users size={16} /> {t('employerJobs.viewApplicants')}
                      </button>
                      <button
                        onClick={() => navigate('/employer-post-job', { state: { editJob: job } })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                      >
                        <Pencil size={16} /> {t('employerJobs.edit')}
                      </button>
                      {job.status === 'open' && (
                        <button
                          onClick={() => handleStatusChange(job, 'paused')}
                          disabled={actionJobId === job.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-yellow-600 text-white hover:bg-yellow-700 transition disabled:opacity-50"
                        >
                          <Pause size={16} /> {t('employerJobs.pause')}
                        </button>
                      )}
                      {(job.status === 'paused' || job.status === 'closed') && (
                        <button
                          onClick={() => handleStatusChange(job, 'open')}
                          disabled={actionJobId === job.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                        >
                          <Play size={16} /> {t('employerJobs.reopen')}
                        </button>
                      )}
                      {job.status === 'expired' && (
                        <button
                          onClick={() => handleRepost(job)}
                          disabled={actionJobId === job.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-teal-600 text-white hover:bg-teal-700 transition disabled:opacity-50"
                        >
                          <RotateCcw size={16} /> {t('employerJobs.repost')}
                        </button>
                      )}
                      {(job.status === 'open' || job.status === 'paused') && (
                        <button
                          onClick={() => handleStatusChange(job, 'closed')}
                          disabled={actionJobId === job.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-600 text-white hover:bg-gray-700 transition disabled:opacity-50"
                        >
                          <XCircle size={16} /> {t('employerJobs.close')}
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
