// frontend/src/components/jobs/ExternalJobCard.jsx
// ============================================================
// EXPERIMENTAL EXTERNAL JOB CARD — Provider-Aware
// Renders both Adzuna and Jooble external job opportunities.
// Action button ONLY navigates to verified external redirect URL.
// ============================================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, MapPin, Building, Calendar, Globe } from 'lucide-react';
import AdzunaAttribution from './AdzunaAttribution';
import JoobleAttribution from './JoobleAttribution';
import UsajobsAttribution from './UsajobsAttribution';

const ExternalJobCard = ({ job, country }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.resolvedLanguage === 'ar';

  if (!job) return null;

  const isJooble = job.source === 'jooble' || job.provider === 'jooble';
  const isUsajobs = job.source === 'usajobs' || job.provider === 'usajobs';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = () => {
    if (job.salaryDisplay) {
      return job.salaryDisplay;
    }
    const symbol = job.currencySymbol || (job.currency ? `${job.currency} ` : '');
    if (job.salaryMin !== null && job.salaryMax !== null) {
      if (job.salaryMin === job.salaryMax) {
        return `${symbol}${Math.round(job.salaryMin).toLocaleString()}`;
      }
      return `${symbol}${Math.round(job.salaryMin).toLocaleString()} - ${symbol}${Math.round(job.salaryMax).toLocaleString()}`;
    }
    if (job.salaryMin !== null) {
      return `${symbol}${Math.round(job.salaryMin).toLocaleString()}+`;
    }
    if (job.salaryMax !== null) {
      return `Up to ${symbol}${Math.round(job.salaryMax).toLocaleString()}`;
    }
    return null;
  };

  const salaryDisplay = formatSalary();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-indigo-100 dark:border-indigo-900/40 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition relative overflow-hidden">
      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Globe size={12} />
            {t('externalJobs.badge', 'External Opportunity')}
          </span>
          {job.category && (
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {job.category}
            </span>
          )}
          {isJooble && (
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {job.market === 'eg' ? 'Jooble EG' : 'Jooble TR'}
            </span>
          )}
          {isUsajobs && (
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {t('externalJobs.federalJob', 'Federal Job')}
            </span>
          )}
        </div>
        {isJooble ? (
          <JoobleAttribution country={job.market || country} />
        ) : isUsajobs ? (
          <UsajobsAttribution />
        ) : (
          <AdzunaAttribution country={country} />
        )}
      </div>

      {/* Job Title & Company */}
      <div className="flex flex-col gap-1 mb-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white break-words">
          {job.title}
        </h3>
        {job.company && (
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
            <Building size={15} className="text-gray-400" />
            {job.company}
          </p>
        )}
      </div>

      {/* Meta details */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400 mb-3">
        {job.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} className="text-gray-400" />
            {job.location}
          </span>
        )}
        {salaryDisplay && (
          <span className="inline-flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-200">
            {salaryDisplay}
          </span>
        )}
        {job.createdAt && (
          <span className="inline-flex items-center gap-1">
            <Calendar size={14} className="text-gray-400" />
            {t('workerJobs.posted')}: {formatDate(job.createdAt)}
          </span>
        )}
      </div>

      {/* Description Snippet (plain text, safe) */}
      {job.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg">
          {job.description}
        </p>
      )}

      {/* Action and Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
        <span className="text-xs text-gray-500 dark:text-gray-400 italic">
          {isJooble
            ? t('externalJobs.disclaimerJooble', 'Opens external partner application on Jooble')
            : isUsajobs
            ? t('externalJobs.disclaimerUsajobs', 'Opens official Federal job application on USAJOBS')
            : t('externalJobs.disclaimer', 'Opens external partner application on Adzuna')}
        </span>
        <a
          href={job.redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:scale-95 transition shadow-sm"
        >
          <span>{t('externalJobs.viewOpportunity', 'View Opportunity')}</span>
          <ExternalLink size={15} />
        </a>
      </div>
    </div>
  );
};

export default ExternalJobCard;
