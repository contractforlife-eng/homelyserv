import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  MapPin, DollarSign, Calendar, Clock, Briefcase, CheckCircle, Award,
  Building, ArrowLeft, Loader2, FileText, Send, Users, Check, Share2,
  Lock, Mail, Phone, User, AlertCircle, UploadCloud
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useTranslation } from 'react-i18next';
import jobService from '../services/jobService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import Navbar from '../components/Navbar';
import LegalFooter from '../components/common/LegalFooter';
import PageMetadata from '../components/PageMetadata';
import JobShareModal from '../components/JobShareModal';
import { formatJobCompensation } from '../utils/jobCompensationDisplay';
import { UserDisplayName } from '../components/users';

const TYPE_LABELS = {
  'full-time': 'jobDetails.types.fullTime',
  'part-time': 'jobDetails.types.partTime',
  contract: 'jobDetails.types.contract',
  freelance: 'jobDetails.types.freelance',
};

const APPLICATION_STATUS_LABELS = {
  applied: 'jobDetails.applicationStatusValues.applied',
  shortlisted: 'jobDetails.applicationStatusValues.shortlisted',
  rejected: 'jobDetails.applicationStatusValues.rejected',
  withdrawn: 'jobDetails.applicationStatusValues.withdrawn',
  offer_sent: 'jobDetails.applicationStatusValues.offerSent',
};

const CONTRACT_TYPE_LABELS = {
  Permanent: 'jobDetails.contractTypes.permanent',
  Contract: 'jobDetails.contractTypes.contract',
  Temporary: 'jobDetails.contractTypes.temporary',
  permanent: 'jobDetails.contractTypes.permanent',
  contract: 'jobDetails.contractTypes.contract',
  temporary: 'jobDetails.contractTypes.temporary',
};

