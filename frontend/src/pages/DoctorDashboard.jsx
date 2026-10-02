// frontend/src/pages/DoctorDashboard.jsx
// ============================================================
// DOCTOR DASHBOARD
// Real backend summary data only (no invented statistics).
// Every card navigates to a real, completed module. The
// Trust & Verification + profile content remains ONLY on the
// Doctor Profile page (single navigation path preserved).
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useDashboard } from '../components/layout/DashboardContext';
import { isUserPremium } from '../utils/subscriptionService';
import api from '../utils/api';
import {
  User, Calendar, Users, Clock, Building2, FileText, Pill, Tag,
  MessageCircle, Crown, Settings, ArrowRight, Sparkles, Loader2,
  AlertCircle, CheckCircle2, Hourglass, Wallet
} from 'lucide-react';

const DoctorDashboardContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const dashboard = useDashboard();
  const userId = authUser?.id || authUser?._id;
  const isPremium = (dashboard.premiumStatus?.known === true && dashboard.premiumStatus?.isPremium === true)
    || (userId ? isUserPremium(userId) : false)
    || authUser?.isPremium === true;

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Browser-local calendar-day boundaries for TODAY — the same wall-clock the
  // appointment screens display and the exact convention DoctorCmsReports
  // already uses in `presetRange('today')`. No date library, and deliberately
  // NOT the server clock, `dayKeyOf`, `User.settings.timezone` or
  // `DoctorClinic.timezone`: the doctor sees their own today.
  const todayRange = useMemo(() => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    };
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      // ?from/?to scope ONLY the new summary.today block (and the pre-existing
      // activity range the Reports screen already uses). The all-time fields
      // — summary.patients and summary.patientBreakdown — stay all-time.
      const query = `?from=${encodeURIComponent(todayRange.from.toISOString())}`
        + `&to=${encodeURIComponent(todayRange.to.toISOString())}`;
      const res = await api.get(`/api/doctors/dashboard/summary${query}`);
      setSummary(res.data?.summary || null);
    } catch (err) {
      setLoadError(err.response?.data?.message || t('doctorDashboard.summaryLoadError') || 'Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  }, [t, todayRange]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // The three operational cards are TODAY-scoped. Their fallback is a plain 0
  // on purpose: falling back to the all-time `summary.appointments.*` values
  // would silently render lifetime totals as if they were today's.
  const statCards = summary ? [
    {
      id: 'pending', icon: Hourglass, value: summary.today?.appointments?.pending ?? 0,
      label: t('doctorDashboard.statPending') || 'Pending Requests', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
      path: '/doctor-appointments'
    },
    {
      id: 'confirmed', icon: Calendar, value: summary.today?.appointments?.confirmed ?? 0,
      label: t('doctorDashboard.statConfirmed') || 'Confirmed', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      path: '/doctor-appointments'
    },
    {
      id: 'patients', icon: Users, value: summary.today?.uniquePatients ?? 0,
      // Explicit "Today" wording: this card counts patients with activity
      // TODAY, not the doctor's all-time patient roster. Localised like every
      // other label — never hardcoded in JSX.
      label: t('doctorDashboard.statPatientsToday') || 'Patients Today',
      color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20',
      path: '/doctor-patients'
    },
    {
      // Unread Messages is an inbox backlog, NOT daily work — it deliberately
      // stays all-time.
      id: 'unread', icon: MessageCircle, value: summary.unreadMessages ?? 0,
      label: t('doctorDashboard.statUnread') || 'Unread Messages', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
      path: '/doctor-messages'
    }
  ] : [];

  const moduleCards = [
    {
      id: 'profile', icon: User, color: 'text-red-600 bg-red-50 dark:bg-red-900/20',
      title: t('doctorNav.myProfile') || 'My Profile',
      desc: t('doctorDashboard.profileDesc') || 'Specialty, credentials, fees, and verification.',
      path: '/doctor-profile'
    },
    {
      id: 'appointments', icon: Calendar, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      title: t('doctorNav.appointments') || 'Appointments',
      desc: t('doctorDashboard.appointmentsDesc') || 'Manage upcoming clinic consultations and home visit requests.',
      path: '/doctor-appointments'
    },
    {
      id: 'patients', icon: Users, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20',
      title: t('doctorNav.patients') || 'Patients',
      desc: t('doctorDashboard.patientsDesc') || 'View patient medical histories, clinical records, and consultations.',
      path: '/doctor-patients'
    },
    {
      id: 'schedule', icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
      title: t('doctorNav.schedule') || 'Schedule',
      desc: t('doctorDashboard.scheduleDesc') || 'Configure daily clinic availability, consultation slots, and holidays.',
      path: '/doctor-schedule'
    },
    {
      id: 'clinics', icon: Building2, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
      title: t('doctorNav.clinics') || 'Clinics',
      desc: t('doctorDashboard.clinicsDesc') || 'Manage clinic locations, reception details, and physical addresses.',
      path: '/doctor-clinics'
    },
    {
      id: 'messages', icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
      title: t('doctorNav.messages') || 'Messages',
      desc: t('doctorDashboard.messagesDesc') || 'Direct clinical communication and secure messages with patients.',
      path: '/doctor-messages'
    },
    {
      id: 'settings', icon: Settings, color: 'text-slate-600 bg-slate-50 dark:bg-slate-900/20',
      title: t('doctorNav.settings') || 'Settings',
      desc: t('doctorDashboard.settingsDesc') || 'Appearance, language, and notification preferences.',
      path: '/doctor-settings'
    },
    {
      // Existing, fully-functional module (sidebar entry + /doctor-cms/accounts
      // route already live). Pure navigation — no API call, no statistic.
      id: 'accounts', icon: Wallet, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
      title: t('doctorNav.accounts') || 'Accounts',
      desc: t('doctorDashboard.accountsDesc') || 'Track income, expenses, staff, and clinic finances.',
      path: '/doctor-cms/accounts'
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <DashboardHeader title={t('doctorDashboard.headerTitle') || 'Doctor Dashboard'} />

      {/* Welcome Doctor Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles size={14} />
              {t('doctorDashboard.professionalPortalBadge') || 'Doctor Portal'}
            </div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${isPremium ? 'text-[#F5C542]' : ''}`}>
              {t('doctorDashboard.welcomeTitle', { name: authUser?.fullName || 'Doctor' }) || `Welcome, Dr. ${authUser?.fullName || ''}`}
            </h1>
            <p className="mt-1 text-red-100 text-sm max-w-xl">
              {t('doctorDashboard.welcomeSubtitle') || 'Manage your medical specialty, credentials, and practice information. Complete your profile to get ready for consultations.'}
            </p>
          </div>

          <Link
            to="/doctor-profile"
            className="inline-flex items-center justify-center gap-2 bg-white text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
          >
            <User size={18} />
            {t('doctorDashboard.manageProfileBtn') || 'Manage Profile'}
            <ArrowRight size={16} className="rtl:rotate-180" />
          </Link>
        </div>
      </div>

      {/* Real summary stats (backend-derived) */}
      {loading ? (
        <div className="py-10 flex flex-col items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-red-600 mb-2" />
          <p className="text-sm text-gray-500">{t('doctorDashboard.loadingSummary') || 'Loading your practice summary...'}</p>
        </div>
      ) : loadError ? (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{loadError}</p>
        </div>
      ) : (
        statCards.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => navigate(card.path)}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm text-start hover:border-red-300 dark:hover:border-red-700 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                    <Icon size={20} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
                </button>
              );
            })}
          </div>
        )
      )}

      {/* Module grid (all live modules) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {t('doctorDashboard.practiceModulesTitle') || 'Clinical Practice Modules'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {moduleCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                to={card.path}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm flex flex-col justify-between transition-colors hover:border-red-300 dark:hover:border-red-700 hover:bg-gray-50 dark:hover:bg-gray-700/40"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                      {t('doctorDashboard.moduleActive') || 'Active'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base">{card.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{card.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs font-medium text-red-600 dark:text-red-400">
                  <span>{t('doctorDashboard.openModuleBtn') || 'Open module'}</span>
                  <ArrowRight size={14} className="rtl:rotate-180" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const DoctorDashboard = () => (
  <DashboardLayout requiredRole="DOCTOR">
    <DoctorDashboardContent />
  </DashboardLayout>
);

export default DoctorDashboard;
