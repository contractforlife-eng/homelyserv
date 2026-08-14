// src/pages/JobDetails.jsx — real JobPost detail (Phase 1 + Phase 2 apply)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, DollarSign, Calendar, Clock, Briefcase, CheckCircle, Award,
  Building, ArrowLeft, Loader2, FileText, Send, Users, Check
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useTranslation } from 'react-i18next';
import jobService from '../services/jobService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
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

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.resolvedLanguage === 'ar';

  const authUser = useAuthStore(state => state.user);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Application state
  const [myApplication, setMyApplication] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [coverMessage, setCoverMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  const isWorker = authUser?.role === 'WORKER';
  const isEmployerOwner = authUser?.role === 'EMPLOYER' && job && String(job.employerId) === String(authUser?.id);

  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await jobService.getJobById(id);
        if (data?.success) {
          setJob(data.job);
        } else {
          throw new Error(data?.message || t('jobDetails.notFoundDesc'));
        }
      } catch (fetchError) {
        console.error('Error fetching job details:', fetchError);
        setError(t('jobDetails.notFoundDesc'));
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id, t('jobDetails.notFoundDesc')]);

  // Determine current application for WORKER on load
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

  const backPath = authUser?.role === 'EMPLOYER' ? '/employer-jobs' : '/worker-jobs';

  const formatSalary = () => formatJobCompensation(job, t, i18n.resolvedLanguage);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    setApplyError('');
    setApplySuccess(false);
    try {
      const data = await jobService.applyToJob(id, coverMessage.trim() || null);
      if (data?.success) {
        setApplySuccess(true);
        setMyApplication(data.application);
        setCoverMessage('');
      } else {
        setApplyError(data?.message || t('jobDetails.applyError'));
      }
    } catch (applyErr) {
      console.error('Apply error:', applyErr);
      setApplyError(applyErr.response?.data?.message || t('jobDetails.applyError'));
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
    // EMPLOYER owner: show View Applicants
    if (isEmployerOwner) {
      return (
        <button
          onClick={() => navigate(`/employer-jobs/${job.id}/applicants`)}
          className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition flex items-center justify-center gap-2"
        >
          <Users size={18} />
          {t('jobDetails.viewApplicants')}
        </button>
      );
    }

    // Non-owner EMPLOYER or other roles: no apply UI
    if (!isWorker) {
      return null;
    }

    // Application loading
    if (applicationLoading) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={20} className="animate-spin text-red-600" />
        </div>
      );
    }

    // Already applied — show status
    if (myApplication) {
      return renderApplicationStatus();
    }

    // Not applied — show apply form
    return (
      <form onSubmit={handleApply} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('jobDetails.coverMessageLabel')}
          </label>
          <textarea
            value={coverMessage}
            onChange={(e) => setCoverMessage(e.target.value.slice(0, 2000))}
            placeholder={t('jobDetails.coverMessagePlaceholder')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{coverMessage.length}/2000 {t('jobDetails.coverMessageMax')}</p>
        </div>
        {applyError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-400 text-sm">
            {applyError}
          </div>
        )}
        {applySuccess && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 text-green-700 dark:text-green-400 text-sm">
            {t('jobDetails.applySuccess')}
          </div>
        )}
        <button
          type="submit"
          disabled={applying}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {applying ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {applying ? t('jobDetails.applying') : t('jobDetails.submitApplication')}
        </button>
      </form>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardHeader
          title={t('jobDetails.title')}
          notificationUserId={authUser?.id || authUser?.email}
        />
        <RolePageHeader title={t('jobDetails.title')} subtitle={t('jobDetails.subtitle')} />
        <div className="p-4 md:p-6 flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin text-red-600 mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">{t('jobDetails.loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <DashboardHeader
          title={t('jobDetails.title')}
          notificationUserId={authUser?.id || authUser?.email}
        />
        <RolePageHeader title={t('jobDetails.title')} subtitle={t('jobDetails.subtitle')} />
        <div className="p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('jobDetails.notFoundTitle')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{error || t('jobDetails.notFoundDesc')}</p>
              <button
                onClick={() => navigate(backPath)}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                {t('jobDetails.backToJobs')}
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const employerName = job.employer?.companyName || job.employer?.fullName || null;

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('jobDetails.title')}
        notificationUserId={authUser?.id || authUser?.email}
      />
      <RolePageHeader title={t('jobDetails.title')} subtitle={t('jobDetails.subtitle')} />
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Link to={backPath} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-red-600 transition mb-4">
            <ArrowLeft size={18} /> {t('jobDetails.backToJobs')}
          </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
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

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              {renderApplySection()}
            </div>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}

export default JobDetails;
