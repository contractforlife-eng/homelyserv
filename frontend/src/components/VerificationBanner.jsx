// src/components/VerificationBanner.jsx
// Dismissible banner shown at the top of authenticated pages when
// the user's email has not been verified yet.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MailWarning, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';

function VerificationBanner() {
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
        toast.success('Verification email sent. Please check your inbox.');
      } else if (response.data?.status === 'rate_limited') {
        toast.error(response.data.message || 'Please wait before requesting another email.');
      } else {
        toast.success('Verification email sent. Please check your inbox.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to resend verification email.';
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MailWarning size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium truncate">
            Your email address has not been verified.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate('/verify-email')}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            Verify Now
          </button>
          <button
            onClick={handleResend}
            disabled={resending}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {resending ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw size={12} />
                Resend Email
              </>
            )}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerificationBanner;