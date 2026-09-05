// frontend/src/components/jobs/JobicyAttribution.jsx
// ============================================================
// EXPERIMENTAL JOBICY ATTRIBUTION COMPONENT — Remote Jobs
// Clear text and link attribution for Jobicy remote job results.
// Safe external navigation: target="_blank", rel="noopener noreferrer"
// ============================================================
import React from 'react';
import { useTranslation } from 'react-i18next';

const JOBICY_URL = 'https://jobicy.com';

const JobicyAttribution = ({ className = '', variant = 'card' }) => {
  const { t } = useTranslation();

  if (variant === 'banner') {
    return (
      <div className={`flex items-center justify-between gap-3 px-4 py-3 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 rounded-xl text-xs text-gray-600 dark:text-gray-300 ${className}`}>
        <span className="font-semibold text-teal-800 dark:text-teal-300">
          {t('externalJobs.disclaimerJobicy', 'Opens external partner application on Jobicy')}
        </span>
        <div
          className="inline-flex items-center gap-1 text-xs select-none shrink-0"
          style={{ minWidth: '124px', minHeight: '26px' }}
        >
          <a
            href={JOBICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400 hover:underline transition"
          >
            {t('externalJobs.jobsBy', 'Jobs by')}
          </a>
          <a
            href={JOBICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-teal-700 dark:text-teal-400 hover:underline transition tracking-wide"
          >
            Jobicy
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 text-xs select-none shrink-0 ${className}`}
      style={{ minWidth: '116px', minHeight: '24px' }}
    >
      <a
        href={JOBICY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-700 dark:text-gray-200 font-medium hover:text-teal-600 dark:hover:text-teal-400 hover:underline transition"
      >
        {t('externalJobs.jobsBy', 'Jobs by')}
      </a>
      <a
        href={JOBICY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-teal-700 dark:text-teal-400 hover:underline transition tracking-wide"
      >
        Jobicy
      </a>
    </div>
  );
};

export default JobicyAttribution;
