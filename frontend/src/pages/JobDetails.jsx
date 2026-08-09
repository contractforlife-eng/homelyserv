// src/pages/JobDetails.jsx — real JobPost detail (Phase 1)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, DollarSign, Calendar, Clock, Briefcase, CheckCircle, Award,
  Building, ArrowLeft, Loader2, FileText
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useTranslation } from 'react-i18next';
import jobService from '../services/jobService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';

const translations = {
  en: {
    title: 'Job Details',
    subtitle: 'Review a job posting and its requirements',
    backToJobs: 'Back to Jobs',
    salary: 'Salary',
    jobType: 'Job Type',
    posted: 'Posted',
    employer: 'Employer',
    jobDescription: 'Job Description',
    requirements: 'Requirements',
    benefits: 'Benefits',
    schedule: 'Schedule',
    startDate: 'Start Date',
    deadline: 'Application Deadline',
    fullTime: 'Full Time',
    partTime: 'Part Time',
    contract: 'Contract',
    freelance: 'Freelance',
    urgent: 'Urgent',
    featured: 'Featured',
    perDay: 'hrs/day',
    daysPerWeek: 'days/week',
    to: 'to',
    daysOff: 'Weekly days off',
    notFoundTitle: 'Job Not Found',
    notFoundDesc: 'This job may have been closed or removed.',
    loading: 'Loading job details...',
    error: 'Failed to load job details.',
    comingSoon: 'Applications coming soon',
    company: 'Company',
    locationNotSpecified: 'Location not specified',
  },
  ar: {
    title: 'تفاصيل الوظيفة',
    subtitle: 'مراجعة تفاصيل الوظيفة ومتطلباتها',
    backToJobs: 'العودة إلى الوظائف',
    salary: 'الراتب',
    jobType: 'نوع الوظيفة',
    posted: 'تاريخ النشر',
    employer: 'صاحب العمل',
    jobDescription: 'وصف الوظيفة',
    requirements: 'المتطلبات',
    benefits: 'المزايا',
    schedule: 'الجدول',
    startDate: 'تاريخ البدء',
    deadline: 'الموعد النهائي للتقديم',
    fullTime: 'دوام كامل',
    partTime: 'دوام جزئي',
    contract: 'عقد',
    freelance: 'حر',
    urgent: 'عاجل',
    featured: 'مميزة',
    perDay: 'ساعة/يوم',
    daysPerWeek: 'أيام/أسبوع',
    to: 'إلى',
    daysOff: 'أيام الإجازة الأسبوعية',
    notFoundTitle: 'الوظيفة غير موجودة',
    notFoundDesc: 'ربما تم إغلاق هذه الوظيفة أو إزالتها.',
    loading: 'جارٍ تحميل تفاصيل الوظيفة...',
    error: 'فشل تحميل تفاصيل الوظيفة.',
    comingSoon: 'التقديم قريباً',
    company: 'الشركة',
    locationNotSpecified: 'الموقع غير محدد',
  },
};

const TYPE_LABELS = {
  'full-time': { en: 'Full Time', ar: 'دوام كامل' },
  'part-time': { en: 'Part Time', ar: 'دوام جزئي' },
  contract: { en: 'Contract', ar: 'عقد' },
  freelance: { en: 'Freelance', ar: 'حر' },
};

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.language === 'ar' ? 'ar' : 'en';
  const t = translations[language] || translations.en;
  const isArabic = language === 'ar';

  const authUser = useAuthStore(state => state.user);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await jobService.getJobById(id);
        if (data?.success) {
          setJob(data.job);
        } else {
          throw new Error(data?.message || t.notFoundDesc);
        }
      } catch (fetchError) {
        console.error('Error fetching job details:', fetchError);
        setError(t.notFoundDesc);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id, t.notFoundDesc]);

  const backPath = authUser?.role === 'EMPLOYER' ? '/employer-jobs' : '/worker-jobs';

  const formatSalary = () => {
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

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardHeader
          title={t.title}
          notificationUserId={authUser?.id || authUser?.email}
        />
        <RolePageHeader title={t.title} subtitle={t.subtitle} />
        <div className="p-4 md:p-6 flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin text-red-600 mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">{t.loading}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <DashboardHeader
          title={t.title}
          notificationUserId={authUser?.id || authUser?.email}
        />
        <RolePageHeader title={t.title} subtitle={t.subtitle} />
        <div className="p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t.notFoundTitle}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{error || t.notFoundDesc}</p>
              <button
                onClick={() => navigate(backPath)}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                {t.backToJobs}
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
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
      />
      <RolePageHeader title={t.title} subtitle={t.subtitle} />
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Link to={backPath} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-red-600 transition mb-4">
            <ArrowLeft size={18} /> {t.backToJobs}
          </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white break-words">{job.jobTitle}</h1>
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
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                {employerName && (
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <Building size={18} className="text-gray-400 dark:text-gray-500" /> {employerName}
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
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.salary}</p>
              <p className="font-semibold text-gray-800 dark:text-white">{formatSalary()}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.jobType}</p>
              <p className="font-semibold text-gray-800 dark:text-white">{TYPE_LABELS[job.employmentType]?.[language] || job.employmentType}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.posted}</p>
              <p className="font-semibold text-gray-800 dark:text-white">{formatDate(job.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {job.description && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{t.jobDescription}</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">{job.description}</p>
              </div>
            )}

            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{t.requirements}</h2>
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
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{t.benefits}</h2>
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
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{t.schedule}</h3>
              <div className="space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
                {job.workingHoursPerDay !== null && job.workingHoursPerDay !== undefined && (
                  <p className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400 dark:text-gray-500" />
                    {job.workingHoursPerDay} {t.perDay}
                  </p>
                )}
                {job.workingDaysPerWeek !== null && job.workingDaysPerWeek !== undefined && (
                  <p className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                    {job.workingDaysPerWeek} {t.daysPerWeek}
                  </p>
                )}
                {job.workStartTime && job.workEndTime && (
                  <p className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400 dark:text-gray-500" />
                    {job.workStartTime} {t.to} {job.workEndTime}
                  </p>
                )}
                {job.weeklyDaysOff && (
                  <p className="flex items-start gap-2">
                    <Clock size={14} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="break-words">{t.daysOff}: {job.weeklyDaysOff}</span>
                  </p>
                )}
                {job.employmentStartDate && (
                  <p className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                    {t.startDate}: {formatDate(job.employmentStartDate)}
                  </p>
                )}
                {job.deadline && (
                  <p className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                    {t.deadline}: {formatDate(job.deadline)}
                  </p>
                )}
                {job.contractType && (
                  <p className="flex items-center gap-2">
                    <FileText size={14} className="text-gray-400 dark:text-gray-500" />
                    {job.contractType}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <button
                disabled
                className="w-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 py-3 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Briefcase size={18} />
                {t.comingSoon}
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}

export default JobDetails;
