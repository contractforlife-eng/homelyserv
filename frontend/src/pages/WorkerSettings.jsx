// src/pages/WorkerSettings.jsx - COMPREHENSIVE SETTINGS WITH RED THEME + WORKING NOTIFICATIONS AND FIXED TOGGLES
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../components/layout/DashboardContext';
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
  const dashboard = useDashboard();

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
   
   const handleLanguageChange = (langCode) => {
     changeLanguageGlobal(langCode);
     setSettings(prev => ({ ...prev, language: langCode }));
   };

  // ============================================================
  // IS PREMIUM CHECK
  // ============================================================
  const isPremium = () => {
    const userId = authUser?.id || authUser?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const userIsPremium = isPremium();

  const translations = {
    en: {
      title: 'Settings',
      subtitle: 'Manage your account preferences',
      preferences: 'Preferences',
      language: 'Language',
      languageDesc: 'Choose your preferred language',
      darkMode: 'Dark Mode',
      darkModeDesc: 'Switch between light and dark theme',
      notifications: 'Notifications',
      notificationsDesc: 'Enable or disable notifications',
      emailNotifications: 'Email Notifications',
      emailNotificationsDesc: 'Receive updates via email',
      pushNotifications: 'Push Notifications',
      pushNotificationsDesc: 'Receive real-time push notifications',
      smsNotifications: 'SMS Notifications',
      smsNotificationsDesc: 'Receive updates via SMS',
      account: 'Account',
      security: 'Security',
      changePassword: 'Change Password',
      changePasswordDesc: 'Update your account password',
      twoFactorAuth: 'Two-Factor Authentication',
      twoFactorAuthDesc: 'Add an extra layer of security',
      privacy: 'Privacy',
      profileVisibility: 'Profile Visibility',
      profileVisibilityDesc: 'Control who can see your profile',
      showOnlineStatus: 'Show Online Status',
      showOnlineStatusDesc: 'Display your online status to others',
      allowMessages: 'Allow Messages',
      allowMessagesDesc: 'Allow employers to send you messages',
      availableForHire: 'Available for Hire',
      availableForHireDesc: 'Show employers you are available for work',
      general: 'General',
      timezone: 'Timezone',
      timezoneDesc: 'Select your preferred timezone',
      currency: 'Currency',
      currencyDesc: 'Choose your preferred currency',
      dateFormat: 'Date Format',
      dateFormatDesc: 'Select how dates are displayed',
      data: 'Data',
      saveSearchHistory: 'Save Search History',
      saveSearchHistoryDesc: 'Store your search history for quick access',
      showRecommended: 'Show Recommended',
      showRecommendedDesc: 'Display recommended jobs and offers',
      autoSave: 'Auto Save',
      autoSaveDesc: 'Automatically save your preferences',
      deleteAccount: 'Delete Account',
      deleteAccountDesc: 'Permanently delete your account and all data',
      exportData: 'Export Data',
      exportDataDesc: 'Download all your account data',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      cancel: 'Cancel',
      confirm: 'Confirm',
      saveChanges: 'Save Changes',
      saved: 'Settings saved successfully!',
      passwordChanged: 'Password changed successfully!',
      passwordMismatch: 'New passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      wrongPassword: 'Current password is incorrect',
      deleteConfirm: 'Are you sure you want to delete your account?',
      deleteWarning: 'This action cannot be undone. All your data will be permanently deleted.',
      deleteConfirmText: 'Type DELETE to confirm',
      deleteButton: 'Delete Account',
      languageToggle: 'العربية',
      notificationsTitle: 'Notifications',
      public: 'Public',
      private: 'Private',
      contacts: 'Contacts Only',
      premiumBadge: 'Premium Verified',
      getPremium: 'Get Premium',
      noNotifications: 'No new notifications'
    },
    ar: {
      title: 'الإعدادات',
      subtitle: 'إدارة تفضيلات حسابك',
      preferences: 'التفضيلات',
      language: 'اللغة',
      languageDesc: 'اختر لغتك المفضلة',
      darkMode: 'الوضع الداكن',
      darkModeDesc: 'التبديل بين الوضع الفاتح والداكن',
      notifications: 'الإشعارات',
      notificationsDesc: 'تفعيل أو تعطيل الإشعارات',
      emailNotifications: 'الإشعارات البريدية',
      emailNotificationsDesc: 'تلقي التحديثات عبر البريد الإلكتروني',
      pushNotifications: 'إشعارات فورية',
      pushNotificationsDesc: 'تلقي إشعارات فورية في الوقت الحقيقي',
      smsNotifications: 'إشعارات SMS',
      smsNotificationsDesc: 'تلقي التحديثات عبر الرسائل القصيرة',
      account: 'الحساب',
      security: 'الأمان',
      changePassword: 'تغيير كلمة المرور',
      changePasswordDesc: 'تحديث كلمة مرور حسابك',
      twoFactorAuth: 'المصادقة الثنائية',
      twoFactorAuthDesc: 'إضافة طبقة إضافية من الأمان',
      privacy: 'الخصوصية',
      profileVisibility: 'رؤية الملف الشخصي',
      profileVisibilityDesc: 'التحكم في من يمكنه رؤية ملفك الشخصي',
      showOnlineStatus: 'إظهار الحالة',
      showOnlineStatusDesc: 'عرض حالتك للآخرين',
      allowMessages: 'السماح بالرسائل',
      allowMessagesDesc: 'السماح لأصحاب العمل بإرسال رسائل لك',
      availableForHire: 'متاح للتوظيف',
      availableForHireDesc: 'إظهار لأصحاب العمل أنك متاح للعمل',
      general: 'عام',
      timezone: 'المنطقة الزمنية',
      timezoneDesc: 'اختر منطقتك الزمنية المفضلة',
      currency: 'العملة',
      currencyDesc: 'اختر عملتك المفضلة',
      dateFormat: 'تنسيق التاريخ',
      dateFormatDesc: 'اختر كيفية عرض التواريخ',
      data: 'البيانات',
      saveSearchHistory: 'حفظ سجل البحث',
      saveSearchHistoryDesc: 'تخزين سجل البحث للوصول السريع',
      showRecommended: 'إظهار الموصى بهم',
      showRecommendedDesc: 'عرض الوظائف والعروض الموصى بها',
      autoSave: 'حفظ تلقائي',
      autoSaveDesc: 'حفظ تفضيلاتك تلقائياً',
      deleteAccount: 'حذف الحساب',
      deleteAccountDesc: 'حذف حسابك وجميع بياناتك بشكل دائم',
      exportData: 'تصدير البيانات',
      exportDataDesc: 'تحميل جميع بيانات حسابك',
      currentPassword: 'كلمة المرور الحالية',
      newPassword: 'كلمة المرور الجديدة',
      confirmPassword: 'تأكيد كلمة المرور',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      saveChanges: 'حفظ التغييرات',
      saved: 'تم حفظ الإعدادات بنجاح!',
      passwordChanged: 'تم تغيير كلمة المرور بنجاح!',
      passwordMismatch: 'كلمات المرور الجديدة غير متطابقة',
      passwordTooShort: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
      wrongPassword: 'كلمة المرور الحالية غير صحيحة',
      deleteConfirm: 'هل أنت متأكد من رغبتك في حذف حسابك؟',
      deleteWarning: 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع بياناتك بشكل دائم.',
      deleteConfirmText: 'اكتب DELETE للتأكيد',
      deleteButton: 'حذف الحساب',
      languageToggle: 'English',
      notificationsTitle: 'الإشعارات',
      public: 'عام',
      private: 'خاص',
      contacts: 'جهات الاتصال فقط',
      premiumBadge: 'مميز معتمد',
      getPremium: 'اشتراك مميز',
      noNotifications: 'لا توجد إشعارات جديدة'
    }
  };

  const { i18n } = useTranslation();
  const t = translations[dashboard.language] || translations.en;

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
    
    const settingsToSave = { ...settings };

    try {
      const result = await updateSettings(settingsToSave);
      
      if (result.success) {
        localStorage.setItem('worker_settings', JSON.stringify(settingsToSave));
        setSaving(false);
        setSaveSuccess(true);
        
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      localStorage.setItem('worker_settings', JSON.stringify(settingsToSave));
      setSaving(false);
      setSaveSuccess(true);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // ===== Password Change Functionality =====
  const handlePasswordChange = async () => {
    setPasswordError('');
    
    if (!passwordData.currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError(t.passwordTooShort);
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t.passwordMismatch);
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
        throw new Error(response.data.message || t.wrongPassword);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || t.wrongPassword);
    }
  };

  // ===== Delete Account Functionality =====
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }
    
    try {
      const response = await api.delete('/api/auth/account');

      if (response.data.success) {
        localStorage.removeItem('worker_settings');
        alert('Account deleted successfully');
        logout();
        navigate('/login');
      } else {
        throw new Error(response.data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account. Please try again.');
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
      alert('Failed to export data. Please try again.');
    }
  };

  const userProfileImage = authUser?.profileImage || null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-6">Please login to view your settings</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout requiredRole="WORKER">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={userIsPremium}
      />

      <div className="p-4 md:p-6">
        {/* Page Header - RED THEME */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 mb-6 text-white">
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-red-100 mt-1">{t.subtitle}</p>
          </div>
        </div>

        {/* Save Success Message */}
        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <CheckCircle size={16} />
            {t.saved}
          </div>
        )}

        {/* Settings Container */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          {/* Preferences */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.preferences}</h3>
            <div className="space-y-4">
              {/* Language */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.language}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.languageDesc}</p>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="px-4 py-2 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.nativeName}</option>
                  ))}
                </select>
              </div>

              {/* Dark Mode - uses global theme store */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.darkMode}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.darkModeDesc}</p>
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
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.autoSave}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.autoSaveDesc}</p>
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
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.general}</h3>
            <div className="space-y-4">
              {/* Timezone */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.timezone}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.timezoneDesc}</p>
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
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.currency}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.currencyDesc}</p>
                </div>
                <select
                  value={settings.currency}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                  className="px-4 py-2 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="EGP">EGP - Egyptian Pound</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="AED">AED - UAE Dirham</option>
                </select>
              </div>

              {/* Date Format */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.dateFormat}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.dateFormatDesc}</p>
                </div>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                  className="px-4 py-2 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD Month YYYY">DD Month YYYY</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.notificationsTitle}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.notifications}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.notificationsDesc}</p>
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
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.emailNotifications}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.emailNotificationsDesc}</p>
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
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.pushNotifications}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.pushNotificationsDesc}</p>
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
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.smsNotifications}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.smsNotificationsDesc}</p>
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
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.privacy}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.profileVisibility}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.profileVisibilityDesc}</p>
                </div>
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                  className="px-4 py-2 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="public">{t.public}</option>
                  <option value="private">{t.private}</option>
                  <option value="contacts">{t.contacts}</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.showOnlineStatus}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.showOnlineStatusDesc}</p>
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
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.allowMessages}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.allowMessagesDesc}</p>
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
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.availableForHire}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.availableForHireDesc}</p>
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
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.security}</h3>
            <div className="space-y-4">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between p-4 rounded-lg transition bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <div className="flex items-center gap-3">
                  <Lock size={20} className="text-red-600" />
                  <div className="text-left">
                    <p className="font-medium">{t.changePassword}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.changePasswordDesc}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
              </button>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.twoFactorAuth}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.twoFactorAuthDesc}</p>
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
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.data}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.saveSearchHistory}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.saveSearchHistoryDesc}</p>
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
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.showRecommended}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.showRecommendedDesc}</p>
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
                    <p className="font-medium">{t.exportData}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.exportDataDesc}</p>
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
                    <p className="font-medium">{t.deleteAccount}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.deleteAccountDesc}</p>
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
              {saving ? 'Saving...' : t.saveChanges}
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.changePassword}</h3>
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
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{t.passwordChanged}</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.currentPassword}
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter current password"
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
                      {t.newPassword}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter new password (min 6 characters)"
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
                      {t.confirmPassword}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Confirm new password"
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
                    {t.cancel}
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    className="flex-1 px-4 py-2.5 bg-red-600 rounded-lg font-medium text-white hover:bg-red-700 transition"
                  >
                    {t.confirm}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-600">{t.deleteAccount}</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500 dark:text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-center py-4">
              <Trash2 size={48} className="text-red-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{t.deleteConfirm}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t.deleteWarning}</p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.deleteConfirmText}
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-2.5 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Type DELETE"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 px-4 py-2.5 bg-red-600 rounded-lg font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {t.deleteButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WorkerSettings;