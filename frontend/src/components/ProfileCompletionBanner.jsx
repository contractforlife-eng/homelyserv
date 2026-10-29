// src/components/ProfileCompletionBanner.jsx
// Prompts newly created or incomplete worker accounts to complete their profile
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserCheck, ArrowRight, X } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useTranslation } from 'react-i18next';

export default function ProfileCompletionBanner() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);

  // Don't show on profile page itself, if not logged in, if not worker, or if dismissed
  if (!user || user.role !== 'WORKER' || dismissed || location.pathname === '/worker-profile') {
    return null;
  }

  // Only show if worker profile is incomplete or flagged as needsProfileCompletion
  const isIncomplete = user.profileComplete === false || user.needsProfileCompletion === true;
  if (!isIncomplete) {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl max-w-[1200px] mx-auto mt-3 px-4 py-3 sm:px-5 sm:py-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="bg-amber-100 dark:bg-amber-900/50 rounded-full p-2 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5 sm:mt-0">
            <UserCheck size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              {t('profileCompletion.bannerTitle', { defaultValue: 'Complete your worker profile' })}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {t('profileCompletion.bannerDesc', {
                defaultValue: 'Add your skills, experience, and hourly rate so employers can review and hire you.',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Link
            to="/worker-profile"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition"
          >
            <span>{t('profileCompletion.actionButton', { defaultValue: 'Complete Profile' })}</span>
            <ArrowRight size={14} />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-amber-600 hover:text-amber-800 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
