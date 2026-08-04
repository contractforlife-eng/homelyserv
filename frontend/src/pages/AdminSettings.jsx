// src/pages/AdminSettings.jsx - MIGRATED TO DASHBOARD LAYOUT
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguageGlobal, LANGUAGE_STORAGE_KEY } from '../i18n';
import api from '../utils/api';
import {
  Home,
  Users,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  Globe,
  X,
  CreditCard,
  Save,
  Shield,
  Lock,
  Bell as BellIcon,
  Moon,
  Sun,
  RefreshCw,
  User as UserIcon,
  Database,
  Server,
  Mail,
  AlertTriangle,
  Briefcase,
  BarChart3,
  FileCheck,
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
  HelpCircle,
  Crown,
  UserPlus
} from 'lucide-react';

// ============================================================
// TOGGLE SWITCH COMPONENT
// ============================================================
const ToggleSwitch = ({ value, onChange, disabled = false }) => {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
        value ? 'bg-yellow-500' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-yellow-500/20'}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full transition-all duration-300 ${
          value ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  );
};

// ============================================================
// MAIN ADMIN SETTINGS COMPONENT
// ============================================================
const AdminSettings = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState(null);

  // Settings state
  const [settings, setSettings] = useState({
    // General
    siteName: 'HomelyServ',
    siteDescription: 'Find trusted home service workers',
    contactEmail: 'support@homelyserv.com',
    contactPhone: '+20 123 456 789',
    address: 'Cairo, Egypt',
    
    // Appearance
    darkMode: false,
    primaryColor: '#fbbf24',
    secondaryColor: '#1a1a1a',
    language: 'en',
    
    // Notifications
    systemNotifications: true,
    emailNotifications: true,
    pushNotifications: false,
    complaintNotifications: true,
    paymentNotifications: true,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    requireEmailVerification: true,
    requirePhoneVerification: false,
    
    // Payment
    currency: 'EGP',
    commissionRate: 6.5,
    minWithdrawal: 100,
    maxWithdrawal: 50000,
    paymentMethods: ['credit_card', 'bank_transfer', 'cash'],
    
    // User Management
    allowRegistration: true,
    requireApproval: false,
    maxUsersPerIp: 10,
    autoSuspendAfter: 30,
    
    // System
    debugMode: false,
    maintenanceMode: false,
    cacheEnabled: true,
    backupSchedule: 'daily'
  });

  const translations = {
    en: {
      title: 'Settings',
      subtitle: 'Manage your admin preferences',
      tabs: {
        general: 'General',
        appearance: 'Appearance',
        notifications: 'Notifications',
        security: 'Security',
        payment: 'Payment',
        users: 'Users',
        system: 'System'
      },
      general: {
        title: 'General Settings',
        siteName: 'Site Name',
        siteDescription: 'Site Description',
        contactEmail: 'Contact Email',
        contactPhone: 'Contact Phone',
        address: 'Address'
      },
      appearance: {
        title: 'Appearance Settings',
        darkMode: 'Dark Mode',
        primaryColor: 'Primary Color',
        secondaryColor: 'Secondary Color',
        language: 'Language'
      },
      notifications: {
        title: 'Notification Settings',
        systemNotifications: 'System Notifications',
        emailNotifications: 'Email Notifications',
        pushNotifications: 'Push Notifications',
        complaintNotifications: 'Complaint Notifications',
        paymentNotifications: 'Payment Notifications'
      },
      security: {
        title: 'Security Settings',
        twoFactorAuth: 'Two-Factor Authentication',
        sessionTimeout: 'Session Timeout (minutes)',
        maxLoginAttempts: 'Max Login Attempts',
        requireEmailVerification: 'Require Email Verification',
        requirePhoneVerification: 'Require Phone Verification',
        changePassword: 'Change Password'
      },
      payment: {
        title: 'Payment Settings',
        currency: 'Currency',
        commissionRate: 'Commission Rate (%)',
        minWithdrawal: 'Minimum Withdrawal',
        maxWithdrawal: 'Maximum Withdrawal',
        paymentMethods: 'Payment Methods'
      },
      users: {
        title: 'User Management',
        allowRegistration: 'Allow New Registrations',
        requireApproval: 'Require Admin Approval',
        maxUsersPerIp: 'Max Users per IP',
        autoSuspendAfter: 'Auto-Suspend After (days)'
      },
      system: {
        title: 'System Settings',
        debugMode: 'Debug Mode',
        maintenanceMode: 'Maintenance Mode',
        cacheEnabled: 'Enable Cache',
        backupSchedule: 'Backup Schedule',
        clearCache: 'Clear Cache',
        backupData: 'Backup Data',
        restoreData: 'Restore Data'
      },
      actions: {
        save: 'Save Changes',
        saving: 'Saving...',
        saved: 'Settings saved successfully!',
        cancel: 'Cancel',
        confirm: 'Confirm',
        changePassword: 'Change Password',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        passwordMismatch: 'Passwords do not match',
        passwordLength: 'Password must be at least 8 characters',
        passwordChanged: 'Password changed successfully!'
      },
      languageToggle: 'العربية'
    },
    ar: {
      title: 'الإعدادات',
      subtitle: 'إدارة تفضيلات المشرف',
      tabs: {
        general: 'عام',
        appearance: 'المظهر',
        notifications: 'الإشعارات',
        security: 'الأمان',
        payment: 'الدفع',
        users: 'المستخدمين',
        system: 'النظام'
      },
      general: {
        title: 'الإعدادات العامة',
        siteName: 'اسم الموقع',
        siteDescription: 'وصف الموقع',
        contactEmail: 'البريد الإلكتروني للتواصل',
        contactPhone: 'هاتف التواصل',
        address: 'العنوان'
      },
      appearance: {
        title: 'إعدادات المظهر',
        darkMode: 'الوضع الداكن',
        primaryColor: 'اللون الأساسي',
        secondaryColor: 'اللون الثانوي',
        language: 'اللغة'
      },
      notifications: {
        title: 'إعدادات الإشعارات',
        systemNotifications: 'إشعارات النظام',
        emailNotifications: 'الإشعارات البريدية',
        pushNotifications: 'إشعارات الدفع',
        complaintNotifications: 'إشعارات الشكاوى',
        paymentNotifications: 'إشعارات الدفع'
      },
      security: {
        title: 'إعدادات الأمان',
        twoFactorAuth: 'المصادقة الثنائية',
        sessionTimeout: 'انتهاء الجلسة (دقائق)',
        maxLoginAttempts: 'الحد الأقصى لمحاولات تسجيل الدخول',
        requireEmailVerification: 'طلب التحقق من البريد الإلكتروني',
        requirePhoneVerification: 'طلب التحقق من الهاتف',
        changePassword: 'تغيير كلمة المرور'
      },
      payment: {
        title: 'إعدادات الدفع',
        currency: 'العملة',
        commissionRate: 'نسبة العمولة (%)',
        minWithdrawal: 'الحد الأدنى للسحب',
        maxWithdrawal: 'الحد الأقصى للسحب',
        paymentMethods: 'طرق الدفع'
      },
      users: {
        title: 'إدارة المستخدمين',
        allowRegistration: 'السماح بالتسجيل الجديد',
        requireApproval: 'طلب موافقة المشرف',
        maxUsersPerIp: 'الحد الأقصى للمستخدمين لكل IP',
        autoSuspendAfter: 'التعليق التلقائي بعد (أيام)'
      },
      system: {
        title: 'إعدادات النظام',
        debugMode: 'وضع التصحيح',
        maintenanceMode: 'وضع الصيانة',
        cacheEnabled: 'تفعيل التخزين المؤقت',
        backupSchedule: 'جدول النسخ الاحتياطي',
        clearCache: 'مسح التخزين المؤقت',
        backupData: 'نسخ احتياطي للبيانات',
        restoreData: 'استعادة البيانات'
      },
      actions: {
        save: 'حفظ التغييرات',
        saving: 'جاري الحفظ...',
        saved: 'تم حفظ الإعدادات بنجاح!',
        cancel: 'إلغاء',
        confirm: 'تأكيد',
        changePassword: 'تغيير كلمة المرور',
        currentPassword: 'كلمة المرور الحالية',
        newPassword: 'كلمة المرور الجديدة',
        confirmPassword: 'تأكيد كلمة المرور',
        passwordMismatch: 'كلمات المرور غير متطابقة',
        passwordLength: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل',
        passwordChanged: 'تم تغيير كلمة المرور بنجاح!'
      },
      languageToggle: 'English'
    }
  };

  const t = translations[language] || translations.en;

  // Use authStore as single source of truth
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) || i18n.language || 'en';
    setLanguage(savedLang);
    setSettings(prev => ({ ...prev, language: savedLang }));

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }

    // Load saved settings from backend
    const loadSettings = async () => {
      try {
        const response = await api.get('/api/admin/settings');
        if (response.data.success) {
          setSettings(prev => ({ ...prev, ...response.data.settings }));
        }
      } catch (error) {
        console.error('Error loading settings from backend:', error);
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('admin_settings');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            setSettings(prev => ({ ...prev, ...parsed }));
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
      navigate('/login');
      return;
    }

    if (authUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    setUser(authUser);
  }, [authUser, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Auto-hide notification messages
  useEffect(() => {
    if (notificationMessage) {
      const timer = setTimeout(() => {
        setNotificationMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationMessage]);

  const handleLanguageChange = (langCode) => {
    changeLanguageGlobal(langCode);
    setLanguage(langCode);
    setSettings(prev => ({ ...prev, language: langCode }));
    setShowLangDropdown(false);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    changeLanguageGlobal(newLang);
    setLanguage(newLang);
    setSettings(prev => ({ ...prev, language: newLang }));
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
  };

  // Theme store integration (same as WorkerSettings and SupportSettings)
  const theme = useThemeStore(state => state.theme);
  const toggleTheme = useThemeStore(state => state.toggleTheme);
  const isDark = theme === 'dark';

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const response = await api.put('/api/admin/settings', {
        settings: settings
      });

      if (response.data.success) {
        localStorage.setItem('admin_settings', JSON.stringify(settings));
        setSaving(false);
        setSaveMessage(t.actions.saved);
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaving(false);
      setSaveMessage('Failed to save settings. Please try again.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setNotificationMessage({ type: 'error', text: t.actions.passwordMismatch });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setNotificationMessage({ type: 'error', text: t.actions.passwordLength });
      return;
    }
    try {
      const response = await api.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        setNotificationMessage({ type: 'success', text: t.actions.passwordChanged });
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setNotificationMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
    }
  };

  const handleBackup = () => {
    setBackupInProgress(true);
    setTimeout(() => {
      const data = {
        users: [],
        payments: [],
        offers: [],
        complaints: {
          employer: [],
          worker: []
        },
        settings: settings,
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `homelyserv_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setBackupInProgress(false);
      setNotificationMessage({ type: 'success', text: 'Backup completed successfully!' });
    }, 1500);
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear all cache? This action cannot be undone.')) {
      localStorage.removeItem('homelyserv_cached_data');
      setNotificationMessage({ type: 'success', text: 'Cache cleared successfully!' });
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleChange = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      credit_card: 'Credit Card',
      bank_transfer: 'Bank Transfer',
      cash: 'Cash',
      paypal: 'PayPal',
      stripe: 'Stripe'
    };
    return labels[method] || method;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 dark:text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout requiredRole="ADMIN" variant="admin">
      <DashboardHeader
        title={t.title}
        language={language}
        onToggleLanguage={toggleLanguage}
        notificationUserId={user?.id || user?.email}
        isPremium={false}
        variant="admin"
      />

      <div className="p-4 md:p-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">{t.title}</h1>
            <p className="text-black/70 mt-1">{t.subtitle}</p>
          </div>
        </div>

        {/* Notification Messages */}
        {notificationMessage && (
          <div className={`mb-4 px-4 py-3 rounded-lg ${
            notificationMessage.type === 'error' 
              ? 'bg-red-500/20 border border-red-500 text-red-400' 
              : 'bg-green-500/20 border border-green-500 text-green-400'
          }`}>
            {notificationMessage.text}
          </div>
        )}

        {saveMessage && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/20 border border-green-500 text-green-400">
            {saveMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 border-b border-yellow-500/20 pb-2">
          {['general', 'appearance', 'notifications', 'security', 'payment', 'users', 'system'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition rounded-lg ${
                activeTab === tab
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10'
              }`}
            >
              {t.tabs[tab]}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
          {activeTab === 'general' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t.general.title}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">{t.general.siteName}</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange('siteName', e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">{t.general.siteDescription}</label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">{t.general.contactEmail}</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">{t.general.contactPhone}</label>
                  <input
                    type="text"
                    value={settings.contactPhone}
                    onChange={(e) => handleSettingChange('contactPhone', e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">{t.general.address}</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => handleSettingChange('address', e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t.appearance.title}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300 dark:text-gray-300">{t.appearance.darkMode}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Enable dark mode theme</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                      isDark ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 flex items-center justify-center ${
                      isDark ? 'right-1' : 'left-1'
                    }`}>
                      {isDark ? <Moon size={10} className="text-yellow-500" /> : <Sun size={10} className="text-yellow-500" />}
                    </div>
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">{t.appearance.language}</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowLangDropdown(!showLangDropdown)}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-left flex items-center justify-between hover:border-yellow-500/50 transition"
                    >
                      <span className="text-white">
                        {SUPPORTED_LANGUAGES.find(l => l.code === language)?.nativeName || 'English'}
                      </span>
                      <Globe size={18} className="text-gray-400 dark:text-gray-500" />
                    </button>
                    {showLangDropdown && (
                      <div className="absolute right-0 mt-2 w-44 bg-[#1a1a1a] border border-yellow-500/20 rounded-lg shadow-lg z-50 overflow-hidden">
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-yellow-500/10 transition text-sm ${
                              language === lang.code ? 'bg-yellow-500/10 font-semibold text-yellow-500' : 'text-gray-300'
                            }`}
                          >
                            <span className="text-lg">{lang.flag}</span>
                            <span>{lang.nativeName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t.notifications.title}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{t.notifications.systemNotifications}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Receive system notifications</p>
                  </div>
                  <ToggleSwitch
                    value={settings.systemNotifications}
                    onChange={(value) => handleToggleChange('systemNotifications')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{t.notifications.emailNotifications}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Receive email notifications</p>
                  </div>
                  <ToggleSwitch
                    value={settings.emailNotifications}
                    onChange={(value) => handleToggleChange('emailNotifications')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{t.notifications.pushNotifications}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Receive push notifications</p>
                  </div>
                  <ToggleSwitch
                    value={settings.pushNotifications}
                    onChange={(value) => handleToggleChange('pushNotifications')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{t.notifications.complaintNotifications}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Get notified about new complaints</p>
                  </div>
                  <ToggleSwitch
                    value={settings.complaintNotifications}
                    onChange={(value) => handleToggleChange('complaintNotifications')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{t.notifications.paymentNotifications}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Get notified about payments</p>
                  </div>
                  <ToggleSwitch
                    value={settings.paymentNotifications}
                    onChange={(value) => handleToggleChange('paymentNotifications')}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t.security.title}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{t.security.twoFactorAuth}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Enable two-factor authentication</p>
                  </div>
                  <ToggleSwitch
                    value={settings.twoFactorAuth}
                    onChange={(value) => handleToggleChange('twoFactorAuth')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{t.security.requireEmailVerification}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Require email verification for new users</p>
                  </div>
                  <ToggleSwitch
                    value={settings.requireEmailVerification}
                    onChange={(value) => handleToggleChange('requireEmailVerification')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">{t.security.sessionTimeout}</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">{t.security.maxLoginAttempts}</label>
                  <input
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>
                <div className="pt-4 border-t border-yellow-500/20">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition flex items-center gap-2"
                  >
                    <Lock size={16} />
                    {t.actions.changePassword}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t.payment.title}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">{t.payment.currency}</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleSettingChange('currency', e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  >
                    <option value="EGP">EGP - Egyptian Pound</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">{t.payment.commissionRate}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.commissionRate}
                    onChange={(e) => handleSettingChange('commissionRate', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">{t.payment.minWithdrawal}</label>
                  <input
                    type="number"
                    value={settings.minWithdrawal}
                    onChange={(e) => handleSettingChange('minWithdrawal', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">{t.payment.maxWithdrawal}</label>
                  <input
                    type="number"
                    value={settings.maxWithdrawal}
                    onChange={(e) => handleSettingChange('maxWithdrawal', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t.users.title}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{t.users.allowRegistration}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Allow new user registrations</p>
                  </div>
                  <ToggleSwitch
                    value={settings.allowRegistration}
                    onChange={(value) => handleToggleChange('allowRegistration')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{t.users.requireApproval}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Require admin approval for new users</p>
                  </div>
                  <ToggleSwitch
                    value={settings.requireApproval}
                    onChange={(value) => handleToggleChange('requireApproval')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">{t.users.maxUsersPerIp}</label>
                  <input
                    type="number"
                    value={settings.maxUsersPerIp}
                    onChange={(e) => handleSettingChange('maxUsersPerIp', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">{t.users.autoSuspendAfter}</label>
                  <input
                    type="number"
                    value={settings.autoSuspendAfter}
                    onChange={(e) => handleSettingChange('autoSuspendAfter', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t.system.title}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{t.system.debugMode}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Enable debug mode</p>
                  </div>
                  <ToggleSwitch
                    value={settings.debugMode}
                    onChange={(value) => handleToggleChange('debugMode')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{t.system.maintenanceMode}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Enable maintenance mode</p>
                  </div>
                  <ToggleSwitch
                    value={settings.maintenanceMode}
                    onChange={(value) => handleToggleChange('maintenanceMode')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{t.system.cacheEnabled}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Enable system cache</p>
                  </div>
                  <ToggleSwitch
                    value={settings.cacheEnabled}
                    onChange={(value) => handleToggleChange('cacheEnabled')}
                  />
                </div>
                <div className="pt-4 border-t border-yellow-500/20">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleClearCache}
                      className="px-4 py-2 border border-yellow-500/20 text-gray-300 rounded-lg hover:bg-yellow-500/10 transition flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      {t.system.clearCache}
                    </button>
                    <button
                      onClick={handleBackup}
                      disabled={backupInProgress}
                      className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <Download size={16} />
                      {backupInProgress ? 'Backing up...' : t.system.backupData}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition flex items-center gap-2 disabled:opacity-50 font-medium"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                {t.actions.saving}
              </>
            ) : (
              <>
                <Save size={18} />
                {t.actions.save}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-yellow-500/20 w-full max-w-md">
            <div className="p-6 border-b border-yellow-500/20 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Lock size={20} className="text-yellow-500" />
                {t.actions.changePassword}
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg hover:bg-yellow-500/10 transition text-gray-400 dark:text-gray-500 hover:text-yellow-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t.actions.currentPassword}</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t.actions.newPassword}</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t.actions.confirmPassword}</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                />
              </div>
            </div>

            <div className="p-6 border-t border-yellow-500/20 flex justify-end gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition text-sm font-medium"
              >
                {t.actions.cancel}
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition text-sm font-medium flex items-center gap-2"
              >
                <Key size={16} />
                {t.actions.changePassword}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminSettings;