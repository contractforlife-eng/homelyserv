// frontend/src/components/jobs/UsajobsAttribution.jsx
// ============================================================
// EXPERIMENTAL USAJOBS ATTRIBUTION COMPONENT — Phase 1
// Clear text and link attribution for USAJOBS federal job results.
// Safe external navigation: target="_blank", rel="noopener noreferrer"
// ============================================================
import React from 'react';
import { useTranslation } from 'react-i18next';

const USAJOBS_URL = 'https://www.usajobs.gov';

const UsajobsAttribution = ({ className = '', variant = 'card' }) => {
  const { t } = useTranslation();

  if (variant === 'banner') {
    return (
      <div className={`flex items-center justify-between gap-3 px-4 py-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl text-xs text-gray-600 dark:text-gray-300 ${className}`}>
        <span className="font-semibold text-blue-800 dark:text-blue-300">
          {t('externalJobs.disclaimerUsajobs', 'Opens official Federal job application on USAJOBS')}
        </span>
        <div
          className="inline-flex items-center gap-1 text-xs select-none shrink-0"
          style={{ minWidth: '124px', minHeight: '26px' }}
        >
          <a
            href={USAJOBS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition"
          >
            {t('externalJobs.jobsBy', 'Jobs by')}
          </a>
          <a
            href={USAJOBS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-blue-700 dark:text-blue-400 hover:underline transition tracking-wide"
          >
            USAJOBS
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
        href={USAJOBS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-700 dark:text-gray-200 font-medium hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition"
      >
        {t('externalJobs.jobsBy', 'Jobs by')}
      </a>
      <a
        href={USAJOBS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-blue-700 dark:text-blue-400 hover:underline transition tracking-wide"
      >
        USAJOBS
      </a>
    </div>
  );
};

export default UsajobsAttribution;
