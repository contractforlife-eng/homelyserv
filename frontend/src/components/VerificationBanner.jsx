// src/components/VerificationBanner.jsx
// Dismissible banner shown at the top of authenticated pages when
// the user's email has not been verified yet.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MailWarning, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

function VerificationBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);

  // Don't show if user is verified, not logged in, or dismissed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setResending(true);
    try {
      const response = await api.post('/api/auth/resend-verification');
      if (response.data?.success) {
        toast.success(t('sharedChrome.verification.emailSent'));
      } else if (response.data?.status === 'rate_limited') {
        toast.error(response.data.message || t('sharedChrome.verification.waitBeforeResend'));
      } else {
        toast.success(t('sharedChrome.verification.emailSent'));
      }
    } catch (err) {
      const message = err.response?.data?.message || t('sharedChrome.verification.resendFailed');
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl max-w-[1200px] mx-auto mt-3 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="bg-red-100 dark:bg-red-800/40 rounded-full p-2 text-red-600 dark:text-red-300 flex-shrink-0">
            <MailWarning size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-red-900 dark:text-red-100">
              {t('sharedChrome.verification.notVerified')}
            </p>
            <p className="text-xs text-red-700/80 dark:text-red-300 mt-0.5">
              {t('sharedChrome.verification.verificationDescription')}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:flex-shrink-0">
          <button
            onClick={() => navigate('/verify-email')}
            className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            {t('sharedChrome.verification.verifyNow')}
          </button>
          <button
            onClick={handleResend}
            disabled={resending}
            className="px-4 py-2 text-xs font-semibold bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {resending ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                {t('sharedChrome.verification.sending')}
              </>
            ) : (
              <>
                <RefreshCw size={12} />
                {t('sharedChrome.verification.resendEmail')}
              </>
            )}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-2 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors self-end sm:self-auto"
            aria-label={t('sharedChrome.verification.dismiss')}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerificationBanner;
