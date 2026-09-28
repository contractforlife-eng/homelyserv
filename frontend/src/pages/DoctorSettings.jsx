// src/pages/DoctorSettings.jsx
// ============================================================
// DOCTOR SETTINGS (Doctor module)
// Every control here is functional and persisted through the
// EXISTING application architecture:
//   - Appearance (dark mode)  -> global themeStore (zustand persist)
//   - Language                -> global i18n (six languages, RTL for ar)
//   - Notification prefs      -> GET/PUT /api/notifications/settings
//   - Account / Security      -> existing account & verification pages
// No fake toggles.
// ============================================================
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import useThemeStore from '../store/themeStore';
import { SUPPORTED_LANGUAGES, changeLanguageGlobal } from '../i18n';
import api from '../utils/api';
import {
  Sun, Moon, Globe, Bell, CheckCircle2, AlertCircle, Loader2,
  Shield, Crown, ChevronRight, Languages, Monitor
} from 'lucide-react';

const DoctorSettings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Global theme store (same mechanism as Worker/Employer/Admin/Support settings)
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const isDark = theme === 'dark';

  const currentLanguage = i18n.language || 'en';
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load persisted notification preferences (existing backend architecture)
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/notifications/settings');
        setNotificationSettings(res.data?.settings || null);
      } catch (err) {
        setNotificationSettings({
          newMessage: true, hireResponse: true, complaintUpdate: true,
          paymentConfirmation: true, systemUpdate: false, promotional: false
        });
      } finally {
        setSettingsLoading(false);
      }
    })();
  }, []);

  const handleToggleNotification = async (key) => {
    if (!notificationSettings) return;
    const next = { ...notificationSettings, [key]: !notificationSettings[key] };
    setNotificationSettings(next);
    setSavingSettings(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const res = await api.put('/api/notifications/settings', { settings: next });
      setNotificationSettings(res.data?.settings || next);
      setSuccessMessage(t('doctorSettings.saved') || 'Settings saved.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setNotificationSettings(notificationSettings); // revert on failure
      setErrorMessage(err.response?.data?.message || t('doctorSettings.saveError') || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const notificationRows = [
    { key: 'newMessage', label: t('doctorSettings.notifNewMessage') || 'New messages' },
    { key: 'hireResponse', label: t('doctorSettings.notifAppointments') || 'Appointment updates' },
    { key: 'paymentConfirmation', label: t('doctorSettings.notifPayments') || 'Payment confirmations' },
    { key: 'complaintUpdate', label: t('doctorSettings.notifComplaints') || 'Complaint updates' },
    { key: 'systemUpdate', label: t('doctorSettings.notifSystem') || 'System updates' }
  ];

  const appearanceOptions = [
    { id: 'light', icon: Sun, label: t('doctorSettings.themeLight') || 'Light' },
    { id: 'dark', icon: Moon, label: t('doctorSettings.themeDark') || 'Dark' }
  ];

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <DashboardHeader title={t('doctorSettings.pageTitle') || 'Settings'} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4" /> {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4" /> {errorMessage}
          </div>
        )}

        {/* ============ Appearance ============ */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            <Monitor className="w-4 h-4 text-red-500" />
            {t('doctorSettings.appearance') || 'Appearance'}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {t('doctorSettings.appearanceDesc') || 'Choose how HomelyServ looks. Dark mode applies across the entire Doctor portal and is remembered on this device.'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {appearanceOptions.map((option) => {
              const Icon = option.icon;
              const selected = isDark === (option.id === 'dark');
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                    selected
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${option.id === 'dark' ? 'text-indigo-500' : 'text-amber-500'}`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{option.label}</span>
                  {selected && <CheckCircle2 className="w-4 h-4 text-red-500 ms-auto" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* ============ Language ============ */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            <Languages className="w-4 h-4 text-red-500" />
            {t('doctorSettings.language') || 'Language'}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {t('doctorSettings.languageDesc') || 'The app interface language. Arabic uses right-to-left layout automatically.'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguageGlobal(lang.code)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                  currentLanguage === lang.code
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-semibold'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span>{lang.nativeName || lang.name}</span>
                {currentLanguage === lang.code && <CheckCircle2 className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </section>

        {/* ============ Notification preferences ============ */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-red-500" />
            {t('doctorSettings.notifications') || 'Notification Preferences'}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {t('doctorSettings.notificationsDesc') || 'Choose which in-app notifications you receive. Preferences are saved to your account.'}
          </p>
          {settingsLoading ? (
            <div className="py-6 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-red-500 mx-auto" />
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {notificationRows.map((row) => (
                <div key={row.key} className="py-3.5 flex items-center justify-between gap-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{row.label}</p>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!notificationSettings?.[row.key]}
                    disabled={savingSettings}
                    onClick={() => handleToggleNotification(row.key)}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                      notificationSettings?.[row.key] ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                        notificationSettings?.[row.key] ? 'left-[1.375rem]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ============ Account & Security ============ */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-red-500" />
            {t('doctorSettings.accountSecurity') || 'Account & Security'}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {t('doctorSettings.accountDesc') || 'Profile credentials, verification status, and premium are managed in their dedicated modules.'}
          </p>
          <div className="space-y-2">
            {[
              { icon: Shield, label: t('doctorNav.myProfile') || 'My Profile', desc: t('doctorSettings.accountProfileDesc') || 'Credentials, licenses, and fees', path: '/doctor-profile' },
              { icon: Crown, label: t('doctorCenter.tabPremium') || 'Doctor Premium', desc: t('doctorSettings.accountPremiumDesc') || 'Subscription status and plans', path: '/doctor-center' }
            ].map((row) => {
              const Icon = row.icon;
              return (
                <button
                  key={row.path + row.label}
                  type="button"
                  onClick={() => navigate(row.path)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors text-start"
                >
                  <Icon className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{row.label}</span>
                    <span className="block text-xs text-gray-500">{row.desc}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 rtl:rotate-180" />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default DoctorSettings;