const APPLICATION_STATUS_STYLES = {
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  shortlisted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  withdrawn: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  offer_sent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.resolvedLanguage === 'ar';

  // Synchronize language if '?lang=xx' is present in shared URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const langParam = params.get('lang');
    const supported = ['ar', 'en', 'fr', 'de', 'ru', 'tr'];
    if (langParam && supported.includes(langParam) && i18n.language !== langParam) {
      i18n.changeLanguage(langParam);
      document.documentElement.lang = langParam;
      document.documentElement.dir = langParam === 'ar' ? 'rtl' : 'ltr';
    }
  }, [location.search, i18n]);

  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const setAuth = useAuthStore(state => state.setAuth);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Application state for authenticated workers
  const [myApplication, setMyApplication] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [coverMessage, setCoverMessage] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  // Visitor application form state
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [guestConfirmPassword, setGuestConfirmPassword] = useState('');
  const [guestFullName, setGuestFullName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestCountryCode, setGuestCountryCode] = useState('EG');

  const isWorker = authUser?.role === 'WORKER';
  const isEmployerOwner = authUser?.role === 'EMPLOYER' && job && String(job.employerId) === String(authUser?.id);

  // Load Job: try authenticated route, fallback to public route
  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        let data;
        if (isAuthenticated) {
          try {
            data = await jobService.getJobById(id);
          } catch (authErr) {
            data = await jobService.getPublicJobById(id);
          }
        } else {
          data = await jobService.getPublicJobById(id);
        }

        if (data?.success) {
          setJob(data.job);
        } else {
          throw new Error(data?.message || t('jobDetails.notFoundDesc', { defaultValue: 'Job post not found' }));
        }
      } catch (fetchError) {
        console.error('Error fetching job details:', fetchError);
        setError(t('jobDetails.notFoundDesc', { defaultValue: 'Job post not found or is unavailable' }));
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id, isAuthenticated, t]);

  // Determine current application for logged-in WORKER
  useEffect(() => {
    if (!isWorker || !id) return;
    const checkMyApplication = async () => {
      setApplicationLoading(true);
      try {
        const data = await jobService.getMyApplications();
        if (data?.success) {
          const found = (data.applications || []).find(
            (app) => String(app.jobPostId) === String(id)
          );
          setMyApplication(found || null);
        }
      } catch (checkError) {
        console.error('Error checking my application:', checkError);
      } finally {
        setApplicationLoading(false);
      }
    };
    checkMyApplication();
  }, [isWorker, id]);

  const backPath = isAuthenticated
    ? (authUser?.role === 'EMPLOYER' ? '/employer-jobs' : '/worker-jobs')
    : '/';

  const formatSalary = () => formatJobCompensation(job, t, i18n.resolvedLanguage);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Authenticated worker application
  const handleAuthApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    setApplyError('');
    setApplySuccess(false);
    try {
      const data = await jobService.applyToJob(id, coverMessage.trim() || null, cvFile);
      if (data?.success) {
        setApplySuccess(true);
        setMyApplication(data.application);
        setCoverMessage('');
        setCvFile(null);
      } else {
        setApplyError(data?.message || t('jobDetails.applyError', { defaultValue: 'Failed to submit application' }));
      }
    } catch (applyErr) {
      console.error('Apply error:', applyErr);
      setApplyError(applyErr.response?.data?.message || t('jobDetails.applyError', { defaultValue: 'Failed to submit application' }));
    } finally {
      setApplying(false);
    }
  };

  // Visitor (guest) application + registration
  const handleGuestApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    setApplyError('');
    setApplySuccess(false);

    if (guestPassword !== guestConfirmPassword) {
      setApplyError(t('jobDetails.passwordMismatch', { defaultValue: 'Passwords do not match' }));
      setApplying(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('email', guestEmail);
      formData.append('password', guestPassword);
      formData.append('confirmPassword', guestConfirmPassword);
      formData.append('fullName', guestFullName);
      formData.append('phone', guestPhone);
      formData.append('countryCode', guestCountryCode);
      if (coverMessage.trim()) formData.append('coverMessage', coverMessage.trim());
      if (cvFile) formData.append('cv', cvFile);

      const data = await jobService.applyPublicToJob(id, formData);

      if (data?.success) {
        setApplySuccess(true);
        if (data.token && data.user && setAuth) {
          setAuth(data.user, data.token);
        }
        setMyApplication(data.application);
        // If account needs profile completion, redirect after a short moment
        if (data.needsProfileCompletion) {
          setTimeout(() => {
            navigate('/worker-profile', {
              state: {
                message: t('jobApply.welcomePrompt', {
                  defaultValue: 'Application submitted! Please complete your profile to increase your hiring chances.',
                }),
              },
            });
          }, 1800);
        }
      } else {
        setApplyError(data?.message || t('jobDetails.applyError', { defaultValue: 'Application failed' }));
      }
    } catch (guestErr) {
      console.error('Guest apply error:', guestErr);
      if (guestErr.response?.status === 409 && guestErr.response?.data?.error === 'ACCOUNT_EXISTS') {
        setApplyError(
          t('jobApply.accountExistsPrompt', {
            defaultValue: 'An account with this email already exists. Please log in first to apply.',
          })
        );
      } else {
        setApplyError(guestErr.response?.data?.message || t('jobDetails.applyError', { defaultValue: 'Application failed' }));
      }
    } finally {
      setApplying(false);
    }
  };

  const renderApplicationStatus = () => {
    if (!myApplication) return null;
    const status = myApplication.status;
    const label = APPLICATION_STATUS_LABELS[status] ? t(APPLICATION_STATUS_LABELS[status]) : status;
    const style = APPLICATION_STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';

    let desc = '';
    switch (status) {
      case 'applied': desc = t('jobDetails.appliedDesc'); break;
      case 'shortlisted': desc = t('jobDetails.shortlistedDesc'); break;
      case 'rejected': desc = t('jobDetails.rejectedDesc'); break;
      case 'withdrawn': desc = t('jobDetails.withdrawnDesc'); break;
      case 'offer_sent': desc = t('jobDetails.offerSentDesc'); break;
      default: break;
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${style}`}>
            {label}
          </span>
        </div>
        {desc && <p className="text-sm text-gray-600 dark:text-gray-300">{desc}</p>}
        {status === 'offer_sent' && (
          <Link
            to="/worker/offers"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm"
          >
            <Briefcase size={16} /> {t('jobDetails.viewOffer')}
          </Link>
        )}
      </div>
    );
  };

  const renderApplySection = () => {
    // If job is closed or not accepting applications
    const isClosed = job.status === 'closed' || job.status === 'expired' || job.isAcceptingApplications === false;
    if (isClosed) {
      return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-center">
          <AlertCircle size={32} className="mx-auto text-amber-500 mb-2" />
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
            {t('jobDetails.closedNoticeTitle', { defaultValue: 'Applications Closed' })}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('jobDetails.closedNoticeDesc', {
              defaultValue: 'This job posting is closed or expired and is no longer accepting new applications.',
            })}
          </p>
        </div>
      );
    }

    // EMPLOYER owner: show View Applicants
    if (isEmployerOwner) {
      return (
        <div className="p-6 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/40 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              {t('jobApplicants.title', { defaultValue: 'Job Applicants' })}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('jobDetails.manageApplicantsSubtitle', { defaultValue: 'Review candidates who have applied to your job posting.' })}
            </p>
          </div>
          <button
            onClick={() => navigate(`/employer-jobs/${job.id}/applicants`)}
            className="w-full sm:w-auto px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition flex items-center justify-center gap-2 flex-shrink-0"
          >
            <Users size={18} />
            <span>{t('jobDetails.viewApplicants', { defaultValue: 'View Applicants' })}</span>
          </button>
        </div>
      );
    }

    // Non-owner authenticated employer or other administrative role
    if (isAuthenticated && !isWorker) {
      return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('jobDetails.employersCannotApply', { defaultValue: 'Only workers can apply for job postings.' })}
          </p>
        </div>
      );
    }

    // Application loading for authenticated worker
    if (applicationLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-red-600" />
        </div>
      );
    }

    // Already applied — show status
    if (myApplication) {
      return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
            {t('jobDetails.applicationStatus', { defaultValue: 'Your Application Status' })}
          </h3>
          {renderApplicationStatus()}
        </div>
      );
    }

    // Authenticated worker application form
    if (isAuthenticated && isWorker) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              {t('jobDetails.applyNow', { defaultValue: 'Apply for this Job' })}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('jobApply.authApplySubtitle', { defaultValue: 'Submit your application directly to the employer.' })}
            </p>
          </div>

          <form onSubmit={handleAuthApply} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('jobDetails.coverMessageLabel', { defaultValue: 'Message to Employer (Optional)' })}
              </label>
              <textarea
                value={coverMessage}
                onChange={(e) => setCoverMessage(e.target.value.slice(0, 2000))}
                placeholder={t('jobDetails.coverMessagePlaceholder')}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm resize-none"
              />
              <p className="text-xs text-gray-400 mt-1.5">{coverMessage.length}/2000 {t('jobDetails.coverMessageMax')}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('jobApply.cvAttachment', { defaultValue: 'Attach CV / Resume (Optional)' })}
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-50 dark:file:bg-teal-900/40 file:text-teal-700 dark:file:text-teal-300 hover:file:bg-teal-100"
              />
              <p className="text-xs text-gray-400 mt-1.5">{t('jobApply.cvFileHint', { defaultValue: 'PDF, JPG, PNG or WebP (max 10MB)' })}</p>
            </div>

            {applyError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {applyError}
              </div>
            )}
            {applySuccess && (
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                {t('jobDetails.applySuccess')}
              </div>
            )}

            <button
              type="submit"
              disabled={applying}
              className="w-full sm:w-auto min-w-[220px] bg-red-600 hover:bg-red-700 text-white py-3.5 px-8 rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 text-base"
            >
              {applying ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              <span>{applying ? t('jobDetails.applying') : t('jobDetails.submitApplication')}</span>
            </button>
          </form>
        </div>
      );
    }

    // Unauthenticated visitor application & registration form (Spacious Main Section Layout)
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            {t('jobApply.visitorApplyTitle', { defaultValue: 'Apply for this Job' })}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('jobApply.visitorApplySubtitle', { defaultValue: 'Create a free worker account to submit your application directly.' })}
          </p>
        </div>

        <form onSubmit={handleGuestApply} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('jobDetails.fullName', { defaultValue: 'Full Name *' })}
              </label>
              <input
                type="text"
                required
                value={guestFullName}
                onChange={(e) => setGuestFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-base focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('jobDetails.email', { defaultValue: 'Email Address *' })}
              </label>
              <input
                type="email"
                required
                dir="ltr"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-base focus:ring-2 focus:ring-red-500 outline-none text-left"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('jobDetails.country', { defaultValue: 'Country *' })}
              </label>
              <select
                value={guestCountryCode}
                onChange={(e) => setGuestCountryCode(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-base focus:ring-2 focus:ring-red-500 outline-none"
              >
                <option value="EG">{t('jobDetails.countries.EG', { defaultValue: 'Egypt (+20)' })}</option>
                <option value="SA">{t('jobDetails.countries.SA', { defaultValue: 'Saudi Arabia (+966)' })}</option>
                <option value="AE">{t('jobDetails.countries.AE', { defaultValue: 'UAE (+971)' })}</option>
                <option value="KW">{t('jobDetails.countries.KW', { defaultValue: 'Kuwait (+965)' })}</option>
                <option value="QA">{t('jobDetails.countries.QA', { defaultValue: 'Qatar (+974)' })}</option>
                <option value="OM">{t('jobDetails.countries.OM', { defaultValue: 'Oman (+968)' })}</option>
                <option value="BH">{t('jobDetails.countries.BH', { defaultValue: 'Bahrain (+973)' })}</option>
                <option value="JO">{t('jobDetails.countries.JO', { defaultValue: 'Jordan (+962)' })}</option>
                <option value="TR">{t('jobDetails.countries.TR', { defaultValue: 'Turkey (+90)' })}</option>
                <option value="DE">{t('jobDetails.countries.DE', { defaultValue: 'Germany (+49)' })}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('jobDetails.phone', { defaultValue: 'Phone Number *' })}
              </label>
              <input
                type="tel"
                required
                dir="ltr"
                placeholder="1012345678"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-base focus:ring-2 focus:ring-red-500 outline-none text-left"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('jobDetails.password', { defaultValue: 'Password (min 6 chars) *' })}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={guestPassword}
                onChange={(e) => setGuestPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-base focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('jobDetails.confirmPassword', { defaultValue: 'Confirm Password *' })}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={guestConfirmPassword}
                onChange={(e) => setGuestConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-base focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              {t('jobDetails.coverMessageLabel', { defaultValue: 'Message to Employer (Optional)' })}
            </label>
            <textarea
              value={coverMessage}
              onChange={(e) => setCoverMessage(e.target.value.slice(0, 2000))}
              placeholder={t('jobDetails.coverMessagePlaceholder')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm resize-none focus:ring-2 focus:ring-red-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">{coverMessage.length}/2000 {t('jobDetails.coverMessageMax')}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              {t('jobApply.cvAttachment', { defaultValue: 'Attach CV / Resume (Optional)' })}
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setCvFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-50 dark:file:bg-teal-900/40 file:text-teal-700 dark:file:text-teal-300 hover:file:bg-teal-100"
            />
            <p className="text-xs text-gray-400 mt-1">{t('jobApply.cvFileHint', { defaultValue: 'PDF, JPG, PNG or WebP (max 10MB)' })}</p>
          </div>

          {applyError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm space-y-2">
              <p>{applyError}</p>
              {applyError.includes('already exists') && (
                <Link
                  to={`/login?returnUrl=/job/${id}`}
                  className="inline-block font-semibold text-teal-700 dark:text-teal-300 underline text-sm"
                >
                  {t('jobApply.loginNow', { defaultValue: 'Log In with your existing account →' })}
                </Link>
              )}
            </div>
          )}

          {applySuccess && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
              {t('jobApply.applySuccessRedirect', { defaultValue: 'Application submitted! Redirecting to complete your profile...' })}
            </div>
          )}

          <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('jobDetails.byApplyingAgree', { defaultValue: 'By applying, you agree to our' })}{' '}
              <Link to="/terms" className="text-teal-600 dark:text-teal-400 font-medium hover:underline">
                {t('jobDetails.terms', { defaultValue: 'Terms of Service' })}
              </Link>{' '}
              {t('jobDetails.and', { defaultValue: 'and' })}{' '}
              <Link to="/privacy" className="text-teal-600 dark:text-teal-400 font-medium hover:underline">
                {t('jobDetails.privacyPolicy', { defaultValue: 'Privacy Policy' })}
              </Link>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="submit"
              disabled={applying}
              className="w-full sm:w-auto min-w-[260px] bg-red-600 hover:bg-red-700 text-white py-3.5 px-8 rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 text-base shadow-sm"
            >
              {applying ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              <span>{applying ? t('jobDetails.applying') : t('jobApply.submitVisitorApplication', { defaultValue: 'Register & Submit Application' })}</span>
            </button>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('jobDetails.loginPrompt', { defaultValue: 'Already have an account?' })}{' '}
              <Link to={`/login?returnUrl=/job/${id}`} className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                {t('jobDetails.loginLink', { defaultValue: 'Log In' })}
              </Link>
            </p>
          </div>
        </form>
      </div>
    );
  };
  // Loading state
  if (loading) {
    const content = (
      <div className="p-4 md:p-6 flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-red-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('jobDetails.loading')}</p>
        </div>
      </div>
    );

    if (isAuthenticated) {
      return (
        <DashboardLayout>
          <DashboardHeader title={t('jobDetails.title')} notificationUserId={authUser?.id || authUser?.email} />
          {content}
        </DashboardLayout>
      );
    }
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="flex-1">{content}</main>
        <LegalFooter />
      </div>
    );
  }

  // Not found or error state
  if (!job) {
    const errorContent = (
      <div className="p-4 md:p-6 max-w-4xl mx-auto py-16">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('jobDetails.notFoundTitle')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error || t('jobDetails.notFoundDesc')}</p>
          <button
            onClick={() => navigate(backPath)}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            {t('jobDetails.backToJobs')}
          </button>
        </div>
      </div>
    );

    if (isAuthenticated) {
      return (
        <DashboardLayout>
          <DashboardHeader title={t('jobDetails.title')} notificationUserId={authUser?.id || authUser?.email} />
          {errorContent}
        </DashboardLayout>
      );
    }
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="flex-1">{errorContent}</main>
        <LegalFooter />
      </div>
    );
  }

  const employerName = job.employer?.companyName || job.employer?.fullName || null;

  // Main details body
  const bodyContent = (
    <div className="p-4 md:p-6">
      <PageMetadata
        title={`${job.jobTitle}${employerName ? ` - ${employerName}` : ''} | HomelyServ`}
        description={job.description ? job.description.slice(0, 160) : t('jobShare.freeBadge', { defaultValue: 'Apply to this job for free now — No fees' })}
        ogImage={`https://www.homelyserv.com/social/job-share-${['ar', 'en', 'fr', 'de', 'ru', 'tr'].includes(i18n.language?.slice(0, 2)) ? i18n.language.slice(0, 2) : 'ar'}.png`}
        ogImageWidth="1200"
        ogImageHeight="630"
      />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link to={backPath} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-red-600 transition">
            <ArrowLeft size={18} /> {t('jobDetails.backToJobs')}
          </Link>

          <button
            onClick={() => setShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 hover:bg-teal-100 transition"
          >
            <Share2 size={16} />
            <span>{t('jobShare.share', { defaultValue: 'Share' })}</span>
          </button>
        </div>

        {/* Job Title & Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white break-words">{job.jobTitle}</h1>
                {job.isUrgent && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {t('jobDetails.urgent')}
                  </span>
                )}
                {job.isFeatured && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {t('jobDetails.featured')}
                  </span>
                )}
                {job.status && job.status !== 'open' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {job.status.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                {employerName && (
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <Building size={18} className="text-gray-400 dark:text-gray-500" />
                    <UserDisplayName user={{ ...job.employer, role: 'EMPLOYER' }} name={employerName} />
                  </span>
                )}
                {job.location && (
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <MapPin size={18} className="text-gray-400 dark:text-gray-500" /> {job.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('jobDetails.salary')}</p>
              <p className="font-semibold text-gray-800 dark:text-white">{formatSalary()}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('jobDetails.jobType')}</p>
              <p className="font-semibold text-gray-800 dark:text-white">{TYPE_LABELS[job.employmentType] ? t(TYPE_LABELS[job.employmentType]) : job.employmentType}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('jobDetails.posted')}</p>
              <p className="font-semibold text-gray-800 dark:text-white">{formatDate(job.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Details & Apply Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {job.description && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{t('jobDetails.jobDescription')}</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">{job.description}</p>
              </div>
            )}

            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{t('jobDetails.requirements')}</h2>
                <ul className="space-y-2">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                      <CheckCircle size={16} className="text-green-500 mt-1 flex-shrink-0" /> <span className="break-words">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{t('jobDetails.benefits')}</h2>
                <ul className="space-y-2">
                  {job.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                      <Award size={16} className="text-blue-500 mt-1 flex-shrink-0" /> <span className="break-words">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{t('jobDetails.schedule')}</h3>
              <div className="space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
                {job.workingHoursPerDay !== null && job.workingHoursPerDay !== undefined && (
                  <p className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400 dark:text-gray-500" />
                    {job.workingHoursPerDay} {t('jobDetails.perDay')}
                  </p>
                )}
                {job.workingDaysPerWeek !== null && job.workingDaysPerWeek !== undefined && (
                  <p className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                    {job.workingDaysPerWeek} {t('jobDetails.daysPerWeek')}
                  </p>
                )}
                {job.workStartTime && job.workEndTime && (
                  <p className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400 dark:text-gray-500" />
                    {job.workStartTime} {t('jobDetails.to')} {job.workEndTime}
                  </p>
                )}
                {job.weeklyDaysOff && (
                  <p className="flex items-start gap-2">
                    <Clock size={14} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="break-words">{t('jobDetails.daysOff')}: {job.weeklyDaysOff}</span>
                  </p>
                )}
                {job.employmentStartDate && (
                  <p className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                    {t('jobDetails.startDate')}: {formatDate(job.employmentStartDate)}
                  </p>
                )}
                {job.deadline && (
                  <p className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                    {t('jobDetails.deadline')}: {formatDate(job.deadline)}
                  </p>
                )}
                {job.contractType && (
                  <p className="flex items-center gap-2">
                    <FileText size={14} className="text-gray-400 dark:text-gray-500" />
                    {CONTRACT_TYPE_LABELS[job.contractType] ? t(CONTRACT_TYPE_LABELS[job.contractType]) : job.contractType}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Application Form — Spacious Full-Width Main Section below Job Details */}
        <div className="mt-8">
          {renderApplySection()}
        </div>
      </div>

      {shareModalOpen && (
        <JobShareModal
          job={job}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );

  if (isAuthenticated) {
    return (
      <DashboardLayout>
        <DashboardHeader
          title={t('jobDetails.title')}
          notificationUserId={authUser?.id || authUser?.email}
        />
        <RolePageHeader title={t('jobDetails.title')} subtitle={t('jobDetails.subtitle')} />
        {bodyContent}
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-1 py-4">{bodyContent}</main>
      <LegalFooter />
    </div>
  );
}
