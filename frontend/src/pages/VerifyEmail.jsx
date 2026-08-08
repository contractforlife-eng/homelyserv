// src/pages/VerifyEmail.jsx
// Email verification page - handles loading, success, failure, expired, and already-verified states
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Home,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  MailCheck,
  Loader2,
  ArrowRight
} from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [state, setState] = useState('loading'); // loading | success | failed | expired | already_verified
  const [error, setError] = useState('');

  // Guard to prevent duplicate verification requests (React StrictMode safety)
  const verificationStartedRef = useRef(false);
  const currentTokenRef = useRef(null);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setState('failed');
        setError('No verification token provided.');
        return;
      }

      // Prevent duplicate requests for the same token
      if (verificationStartedRef.current && currentTokenRef.current === token) {
        return;
      }

      verificationStartedRef.current = true;
      currentTokenRef.current = token;

      try {
        const response = await api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);

        if (response.data?.success) {
          const status = response.data.status;

          if (status === 'already_verified') {
            setState('already_verified');
          } else {
            setState('success');
          }

          // Update auth store if user is logged in
          if (response.data.user) {
            const currentUser = useAuthStore.getState().user;
            if (currentUser && currentUser.id === response.data.user.id) {
              useAuthStore.setState({ user: response.data.user });
            }
          }
        } else {
          const status = response.data?.status;
          if (status === 'expired') {
            setState('expired');
          } else {
            setState('failed');
            setError(response.data?.message || 'Verification failed.');
          }
        }
      } catch (err) {
        const status = err.response?.data?.status;
        if (status === 'expired') {
          setState('expired');
        } else {
          setState('failed');
          setError(err.response?.data?.message || 'Verification failed. Please try again.');
        }
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    try {
      const response = await api.post('/api/auth/resend-verification');
      if (response.data?.success) {
        setState('loading');
        // Show a brief "sent" state then go back to expired
        setTimeout(() => setState('expired'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification email.');
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl opacity-60 scale-110"></div>
              <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30">
                <Loader2 size={40} className="text-white animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Verifying your email...</h2>
            <p className="text-gray-500 dark:text-gray-400">Please wait while we confirm your email address.</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl opacity-60 scale-110"></div>
              <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/30">
                <CheckCircle size={40} className="text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Email Verified!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Your email address has been successfully verified. You can now enjoy all HomelyServ features.
            </p>
            <button
              onClick={() => {
                const user = useAuthStore.getState().user;
                const role = user?.role?.toUpperCase();
                if (role === 'EMPLOYER') navigate('/employer-dashboard');
                else if (role === 'WORKER') navigate('/worker-dashboard');
                else if (role === 'ADMIN') navigate('/admin');
                else navigate('/login');
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 sm:px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 font-semibold text-xs sm:text-sm"
            >
              Continue to Dashboard <ArrowRight size={16} sm:size={18} />
            </button>
          </div>
        );

      case 'already_verified':
        return (
          <div className="text-center">
            <div className="relative inline-block mb-4 sm:mb-6">
              <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl opacity-60 scale-110"></div>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
                <MailCheck size={32} sm:size={40} className="text-white" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">Already Verified</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 text-xs sm:text-sm">
              Your email address is already verified. No further action is needed.
            </p>
            <button
              onClick={() => {
                const user = useAuthStore.getState().user;
                const role = user?.role?.toUpperCase();
                if (role === 'EMPLOYER') navigate('/employer-dashboard');
                else if (role === 'WORKER') navigate('/worker-dashboard');
                else if (role === 'ADMIN') navigate('/admin');
                else navigate('/login');
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 sm:px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 font-semibold text-xs sm:text-sm"
            >
              Continue to Dashboard <ArrowRight size={16} sm:size={18} />
            </button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="relative inline-block mb-4 sm:mb-6">
              <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl opacity-60 scale-110"></div>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30">
                <Clock size={32} sm:size={40} className="text-white" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">Link Expired</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 text-xs sm:text-sm">
              This verification link has expired. Please request a new verification email.
            </p>
            <button
              onClick={handleResend}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 sm:px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 font-semibold text-xs sm:text-sm"
            >
              Resend Verification Email
            </button>
            {error && (
              <p className="mt-4 text-xs sm:text-sm text-red-500">{error}</p>
            )}
          </div>
        );

      case 'failed':
      default:
        return (
          <div className="text-center">
            <div className="relative inline-block mb-4 sm:mb-6">
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl opacity-60 scale-110"></div>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30">
                <XCircle size={32} sm:size={40} className="text-white" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">Verification Failed</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 text-xs sm:text-sm">
              {error || 'The verification link is invalid or has already been used.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleResend}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 font-semibold text-xs sm:text-sm"
              >
                Resend Verification Email
              </button>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 sm:px-6 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 font-semibold text-xs sm:text-sm"
              >
                Go to Login
              </Link>
            </div>
            {error && (
              <p className="mt-4 text-xs sm:text-sm text-red-500">{error}</p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50/30 p-3 sm:p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 sm:w-96 h-72 sm:h-96 bg-red-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-red-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-red-100/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-red-500/10 p-6 sm:p-8 border border-red-100/50 transition-all duration-300">

          {/* Logo & Brand */}
          <div className="text-center mb-6 sm:mb-8 pt-2">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl opacity-60 scale-110"></div>
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30">
                <div className="relative">
                  <Shield size={40} sm:size={48} className="text-white/20 absolute -inset-1" strokeWidth={1.5} />
                  <div className="relative z-10 flex items-center justify-center">
                    <Home size={24} sm:size={28} className="text-white" strokeWidth={2} />
                    <Sparkles size={12} sm:size={14} className="text-red-200 absolute -top-1 -right-1" />
                  </div>
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent tracking-tight">
                  HomelyServ
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 tracking-widest uppercase mt-1 font-light">Email Verification</p>
              </div>
            </div>
          </div>

          {/* Content based on state */}
          {renderContent()}

          {/* Footer */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
            <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
              Need help?{' '}
              <Link to="/contact" className="text-red-500 hover:text-red-600 transition-colors hover:underline">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;