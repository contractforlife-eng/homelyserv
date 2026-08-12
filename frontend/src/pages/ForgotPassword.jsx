import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import LegalFooter from '../components/common/LegalFooter';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';

function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError(t('enterEmail'));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('enterValidEmail'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/forgot-password', {
        email: email.trim().toLowerCase()
      });

      if (response.data.success) {
        setSubmitted(true);
        setError('');
      } else {
        throw new Error(response.data.message || t('forgotPasswordFailed'));
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.response?.data?.message || error.message || t('forgotPasswordFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-white px-3 sm:px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-red-600 transition mb-4 sm:mb-6 text-xs sm:text-sm">
          <ArrowLeft size={16} sm:size={18} /> {t('backToLogin')}
        </Link>

        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-red-600">HomelyServ</h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs sm:text-sm mt-1">{t('resetPassword')}</p>
        </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white text-center mb-2">{t('forgotPasswordTitle')}</h2>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-center text-xs sm:text-sm mb-4 sm:mb-6">
            {t('forgotPasswordDescription')}
          </p>

        {submitted ? (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-xl p-4 text-center">
              <CheckCircle size={36} sm:size={48} className="text-green-500 mx-auto mb-3" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">{t('checkYourEmail')}</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2">
                {t('resetLinkSent')} <strong>{email}</strong>
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs sm:text-sm"
              >
                {t('backToLogin')}
              </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-semibold mb-2">{t('email')}</label>
              <div className="relative">
                <Mail size={16} sm:size={18} className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border ${
                    error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200`}
                  placeholder={t('emailPlaceholder')}
                  required
                  disabled={loading}
                />
              </div>
              {error && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} sm:size={14} /> {error}
                </p>
              )}
            </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition font-semibold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} sm:size={20} className="animate-spin" />
                    {t('sending')}
                  </>
                ) : (
                  t('sendResetLink')
                )}
              </button>
          </form>
        )}

        <p className="text-center text-gray-600 dark:text-gray-300 mt-4 sm:mt-6 text-xs sm:text-sm">
          {t('rememberPassword')} <Link to="/login" className="text-red-600 font-semibold hover:underline">{t('auth.signInLink')}</Link>
        </p>
      </div>

      <LegalFooter className="mt-6" />
    </div>
  );
}

export default ForgotPassword;
