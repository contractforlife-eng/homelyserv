// src/pages/WorkerApplications.jsx — My Applications (Phase 2)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import {
  Briefcase, MapPin, Calendar, Loader2, Eye, XCircle, Building,
  FileText, CheckCircle
} from 'lucide-react';
import jobService from '../services/jobService';

const TYPE_LABELS = {
  'full-time': 'workerApplications.types.fullTime',
  'part-time': 'workerApplications.types.partTime',
  contract: 'workerApplications.types.contract',
  freelance: 'workerApplications.types.freelance',
};

const STATUS_LABELS = {
  applied: 'workerApplications.status.applied',
  shortlisted: 'workerApplications.status.shortlisted',
  rejected: 'workerApplications.status.rejected',
  withdrawn: 'workerApplications.status.withdrawn',
  offer_sent: 'workerApplications.status.offerSent',
};

const STATUS_STYLES = {
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  shortlisted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  withdrawn: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  offer_sent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const WorkerApplications = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isArabic = i18n.resolvedLanguage === 'ar';

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [confirmWithdrawId, setConfirmWithdrawId] = useState(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await jobService.getMyApplications();
      if (data?.success) {
        setApplications(data.applications || []);
      } else {
        setError(t('workerApplications.error'));
      }
    } catch (loadError) {
      console.error('Load my applications error:', loadError);
      setError(t('workerApplications.error'));
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
    if (authUser.role !== 'WORKER') {
      navigate('/login');
      return;
    }
    loadApplications();
  }, [authLoading, isAuthenticated, authUser, navigate, loadApplications]);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  const handleWithdraw = async (applicationId) => {
    setWithdrawingId(applicationId);
    try {
      const data = await jobService.withdrawApplication(applicationId);
      if (data?.success) {
        setApplications(prev => prev.map(app =>
          app.id === applicationId ? data.application : app
        ));
        setConfirmWithdrawId(null);
      } else {
        alert(data?.message || t('workerApplications.withdrawError'));
      }
    } catch (withdrawError) {
      console.error('Withdraw error:', withdrawError);
      alert(withdrawError.response?.data?.message || t('workerApplications.withdrawError'));
    } finally {
      setWithdrawingId(null);
    }
  };

  const formatSalary = (jobPost) => {
    if (!jobPost) return '—';
    const min = jobPost.salaryMin !== null && jobPost.salaryMin !== undefined ? jobPost.salaryMin : null;
    const max = jobPost.salaryMax !== null && jobPost.salaryMax !== undefined ? jobPost.salaryMax : null;
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

  const canWithdraw = (status) => status === 'applied' || status === 'shortlisted';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('workerApplications.loading')}</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <DashboardLayout requiredRole="WORKER">
      <DashboardHeader
        title={t('workerApplications.title')}
        notificationUserId={authUser?.id || authUser?.email}
      />

      <div className="p-4 md:p-6">
        <RolePageHeader title={t('workerApplications.title')} subtitle={t('workerApplications.subtitle')} />

        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-red-600 mx-auto" />
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('workerApplications.emptyTitle')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{t('workerApplications.emptyDesc')}</p>
              <button
                onClick={() => navigate('/worker-jobs')}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                {t('workerApplications.browseJobs')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const jobPost = app.jobPost;
                const status = app.status;
                const statusLabel = STATUS_LABELS[status] ? t(STATUS_LABELS[status]) : status;
                const statusStyle = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
                const employerName = app.employer?.companyName || app.employer?.fullName || null;

                return (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="text-lg font-semibold text-gray-800 dark:text-white break-words">
                            {jobPost?.jobTitle || t('workerApplications.job')}
                          </h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {employerName && (
                          <p className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                            <Building size={15} className="text-gray-400 dark:text-gray-500" />
                            {employerName}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {jobPost?.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={14} /> {jobPost.location}
                            </span>
                          )}
                          {jobPost?.employmentType && (
                            <span className="inline-flex items-center gap-1">
                              <Briefcase size={14} /> {TYPE_LABELS[jobPost.employmentType] ? t(TYPE_LABELS[jobPost.employmentType]) : jobPost.employmentType}
                            </span>
                          )}
                          <span>
                            {t('workerApplications.salary')}: <span className="text-gray-700 dark:text-gray-300 font-medium">{formatSalary(jobPost)}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={14} /> {t('workerApplications.appliedOn')}: {formatDate(app.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {jobPost && (
                          <button
                            onClick={() => navigate(`/job/${jobPost.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                          >
                            <Eye size={16} /> {t('workerApplications.viewJob')}
                          </button>
                        )}
                        {status === 'offer_sent' && (
                          <button
                            onClick={() => navigate('/worker/offers')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-teal-600 text-white hover:bg-teal-700 transition"
                          >
                            <FileText size={16} /> {t('workerApplications.viewOffer')}
                          </button>
                        )}
                        {canWithdraw(status) && (
                          <button
                            onClick={() => setConfirmWithdrawId(app.id)}
                            disabled={withdrawingId === app.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                          >
                            <XCircle size={16} /> {withdrawingId === app.id ? t('workerApplications.withdrawing') : t('workerApplications.withdraw')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Withdraw confirmation modal */}
      {confirmWithdrawId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('workerApplications.withdrawConfirmTitle')}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{t('workerApplications.withdrawConfirmDesc')}</p>
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => setConfirmWithdrawId(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition"
              >
                {t('workerApplications.cancel')}
              </button>
              <button
                onClick={() => handleWithdraw(confirmWithdrawId)}
                disabled={withdrawingId === confirmWithdrawId}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {withdrawingId === confirmWithdrawId ? t('workerApplications.withdrawing') : t('workerApplications.confirmWithdraw')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WorkerApplications;
