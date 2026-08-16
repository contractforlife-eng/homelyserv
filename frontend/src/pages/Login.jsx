// src/pages/Login.jsx - BRIGHT RED, WHITE, AND BLACK THEME
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Globe, AlertCircle, Shield, Home, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import SocialLogin from '../components/SocialLogin';
import LegalFooter from '../components/common/LegalFooter';
import LoginMarketing from '../components/LoginMarketing';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import { migrateLegacyProfileIfNeeded } from '../utils/profileMigration';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguageGlobal } from '../i18n';

function Login() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

// Check if user is already logged in — redirect based on Zustand auth state
  useEffect(() => {
    const { token, isAuthenticated, user } = useAuthStore.getState();
    if (token && isAuthenticated && user) {
      redirectUser(user);
    }
  }, []);

  // Isolate Login from the global dashboard dark mode.
  // Login must always use its own original (light) design.
  // We remove the "dark" class on mount and restore the previous state on unmount.
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains('dark');
    if (wasDark) {
      html.classList.remove('dark');
    }
    return () => {
      if (wasDark) {
        html.classList.add('dark');
      }
    };
  }, []);

const redirectUser = (user) => {
     const role = user?.role?.toUpperCase();

     if (role === 'ADMIN') {
       navigate('/admin');
     } else if (role === 'EMPLOYER') {
       navigate('/employer-dashboard');
     } else if (role === 'WORKER') {
       navigate('/worker-dashboard');
     } else if (role === 'SUPPORT') {
       navigate('/support-dashboard');
     } else {
       navigate('/login');
     }
   };

  const loginUser = async (email, password) => {
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/login', {
        email,
        password
      });

      const data = response.data;

      if (!data.success) {
        setError(data.message || t('invalidCredentials'));
        setLoading(false);
        return;
      }

      const user = data.user;
      const token = data.token;

      user.role = user.role?.toUpperCase();

      const authResult = useAuthStore.getState().setAuth(user, token);
      if (!authResult.success) {
        setError(authResult.error || t('loginFailed'));
        setLoading(false);
        return;
      }

      console.log('✅ Login successful:', user.fullName);
      console.log('✅ User role:', user.role);

      // One-time migration: if profileImage is missing in MongoDB but
      // exists in legacy localStorage, copy it to MongoDB now.
      // Wait for migration to complete before redirecting to prevent
      // navigation before auth state is fully settled.
      try {
        const migratedUser = await migrateLegacyProfileIfNeeded(user, token);
        if (migratedUser) {
          console.log('✅ Profile image migrated — updating store');
          useAuthStore.setState({
            user: migratedUser
          });
        }
      } catch (migrationError) {
        console.warn('⚠️ Profile migration failed (non-blocking):', migrationError);
      }

      if (data.mustChangePassword) {
        setMustChangePassword(true);
        setLoading(false);
        setPassword('');
        return;
      }

      // Get the latest user from store (in case migration updated it)
      const latestUser = useAuthStore.getState().user || user;
      redirectUser(latestUser);
    } catch (error) {
      console.error('Login error:', error);
      setError(t('loginFailed'));
      setLoading(false);
    }
  };

  const handleForceChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess(false);

    const newPassword = e.target.elements.newPassword.value;
    const confirmPassword = e.target.elements.confirmPassword.value;

    if (!newPassword || newPassword.length < 6) {
      setChangePasswordError(t('passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError(t('passwordMismatch'));
      return;
    }

    setChangePasswordLoading(true);

    try {
      const response = await api.put('/api/auth/change-password', {
        currentPassword: password,
        newPassword
      });

      const data = response.data;

      if (!data.success) {
        setChangePasswordError(data.message || t('error'));
        setChangePasswordLoading(false);
        return;
      }

      setChangePasswordSuccess(true);
      setChangePasswordLoading(false);

      setTimeout(() => {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          redirectUser(currentUser);
        } else {
          navigate('/login');
        }
      }, 1500);
    } catch (error) {
      console.error('Force change password error:', error);
      setChangePasswordError(t('error'));
      setChangePasswordLoading(false);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError(t('enterEmail'));
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('enterValidEmail'));
      return;
    }
    
    setIsEmailValid(true);
    setShowPasswordField(true);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError(t('enterBoth'));
      setLoading(false);
      return;
    }

    loginUser(email, password);
  };

  const handleBackToEmail = () => {
    setShowPasswordField(false);
    setIsEmailValid(false);
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-br from-red-100 via-white to-red-50 relative">
      {/* Decorative background elements - clipped to prevent scroll overflow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Radiant decorative background elements */}
        <div className="absolute top-0 left-0 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-br from-red-400/40 via-red-500/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-gradient-to-tl from-gray-900/20 via-red-600/10 to-transparent rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] sm:w-[700px] h-[450px] sm:h-[700px] bg-gradient-to-r from-red-300/10 via-white to-red-400/10 rounded-full blur-3xl"></div>

        {/* Floating sparkle elements */}
        <div className="absolute top-10 right-10 sm:right-20 w-3 h-3 bg-red-500 rounded-full blur-sm animate-ping"></div>
        <div className="absolute bottom-20 left-5 sm:left-10 w-2 h-2 bg-red-400 rounded-full blur-sm animate-ping delay-300"></div>
        <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-red-300 rounded-full blur-md animate-pulse delay-700"></div>
      </div>

      {/* Desktop: Split layout | Mobile: Stacked */}
      <div className="flex flex-col lg:flex-row w-full relative z-10 2xl:flex-1 2xl:min-h-0">
        
        {/* Marketing Panel - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-white/80 backdrop-blur-sm border-r border-gray-200/50 overflow-y-auto">
          <LoginMarketing />
        </div>

        {/* Login Panel */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 2xl:p-16">
          <div className="w-full max-w-lg 2xl:max-w-xl">
            <div className="bg-white dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-red-500/30 p-8 sm:p-10 2xl:p-12 border border-red-200/50 transition-all duration-300 hover:shadow-red-500/40">
          
          {/* Language Selector */}
          <div className="absolute top-4 right-4">
            <div className="relative">
              <button
                onClick={() => setShowLanguages(!showLanguages)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800/90 backdrop-blur-sm border-2 border-red-300 rounded-xl hover:border-red-500 hover:bg-red-50 dark:bg-red-900/30/80 transition-all text-sm shadow-md hover:shadow-red-200"
              >
                <Globe size={15} className="text-red-600" />
               <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">
                  {SUPPORTED_LANGUAGES.find(l => l.code === i18n.language)?.nativeName || t('language')}
                </span>
              </button>
              {showLanguages && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border-2 border-red-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { changeLanguageGlobal(lang.code); setShowLanguages(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:bg-red-900/30 hover:text-red-600 transition text-sm ${
                        i18n.language === lang.code ? 'bg-red-50 font-semibold' : ''
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-gray-700 dark:text-gray-300">{lang.nativeName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logo & Brand - Radiant Red, White, Black */}
          <div className="text-center mb-6 sm:mb-8 pt-2">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-red-400 to-gray-800 rounded-full blur-2xl opacity-70 scale-110 animate-pulse"></div>

              <div className="relative w-20 h-20 sm:w-28 sm:h-28 mx-auto bg-gradient-to-br from-red-500 via-red-600 to-gray-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/40 transform transition-transform hover:scale-105 duration-300 hover:shadow-red-500/60">
                <div className="relative">
                  <Shield size={48} sm:size={64} className="text-white/20 absolute -inset-1" strokeWidth={1.5} />
                  <div className="relative z-10 flex items-center justify-center">
                    <Home size={28} sm:size={36} fill="none" stroke="#ffffff" color="#ffffff" strokeWidth={2} className="drop-shadow-lg" />
                    <Sparkles size={12} sm:size={16} className="text-red-200 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="mt-3 sm:mt-4">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight drop-shadow-sm">
                  <span className="text-red-600">Homely</span><span className="text-emerald-600">Serv</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 tracking-widest uppercase mt-1 font-medium">{t('premiumServices')}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30/90 backdrop-blur-sm border-2 border-red-300 rounded-xl text-red-600 text-sm flex items-center gap-2 animate-shake shadow-md shadow-red-200">
              <AlertCircle size={16} className="text-red-500" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field - Always Visible */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('email')}</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !showPasswordField) {
                      e.preventDefault();
                      handleEmailSubmit(e);
                    }
                  }}
                  className={`w-full pl-11 pr-4 py-3.5 bg-white dark:bg-gray-800/90 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-gray-400 focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_rgba(15,23,42,0.06)] transition-all duration-200 placeholder:text-gray-400 dark:text-gray-500 shadow-sm hover:shadow-md ${
                    showPasswordField ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  placeholder={t('emailPlaceholder')}
                  disabled={showPasswordField}
                  required
                />
                {!showPasswordField && (
                  <button
                    type="button"
                    onClick={handleEmailSubmit}
                    className="absolute right-2 top-2 p-1.5 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg transition-all shadow-md hover:shadow-red-400"
                  >
                    <ArrowRight size={18} />
                  </button>
                )}
                {showPasswordField && (
                  <div className="absolute right-3 top-3.5 text-red-500">
                    <CheckCircle size={18} className="drop-shadow-sm" />
                  </div>
                )}
              </div>
            </div>

            {/* Password Field - Appears After Email */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showPasswordField ? 'max-h-40 opacity-100 mb-2' : 'max-h-0 opacity-0'
            }`}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('password')}</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-white dark:bg-gray-800/90 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-gray-400 focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_rgba(15,23,42,0.06)] transition-all duration-200 placeholder:text-gray-400 dark:text-gray-500 shadow-sm hover:shadow-md"
                  placeholder={t('passwordPlaceholder')}
                  required
                  autoFocus={showPasswordField}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password - Appears After Email */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showPasswordField ? 'max-h-20 opacity-100 mb-4 sm:mb-6' : 'max-h-0 opacity-0'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-red-600 border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-red-400" />
                  {t('rememberMe')}
                </label>
                <Link to="/forgot-password" className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-semibold transition-colors hover:underline">
                  {t('forgotPassword')}
                </Link>
              </div>
            </div>

            {/* Login Button - Appears After Email - Radiant Red to Black gradient */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showPasswordField ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 via-red-600 to-gray-800 text-white py-3 sm:py-3.5 rounded-xl hover:shadow-2xl hover:shadow-red-500/40 transition-all duration-300 font-bold text-base sm:text-lg disabled:opacity-50 flex items-center justify-center gap-2 transform hover:-translate-y-1 hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('loading')}
                  </div>
                ) : (
                  <>
                    {t('signIn')}
                    <LogIn size={18} sm:size={20} />
                  </>
                )}
              </button>
            </div>

            {/* Back to Email Button - Appears After Email */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showPasswordField ? 'max-h-20 opacity-100 mt-3' : 'max-h-0 opacity-0'
            }`}>
              <button
                type="button"
                onClick={handleBackToEmail}
                className="w-full text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-red-600 transition-colors font-medium"
              >
                {t('useDifferentEmail')}
              </button>
            </div>
          </form>

          {/* Force Password Change */}
          {mustChangePassword && (
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 rounded-2xl">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                <Lock size={18} sm:size={20} className="text-yellow-600" />
                {t('changePasswordTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4">
                {t('changePasswordDescription')}
              </p>

              {changePasswordError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl text-red-600 text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle size={14} sm:size={16} className="text-red-500" /> {changePasswordError}
                </div>
              )}

              {changePasswordSuccess && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-xl text-green-600 text-xs sm:text-sm flex items-center gap-2">
                  <CheckCircle size={14} sm:size={16} className="text-green-500" /> {t('passwordChangedSuccess')}
                </div>
              )}

              {!changePasswordSuccess && (
                <form onSubmit={handleForceChangePassword} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('newPasswordLabel')}</label>
                    <div className="relative group">
                      <Lock size={16} sm:size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500 group-focus-within:text-red-500 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="newPassword"
                        className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-white dark:bg-gray-800/90 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200 placeholder:text-gray-400 dark:text-gray-500 shadow-sm hover:shadow-red-100"
                        placeholder={t('newPassword')}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('confirmNewPasswordLabel')}</label>
                    <div className="relative group">
                      <Lock size={16} sm:size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500 group-focus-within:text-red-500 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-white dark:bg-gray-800/90 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200 placeholder:text-gray-400 dark:text-gray-500 shadow-sm hover:shadow-red-100"
                        placeholder={t('confirmPassword')}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={changePasswordLoading}
                    className="w-full bg-gradient-to-r from-red-500 via-red-600 to-gray-800 text-white py-3 sm:py-3.5 rounded-xl hover:shadow-2xl hover:shadow-red-500/40 transition-all duration-300 font-bold text-base sm:text-lg disabled:opacity-50 flex items-center justify-center gap-2 transform hover:-translate-y-1 hover:scale-[1.02]"
                  >
                    {changePasswordLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t('loading')}
                      </div>
                    ) : (
                      <>
                        {t('changePassword')}
                        <CheckCircle size={18} sm:size={20} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Social Login */}
          <div className="mt-4">
            <SocialLogin onLoginSuccess={(user) => {
              console.log('Social login success:', user);
            }} />
          </div>

          {/* Register Link */}
          <p className="text-center text-gray-600 dark:text-gray-300 mt-4 sm:mt-6 text-xs sm:text-sm">
            {t('noAccount')}{' '}
            <Link to="/register" className="text-red-600 font-bold inline-flex items-center px-2 py-1 hover:text-red-700 transition-colors hover:underline hover:underline-offset-2">
              {t('createOne')}
            </Link>
          </p>
        </div>
          </div>
        </div>
      </div>

      <LegalFooter className="relative z-10 mt-6" />

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
        .delay-700 {
          animation-delay: 700ms;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}

export default Login;
