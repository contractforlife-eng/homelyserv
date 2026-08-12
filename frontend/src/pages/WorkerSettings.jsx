// src/pages/WorkerSettings.jsx - COMPREHENSIVE SETTINGS WITH RED THEME + WORKING NOTIFICATIONS AND FIXED TOGGLES
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import hireService from '../services/hireService';
import { getNotifications } from '../utils/notificationService';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguageGlobal, LANGUAGE_STORAGE_KEY } from '../i18n';
import {
  User,
  Briefcase,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  X,
  AlertTriangle,
  Shield,
  Lock,
  Save,
  RefreshCw,
  CreditCard,
  Crown,
  CheckCircle,
  UserCog,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  Smartphone,
  MailCheck,
  AlertOctagon,
  Archive,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Clock,
  DollarSign,
  Percent,
  Users as UsersIcon,
  Building,
  Star,
  Award,
  Zap,
  Activity,
  PieChart,
  LineChart,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Moon,
  Sun,
  Database,
  Server,
  Mail,
  FileText,
  Search,
  FileCheck,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

// Main WorkerSettings Component - COMPREHENSIVE WITH RED THEME + WORKING NOTIFICATIONS
const WorkerSettings = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const logout = useAuthStore(state => state.logout);
  const updateSettings = useAuthStore(state => state.updateSettings);
  const theme = useThemeStore(state => state.theme);
  const toggleTheme = useThemeStore(state => state.toggleTheme);
  const isDark = theme === 'dark';
   
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    twoFactorAuth: false,
    autoSave: true,
    language: 'en',
    timezone: 'UTC+2',
    currency: 'EGP',
    dateFormat: 'DD/MM/YYYY',
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowMessages: true,
    availableForHire: true,
    showRecommended: true,
    saveSearchHistory: true
  });

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ============================================================
   // TOGGLE FUNCTIONS
   // ============================================================

  // ============================================================
  // IS PREMIUM CHECK
  // ============================================================
  const isPremium = () => {
    const userId = authUser?.id || authUser?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const userIsPremium = isPremium();

  const { t } = useTranslation();

useEffect(() => {
     // Load saved settings from backend
    const loadSettings = async () => {
      try {
        const response = await api.get('/api/auth/settings');
        if (response.data.success) {
          setSettings(prev => ({ ...prev, ...response.data.settings }));
        }
      } catch (error) {
        console.error('Error loading settings from backend:', error);
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('worker_settings');
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings);
            setSettings(prev => ({ ...prev, ...parsedSettings }));
          } catch (e) {
            console.error('Error parsing settings:', e);
          }
        }
      }
    };
    
    loadSettings();
  }, []);

