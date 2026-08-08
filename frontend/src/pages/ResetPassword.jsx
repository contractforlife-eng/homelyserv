// src/pages/ResetPassword.jsx
// Password reset page - reads token from URL, validates new password, submits to backend
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Home,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [state, setState] = useState('ready'); // loading | ready | success | invalid | expired | error
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Guard to prevent duplicate submissions (React StrictMode safety)
  const submitStartedRef = useRef(false);

  // Check token presence on page load - do NOT consume the token
  useEffect(() => {
    if (!token) {
      setState('invalid');
      setError('No reset token provided. Please use the link from your email.');
    }
  }, [token]);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    // Validate password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Validate confirmation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Prevent duplicate submission (React StrictMode safety)
    if (submitStartedRef.current) return;
    submitStartedRef.current = true;

    setSubmitting(true);
    setError('');

    try {
      const response = await api.post('/api/auth/reset-password', {
        token,
        newPassword
      });

      if (response.data?.success) {
        setState('success');
      } else {
        throw new Error(response.data?.message || 'Failed to reset password');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to reset password. Please try again.';
      setError(message);

      // Determine state based on error message
      if (message.includes('expired')) {
        setState('expired');
      } else if (message.includes('invalid') || message.includes('already been used')) {
        setState('invalid');
      } else {
        setState('error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'success':
        return (
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl opacity-60 scale-110"></div>
              <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/30">
                <CheckCircle size={40} className="text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Password Reset Successful!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Your password has been changed successfully. You can now log in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 font-semibold"
            >
              Go to Login <ArrowRight size={18} />
            </button>
          </div>
        );

      case 'invalid':
        return (
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl opacity-60 scale-110"></div>
              <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30">
                <XCircle size={40} className="text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Invalid Reset Link</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {error || 'This password reset link is invalid or has already been used.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/forgot-password"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 font-semibold"
              >
                Request New Link
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 font-semibold"
              >
                Go to Login
              </Link>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl opacity-60 scale-110"></div>
              <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30">
                <Clock size={40} className="text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Link Expired</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              This password reset link has expired. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 font-semibold"
            >
              Request New Link
            </Link>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl opacity-60 scale-110"></div>
              <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30">
                <AlertCircle size={40} className="text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Something Went Wrong</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {error || 'Failed to reset password. Please try again.'}
            </p>
            <button
              onClick={() => setState('ready')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 font-semibold"
            >
              Try Again
            </button>
          </div>
        );

      case 'ready':
      default:
        return (
          <form onSubmit={handleSubmit}>
            <div className="mb-3 sm:mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-semibold mb-2">NEW PASSWORD</label>
              <div className="relative">
                <KeyRound size={16} sm:size={18} className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border ${
                    error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Enter new password"
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} sm:size={18} /> : <Eye size={16} sm:size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-3 sm:mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-semibold mb-2">CONFIRM NEW PASSWORD</label>
              <div className="relative">
                <KeyRound size={16} sm:size={18} className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border ${
                    error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Confirm new password"
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} sm:size={18} /> : <Eye size={16} sm:size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="mb-4 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={12} sm:size={14} /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition font-semibold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} sm:size={20} className="animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
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
                <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 tracking-widest uppercase mt-1 font-light">Reset Password</p>
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

export default ResetPassword;