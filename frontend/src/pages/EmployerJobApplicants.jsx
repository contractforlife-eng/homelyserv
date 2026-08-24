// src/pages/EmployerJobApplicants.jsx — View and manage applicants for a job (Phase 2)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import {
  ArrowLeft, Loader2, MapPin, Briefcase, Star, Calendar, Eye,
  ThumbsUp, XCircle, Send, Crown, Activity, Users, X, CheckCircle,
  Clock, Building
} from 'lucide-react';
import jobService from '../services/jobService';
import { formatJobCompensation } from '../utils/jobCompensationDisplay';
import { formatCurrencyAmount, getAccountCurrency, getStoredCurrency } from '../utils/currencyPresentation';
import { UserDisplayName } from '../components/users';

const STATUS_STYLES = {
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  shortlisted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  withdrawn: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  offer_sent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const EmployerJobApplicants = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { t, i18n } = useTranslation();

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [offerModalApp, setOfferModalApp] = useState(null);
  const [offerSalary, setOfferSalary] = useState('');
  const [offerError, setOfferError] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);

  const loadApplicants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await jobService.getJobApplications(id);
      if (data?.success) {
        setApplicants(data.applications || []);
      } else {
        setError(data?.message || t('employerJobApplicants.error'));
      }
    } catch (loadError) {
      console.error('Load applicants error:', loadError);
      setError(loadError.response?.data?.message || t('employerJobApplicants.error'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

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
    loadApplicants();
  }, [authLoading, isAuthenticated, authUser, navigate, loadApplicants]);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  const handleShortlist = async (app) => {
    if (app.status === 'offer_sent') return;
    setActionId(app.id);
    try {
      const data = await jobService.updateApplicationStatus(app.id, 'shortlisted');
      if (data?.success) {
        setApplicants(prev => prev.map(a => a.id === app.id ? data.application : a));
      } else {
        alert(data?.message || t('employerJobApplicants.actionError'));
      }
    } catch (err) {
      console.error('Shortlist error:', err);
      alert(err.response?.data?.message || t('employerJobApplicants.actionError'));
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (app) => {
    if (app.status === 'offer_sent') return;
    setActionId(app.id);
    try {
      const data = await jobService.updateApplicationStatus(app.id, 'rejected');
      if (data?.success) {
        setApplicants(prev => prev.map(a => a.id === app.id ? data.application : a));
      } else {
        alert(data?.message || t('employerJobApplicants.actionError'));
      }
    } catch (err) {
      console.error('Reject error:', err);
      alert(err.response?.data?.message || t('employerJobApplicants.actionError'));
    } finally {
      setActionId(null);
    }
  };

  const openOfferModal = (app) => {
    setOfferModalApp(app);
    setOfferSalary('');
    setOfferError('');
  };

  const handleSendOffer = async (e) => {
    e.preventDefault();
    if (!offerModalApp) return;
    const salary = Number(offerSalary);

    if (!Number.isFinite(salary) || salary <= 0) {
      setOfferError(t('employerJobApplicants.offerError'));
      return;
    }

    // The backend enforces job salary range; the modal shows the range
    // so the employer can set a valid value. Backend remains authoritative.
    setOfferLoading(true);
    setOfferError('');
    try {
      const data = await jobService.sendOfferFromApplication(offerModalApp.id, salary);
      if (data?.success) {
        setApplicants(prev => prev.map(a =>
          a.id === offerModalApp.id
            ? { ...a, status: 'offer_sent', offerId: data.offerId }
            : a
        ));
        setOfferModalApp(null);
      } else {
        setOfferError(data?.message || t('employerJobApplicants.offerError'));
      }
    } catch (err) {
      console.error('Send offer error:', err);
      setOfferError(err.response?.data?.message || t('employerJobApplicants.offerError'));
    } finally {
      setOfferLoading(false);
    }
  };

  const viewProfile = (app) => {
    const w = app.worker || {};
    navigate('/worker-profile-view', {
      state: {
        worker: {
          id: w.id,
          workerProfileId: w.workerProfileId,
          fullName: w.fullName,
          profileImage: w.profileImage || '',
          city: w.city,
          desiredJob: w.desiredJob,
          skills: w.skills || [],
          experience: w.experience || '',
          experienceYears: w.experienceYears,
          expectedSalary: w.expectedSalary,
          availability: w.availability,
          isPremium: w.isPremium,
          activelyLooking: w.activelyLooking,
          ratingAvg: w.ratingAvg,
        },
      },
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    const locales = { en: 'en-US', ar: 'ar-EG', fr: 'fr-FR', ru: 'ru-RU', tr: 'tr-TR', de: 'de-DE' };
    return d.toLocaleDateString(locales[i18n.resolvedLanguage] || locales.en, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatSalary = (value) => {
    if (value === null || value === undefined) return '—';
    const currency = getStoredCurrency(offerModalApp?.jobPost || offerModalApp?.job || authUser, getAccountCurrency(offerModalApp?.worker || authUser));
    return formatCurrencyAmount(value, currency, i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-US');
  };

  const formatSalaryRange = (jobPost) => formatJobCompensation(jobPost, t, i18n.resolvedLanguage);

  const renderActions = (app) => {
    const status = app.status;

    if (status === 'offer_sent') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${STATUS_STYLES.offer_sent}`}>
          <CheckCircle size={16} /> {t('employerJobApplicants.offerSent')}
        </span>
      );
    }

    if (status === 'withdrawn') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${STATUS_STYLES.withdrawn}`}>
          <X size={16} /> {t('employerJobApplicants.withdrawn')}
        </span>
      );
    }

    if (status === 'rejected') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${STATUS_STYLES.rejected}`}>
          <XCircle size={16} /> {t('employerJobApplicants.rejected')}
        </span>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        {status === 'applied' && (
          <button
            onClick={() => handleShortlist(app)}
            disabled={actionId === app.id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
          >
            {actionId === app.id ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
            {t('employerJobApplicants.shortlist')}
          </button>
        )}
        <button
          onClick={() => handleReject(app)}
          disabled={actionId === app.id}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
        >
          {actionId === app.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
          {t('employerJobApplicants.reject')}
        </button>
        <button
          onClick={() => openOfferModal(app)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-teal-600 text-white hover:bg-teal-700 transition"
        >
          <Send size={16} /> {t('employerJobApplicants.sendOffer')}
        </button>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('employerJobApplicants.loading')}</p>
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
        title={t('employerJobApplicants.title')}
        notificationUserId={authUser?.id || authUser?.email}
      />

      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Link to="/employer-jobs" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-teal-600 transition mb-4">
            <ArrowLeft size={18} /> {t('employerJobApplicants.backToJobs')}
          </Link>

          <RolePageHeader title={t('employerJobApplicants.title')} subtitle={t('employerJobApplicants.subtitle')} />

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-teal-600 mx-auto" />
            </div>
          ) : applicants.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('employerJobApplicants.emptyTitle')}</h3>
              <p className="text-gray-500 dark:text-gray-400">{t('employerJobApplicants.emptyDesc')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applicants.map((app) => {
                const statusLabel = t(`employerJobApplicants.status.${app.status}`, { defaultValue: app.status });
                const statusStyle = STATUS_STYLES[app.status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
                const worker = app.worker || {};

                return (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5"
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex gap-4 min-w-0 flex-1">
                        <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                          {worker.profileImage ? (
                            <img src={worker.profileImage} alt={worker.fullName || t('employerJobApplicants.applicant')} className="w-full h-full object-cover" />
                          ) : (
                            <Users size={24} className="text-teal-600" />
                          )}
                          {worker.isPremium && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                              <Crown size={10} className="text-white" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <UserDisplayName user={worker} name={t('employerJobApplicants.applicant')} size="lg" />
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle}`}>
                              {statusLabel}
                            </span>
                            {worker.isPremium && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700">
                                <Crown size={10} className="text-yellow-500" /> {t('employerJobApplicants.premium')}
                              </span>
                            )}
                            {worker.activelyLooking && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 border border-green-200 rounded-full text-[10px] font-medium text-green-700">
                                <Activity size={10} className="text-green-500" /> {t('employerJobApplicants.activelyLooking')}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {worker.city && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={14} /> {worker.city}
                              </span>
                            )}
                            {worker.desiredJob && (
                              <span className="inline-flex items-center gap-1">
                                <Briefcase size={14} /> {worker.desiredJob}
                              </span>
                            )}
                            {worker.experienceYears != null && (
                              <span className="inline-flex items-center gap-1">
                                <Star size={14} className="text-yellow-500" /> {worker.experienceYears} {t('employerJobApplicants.years')}
                              </span>
                            )}
                            <span>
                              {t('employerJobApplicants.expectedSalary')}: <span className="font-medium text-gray-700 dark:text-gray-300">{formatSalary(worker.expectedSalary)}</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={14} /> {t('employerJobApplicants.appliedOn')}: {formatDate(app.createdAt)}
                            </span>
                          </div>

                          {worker.skills && worker.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {worker.skills.slice(0, 5).map((skill, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 text-xs rounded-full">
                                  {skill}
                                </span>
                              ))}
                              {worker.skills.length > 5 && (
                                <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-900 text-gray-500 text-xs rounded-full">
                                  +{worker.skills.length - 5}
                                </span>
                              )}
                            </div>
                          )}

                          {app.coverMessage && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('employerJobApplicants.coverMessage')}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">{app.coverMessage}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
                        <button
                          onClick={() => viewProfile(app)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                        >
                          <Eye size={16} /> {t('employerJobApplicants.viewProfile')}
                        </button>
                        <div className="mt-1">
                          {renderActions(app)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Send Offer Modal */}
      {offerModalApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-lg w-full max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('employerJobApplicants.sendOfferTitle')}</h3>
              <button
                onClick={() => setOfferModalApp(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                aria-label={t('employerJobApplicants.closeModal')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('employerJobApplicants.applicant')}</p>
                <UserDisplayName user={offerModalApp.worker} name={t('employerJobApplicants.applicant')} size="lg" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('employerJobApplicants.jobTitle')}</p>
                <p className="text-gray-800 dark:text-white">{offerModalApp.jobTitle || offerModalApp.jobPost?.jobTitle || t('employerJobApplicants.job')}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('employerJobApplicants.salaryRange')}</p>
                  <p className="text-gray-800 dark:text-white">{formatSalaryRange(offerModalApp.jobPost)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('employerJobApplicants.employmentType')}</p>
                  <p className="text-gray-800 dark:text-white">
                    {offerModalApp.jobPost?.employmentType ? t(`employerJobApplicants.employmentTypeValue.${offerModalApp.jobPost.employmentType}`, { defaultValue: offerModalApp.jobPost.employmentType }) : '—'}
                  </p>
                </div>
              </div>

              {(offerModalApp.jobPost?.workingHoursPerDay != null ||
                offerModalApp.jobPost?.workingDaysPerWeek != null ||
                offerModalApp.jobPost?.weeklyDaysOff ||
                offerModalApp.jobPost?.workStartTime ||
                offerModalApp.jobPost?.workEndTime) && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('employerJobApplicants.scheduleDetails')}</p>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {offerModalApp.jobPost?.workingHoursPerDay != null && (
                      <p className="flex items-center gap-1.5">
                        <Clock size={13} className="text-gray-400" /> {t('employerJobApplicants.workingHoursPerDay')}: {offerModalApp.jobPost.workingHoursPerDay}
                      </p>
                    )}
                    {offerModalApp.jobPost?.workingDaysPerWeek != null && (
                      <p className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-400" /> {t('employerJobApplicants.workingDaysPerWeek')}: {offerModalApp.jobPost.workingDaysPerWeek}
                      </p>
                    )}
                    {offerModalApp.jobPost?.weeklyDaysOff && (
                      <p className="flex items-center gap-1.5">
                        <Clock size={13} className="text-gray-400" /> {t('employerJobApplicants.weeklyDaysOff')}: {offerModalApp.jobPost.weeklyDaysOff}
                      </p>
                    )}
                    {offerModalApp.jobPost?.workStartTime && offerModalApp.jobPost?.workEndTime && (
                      <p className="flex items-center gap-1.5">
                        <Clock size={13} className="text-gray-400" /> {t('employerJobApplicants.workStartTime')}: {offerModalApp.jobPost.workStartTime} - {t('employerJobApplicants.workEndTime')}: {offerModalApp.jobPost.workEndTime}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendOffer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('employerJobApplicants.finalMonthlySalary', {
                    currency: getStoredCurrency(offerModalApp.jobPost, getAccountCurrency(authUser))
                  })}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={offerSalary}
                  onChange={(e) => setOfferSalary(e.target.value)}
                  placeholder={t('employerJobApplicants.salaryPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  required
                />
                {offerModalApp.jobPost?.salaryMin != null && offerModalApp.jobPost?.salaryMax != null && (
                  <p className="text-xs text-gray-400 mt-1">
                    {t('employerJobApplicants.salaryRange')}: {formatSalaryRange(offerModalApp.jobPost)}
                  </p>
                )}
              </div>

              {offerError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-400 text-sm">
                  {offerError}
                </div>
              )}

              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setOfferModalApp(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                >
                  {t('employerJobApplicants.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={offerLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
                >
                  {offerLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {offerLoading ? t('employerJobApplicants.sending') : t('employerJobApplicants.sendOfferSubmit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmployerJobApplicants;
