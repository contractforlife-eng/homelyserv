// Support Settings Page - Account settings for support staff
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import SupportLayout from '../../layouts/SupportLayout';
import ActionMenuPortal from '../../components/common/ActionMenuPortal';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguageGlobal, LANGUAGE_STORAGE_KEY } from '../../i18n';
import {
  User as UserIcon,
  Mail,
  Shield,
  Globe,
  Moon,
  Sun,
  Lock,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import api from '../../utils/api';

const SupportSettings = () => {
  const navigate = useNavigate();
  const { t: i18nT, i18n } = useTranslation();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);
  const theme = useThemeStore(state => state.theme);
  const toggleTheme = useThemeStore(state => state.toggleTheme);
  const isDark = theme === 'dark';

  // Language synced with the global i18n instance (single source of truth)
  const [language, setLanguage] = useState(() => i18n.language || localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notification, setNotification] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const t = i18nT('supportSettingsPage', { returnObjects: true });

  const getRoleLabel = (role) =>
    t.roleLabels[String(role || '').toUpperCase()] || t.roleLabels.USER;

  // Auth check
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'SUPPORT' && authUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
  }, [authUser, isAuthenticated, authLoading, navigate]);

  // Keep local language in sync whenever i18n changes (from any page)
  useEffect(() => {
    const onLanguageChanged = (lng) => setLanguage(lng);
    i18n.on('languageChanged', onLanguageChanged);
    return () => i18n.off('languageChanged', onLanguageChanged);
  }, [i18n]);

  // Update document direction
  useEffect(() => {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Language change handler removed - using global LanguageSwitcher in header

  const toggleDarkMode = () => {
    toggleTheme();
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setNotification({ type: 'error', text: t.passwordMismatch });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setNotification({ type: 'error', text: t.passwordLength });
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await api.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data?.success) {
        setNotification({ type: 'success', text: t.passwordChanged });
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setNotification({ type: 'error', text: response.data?.message || t.passwordChangeFailed });
      }
    } catch (error) {
      setNotification({ type: 'error', text: error.response?.data?.message || t.passwordChangeFailed });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getProfileImage = () => {
    return authUser?.profileImage || authUser?.image || null;
  };

  return (
    <SupportLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Shield size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-white/80 mt-1">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 ${
            notification.type === 'error'
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-green-500/10 border border-green-500/30 text-green-400'
          }`}>
            {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            {notification.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserIcon size={20} className="text-green-600" />
                {t.accountInfo}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {getProfileImage() ? (
                    <img src={getProfileImage()} alt={authUser?.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={32} className="text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.name}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{authUser?.fullName || t.supportRole}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail size={18} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.email}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{authUser?.email || 'support@homelyserv.com'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield size={18} className="text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.role}</p>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <Shield size={12} />
                    {getRoleLabel(authUser?.role)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Globe size={20} className="text-green-600" />
                {t.preferences}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Language selector removed - using global LanguageSwitcher in header */}

              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.darkMode}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.darkModeDesc}</p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  aria-label={isDark ? t.darkModeEnabled : t.darkModeDisabled}
                  aria-pressed={isDark}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                    isDark ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 flex items-center justify-center ${
                    isDark ? 'right-1' : 'left-1'
                  }`}>
                    {isDark ? <Moon size={10} className="text-green-600" /> : <Sun size={10} className="text-yellow-500" />}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock size={20} className="text-green-600" />
              {t.security}
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.changePassword}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.changePasswordDesc}</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2"
              >
                <Lock size={16} />
                {t.changePassword}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90dvh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Lock size={20} className="text-green-600" />
                {t.changePassword}
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                aria-label={t.close}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.currentPassword}</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.newPassword}</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.confirmPassword}</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {passwordLoading ? t.changing : t.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SupportLayout>
  );
};

export default SupportSettings;