useEffect(() => {
     if (authLoading) return;

     if (!isAuthenticated || !authUser) {
       return;
     }

     if (authUser.role !== 'WORKER') {
       return;
     }

     // Load saved settings
     const savedSettings = localStorage.getItem('worker_settings');
     if (savedSettings) {
       try {
         const parsedSettings = JSON.parse(savedSettings);
         setSettings(prev => ({ ...prev, ...parsedSettings }));
       } catch (e) {
         console.error('Error parsing settings:', e);
      }
    }
   }, [authUser, isAuthenticated, authLoading]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const settingsToSave = { ...settings };

    try {
      const result = await updateSettings(settingsToSave);

      if (result.success) {
        // Only mirror to localStorage after a confirmed backend save
        localStorage.setItem('worker_settings', JSON.stringify(settingsToSave));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(result.error || t('employerSettings.errorSaving'));
      }
    } catch (error) {
      // Never show success here — surface the failure to the user
      console.error('Error saving settings:', error);
      setSaveError(error.message || t('employerSettings.errorSaving'));
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // ===== Password Change Functionality =====
  const handlePasswordChange = async () => {
    setPasswordError('');
    
    if (!passwordData.currentPassword) {
      setPasswordError(t('employerSettings.currentPasswordRequired'));
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError(t('employerSettings.passwordTooShort'));
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t('employerSettings.passwordMismatch'));
      return;
    }
    
    try {
      const response = await api.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        setPasswordSuccess(true);
        setTimeout(() => {
          setPasswordSuccess(false);
          setShowPasswordModal(false);
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }, 2000);
      } else {
        throw new Error(response.data.message || t('employerSettings.wrongPassword'));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || t('employerSettings.wrongPassword'));
    }
  };

  // ===== Delete Account Functionality =====
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert(t('workerSettings.deleteTypeRequired'));
      return;
    }
    
    try {
      const response = await api.delete('/api/auth/account');

      if (response.data.success) {
        localStorage.removeItem('worker_settings');
        alert(t('workerSettings.accountDeleted'));
        logout();
        navigate('/login');
      } else {
        throw new Error(response.data.message || t('workerSettings.deleteFailed'));
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(t('workerSettings.deleteFailedRetry'));
    }
  };

  // ===== Export Data Functionality =====
  const handleExportData = async () => {
    try {
      const workerId = authUser?.id || authUser?.email;
      
      // Get conversations from backend
      let conversations = [];
      let messages = {};
      try {
        const convsResponse = await api.get(`/api/chat/conversations/${workerId}`);
        if (convsResponse.data.success) {
          conversations = convsResponse.data.conversations || [];
        }
      } catch (error) {
        console.error('Error loading conversations for export:', error);
      }
      
      // Get messages for each conversation
      for (const conv of conversations) {
        try {
          const msgsResponse = await api.get(`/api/chat/messages/${conv.id}`);
          if (msgsResponse.data.success) {
            messages[conv.id] = msgsResponse.data.messages || [];
          }
        } catch (error) {
          console.error('Error loading messages for export:', error);
        }
      }
      
      let offers = [];
      try {
        const offersData = await hireService.getOffers();
        offers = offersData.offers || offersData || [];
      } catch (error) {
        console.error('Error loading offers for export:', error);
      }
      const workerOffers = offers.filter(o => o.workerEmail === authUser.email);

      const data = {
        user: authUser,
        settings: settings,
        offers: workerOffers,
        conversations: conversations,
        messages: messages,
        complaints: JSON.parse(localStorage.getItem('worker_complaints') || '[]'),
        payments: JSON.parse(localStorage.getItem('worker_payments') || '[]'),
        savedJobs: JSON.parse(localStorage.getItem('worker_saved_offers') || '[]'),
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `worker_data_${authUser.email}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert(t('workerSettings.exportFailed'));
    }
  };

  const userProfileImage = authUser?.profileImage || null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('employerSettings.loading')}</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-6">{t('workerSettings.loginRequired')}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition-all"
          >
            {t('workerSettings.goToLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout requiredRole="WORKER">
      <DashboardHeader
        title={t('employerSettings.title')}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={userIsPremium}
      />

      <div className="p-4 md:p-6">
        {/* Page Header - RED THEME */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 mb-6 text-white">
          <div>
            <h1 className="text-2xl font-bold">{t('employerSettings.title')}</h1>
            <p className="text-red-100 mt-1">{t('employerSettings.subtitle')}</p>
          </div>
        </div>

        {/* Save Success Message */}
        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <CheckCircle size={16} />
            {t('employerSettings.saved')}
          </div>
        )}

        {/* Save Error Message */}
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {saveError}
          </div>
        )}

        {/* Settings Container */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          {/* Preferences */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('employerSettings.preferences')}</h3>
            <div className="space-y-4">
              {/* Language selector removed - using global LanguageSwitcher in header */}

              {/* Dark Mode - uses global theme store */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.darkMode')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.darkModeDesc')}</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative w-12 h-6 rounded-full transition ${
                    isDark ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full transition ${
                      isDark ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Save */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.autoSave')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.autoSaveDesc')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('autoSave', !settings.autoSave)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.autoSave ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full transition ${
                      settings.autoSave ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* General */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('employerSettings.general')}</h3>
            <div className="space-y-4">
              {/* Timezone */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.timezone')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.timezoneDesc')}</p>
                </div>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  className="px-4 py-2 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="UTC-12">UTC-12</option>
                  <option value="UTC-11">UTC-11</option>
                  <option value="UTC-10">UTC-10</option>
                  <option value="UTC-9">UTC-9</option>
                  <option value="UTC-8">UTC-8</option>
                  <option value="UTC-7">UTC-7</option>
                  <option value="UTC-6">UTC-6</option>
                  <option value="UTC-5">UTC-5</option>
                  <option value="UTC-4">UTC-4</option>
                  <option value="UTC-3">UTC-3</option>
                  <option value="UTC-2">UTC-2</option>
                  <option value="UTC-1">UTC-1</option>
                  <option value="UTC+0">UTC+0</option>
                  <option value="UTC+1">UTC+1</option>
                  <option value="UTC+2">UTC+2</option>
                  <option value="UTC+3">UTC+3</option>
                  <option value="UTC+4">UTC+4</option>
                  <option value="UTC+5">UTC+5</option>
                  <option value="UTC+6">UTC+6</option>
                  <option value="UTC+7">UTC+7</option>
                  <option value="UTC+8">UTC+8</option>
                  <option value="UTC+9">UTC+9</option>
                  <option value="UTC+10">UTC+10</option>
                  <option value="UTC+11">UTC+11</option>
                  <option value="UTC+12">UTC+12</option>
                </select>
              </div>

              {/* Currency */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.currency')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.currencyDesc')}</p>
                </div>
                <select
                  value={settings.currency}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                  className="px-4 py-2 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="EGP">{t('employerSettings.currencyOptions.egp')}</option>
                  <option value="USD">{t('employerSettings.currencyOptions.usd')}</option>
                  <option value="EUR">{t('employerSettings.currencyOptions.eur')}</option>
                  <option value="GBP">{t('employerSettings.currencyOptions.gbp')}</option>
                  <option value="SAR">{t('employerSettings.currencyOptions.sar')}</option>
                  <option value="AED">{t('employerSettings.currencyOptions.aed')}</option>
                </select>
              </div>

              {/* Date Format */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.dateFormat')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.dateFormatDesc')}</p>
                </div>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                  className="px-4 py-2 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD Month YYYY">{t('employerSettings.dateFormatLong')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('employerSettings.notificationsTitle')}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.notifications')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.notificationsDesc')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('notifications', !settings.notifications)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.notifications ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full transition ${
                      settings.notifications ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.emailNotifications')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.emailNotificationsDesc')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.emailNotifications ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full transition ${
                      settings.emailNotifications ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.pushNotifications')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.pushNotificationsDesc')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.pushNotifications ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full transition ${
                      settings.pushNotifications ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.smsNotifications')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.smsNotificationsDesc')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('smsNotifications', !settings.smsNotifications)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.smsNotifications ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full transition ${
                      settings.smsNotifications ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('employerSettings.privacy')}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.profileVisibility')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.profileVisibilityDesc')}</p>
                </div>
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                  className="px-4 py-2 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="public">{t('employerSettings.public')}</option>
                  <option value="private">{t('employerSettings.private')}</option>
                  <option value="contacts">{t('employerSettings.contacts')}</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.showOnlineStatus')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.showOnlineStatusDesc')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('showOnlineStatus', !settings.showOnlineStatus)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.showOnlineStatus ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full transition ${
                      settings.showOnlineStatus ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.allowMessages')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('workerSettings.allowMessagesDesc')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('allowMessages', !settings.allowMessages)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.allowMessages ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full transition ${
                      settings.allowMessages ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('workerSettings.availableForHire')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('workerSettings.availableForHireDesc')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('availableForHire', !settings.availableForHire)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.availableForHire ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full transition ${
                      settings.availableForHire ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('employerSettings.security')}</h3>
            <div className="space-y-4">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between p-4 rounded-lg transition bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <div className="flex items-center gap-3">
                  <Lock size={20} className="text-red-600" />
                  <div className="text-left">
                    <p className="font-medium">{t('employerSettings.changePassword')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.changePasswordDesc')}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
              </button>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.twoFactorAuth')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.twoFactorAuthDesc')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('twoFactorAuth', !settings.twoFactorAuth)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.twoFactorAuth ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full transition ${
                      settings.twoFactorAuth ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Data */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('employerSettings.data')}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.saveSearchHistory')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.saveSearchHistoryDesc')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('saveSearchHistory', !settings.saveSearchHistory)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.saveSearchHistory ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full transition ${
                      settings.saveSearchHistory ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t('employerSettings.showRecommended')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('workerSettings.showRecommendedDesc')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('showRecommended', !settings.showRecommended)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.showRecommended ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full transition ${
                      settings.showRecommended ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-between p-4 rounded-lg transition bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <div className="flex items-center gap-3">
                  <Download size={20} className="text-red-600" />
                  <div className="text-left">
                    <p className="font-medium">{t('employerSettings.exportData')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.exportDataDesc')}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-between p-4 rounded-lg transition bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400"
              >
                <div className="flex items-center gap-3">
                  <Trash2 size={20} className="text-red-500" />
                  <div className="text-left">
                    <p className="font-medium">{t('employerSettings.deleteAccount')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('employerSettings.deleteAccountDesc')}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50`}
            >
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? t('employerSettings.saving') : t('employerSettings.saveChanges')}
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('employerSettings.changePassword')}</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500 dark:text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="text-center py-6">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{t('employerSettings.passwordChanged')}</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('employerSettings.currentPassword')}
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder={t('employerSettings.currentPasswordPlaceholder')}
                      />
                      <button
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('employerSettings.newPassword')}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder={t('employerSettings.newPasswordPlaceholder')}
                      />
                      <button
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('employerSettings.confirmPassword')}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder={t('employerSettings.confirmPasswordPlaceholder')}
                      />
                      <button
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {passwordError && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {passwordError}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    {t('employerSettings.cancel')}
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    className="flex-1 px-4 py-2.5 bg-red-600 rounded-lg font-medium text-white hover:bg-red-700 transition"
                  >
                    {t('employerSettings.confirm')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-xl font-bold text-red-600">{t('employerSettings.deleteAccount')}</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500 dark:text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-center py-4">
              <Trash2 size={48} className="text-red-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{t('employerSettings.deleteConfirm')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('employerSettings.deleteWarning')}</p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('employerSettings.deleteConfirmText')}
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-2.5 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder={t('workerSettings.deletePlaceholder')}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                {t('employerSettings.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 px-4 py-2.5 bg-red-600 rounded-lg font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {t('employerSettings.deleteButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WorkerSettings;
