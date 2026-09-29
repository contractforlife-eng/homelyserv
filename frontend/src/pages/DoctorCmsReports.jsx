// frontend/src/pages/DoctorCmsReports.jsx
// ============================================================
// CLINIC MANAGEMENT SYSTEM — REPORTS
// Real activity for the doctor's clinic. Two EXISTING endpoints only:
//   - GET /api/doctors/dashboard/summary — operational counters with an
//     OPTIONAL ?from=&to= activity range (no Premium gate)
//   - GET /api/doctors/analytics/performance — Premium metric set and
//     the daily activity chart
// No invented statistics, no second analytics backend. Every count is
// scoped to the authenticated doctor by the backend (req.userId); the
// page never sends a doctorId.
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import CmsStatCard from '../components/doctor/cms/CmsStatCard';
import api from '../utils/api';
import {
  BarChart3, Calendar, Users, FileText, Pill, Tag, Crown,
  AlertCircle, Loader2, TrendingUp, Hourglass, CheckCircle2,
  XCircle, RefreshCw, Pencil, Building2, Home, Video
} from 'lucide-react';

// Simple preset ranges — native Date only, no date library. Boundaries
// are browser-local calendar days (the same wall-clock the appointment
// screens display); the backend filters appointments by `startsAt`.
const PERIODS = [
  { id: 'all', labelKey: 'periodAllTime' },
  { id: 'today', labelKey: 'periodToday' },
  { id: '7d', labelKey: 'periodLast7' },
  { id: '30d', labelKey: 'last30Days' },
  { id: 'month', labelKey: 'periodThisMonth' }
];

const presetRange = (period) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  switch (period) {
    case 'today':
      return { from: startOfDay, to: endOfDay };
    case '7d': {
      const from = new Date(startOfDay);
      from.setDate(from.getDate() - 6);
      return { from, to: endOfDay };
    }
    case '30d': {
      const from = new Date(startOfDay);
      from.setDate(from.getDate() - 29);
      return { from, to: endOfDay };
    }
    case 'month':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      };
    default:
      return {};
  }
};

// Module-scope section card (never remounts state — presentational only).
const SectionCard = ({ title, icon: Icon, children }) => (
  <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      {Icon ? <Icon size={16} className="text-red-500" /> : null}
      {title}
    </h3>
    {children}
  </section>
);

const SectionLoader = ({ label }) => (
  <div className="py-8 flex flex-col items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin text-red-600" />
    {label ? <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{label}</p> : null}
  </div>
);

const DoctorCmsReports = () => {
  const { t } = useTranslation();

  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsPremiumRequired, setAnalyticsPremiumRequired] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [summaryError, setSummaryError] = useState('');
  // Period filter for the activity counters ('all' = no range, the
  // endpoint's original all-time behaviour).
  const [period, setPeriod] = useState('all');

  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      setSummaryError('');
      const range = presetRange(period);
      const res = await api.get('/api/doctors/dashboard/summary', {
        params: {
          ...(range.from ? { from: range.from.toISOString() } : {}),
          ...(range.to ? { to: range.to.toISOString() } : {})
        }
      });
      setSummary(res.data?.summary || null);
    } catch (err) {
      setSummaryError(err.response?.data?.message || t('doctorCms.reportsLoadError') || 'Failed to load report metrics.');
    } finally {
      setSummaryLoading(false);
    }
  }, [t, period]);

  const loadAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsPremiumRequired(false);
      setAnalyticsError('');
      const res = await api.get('/api/doctors/analytics/performance');
      setAnalytics(res.data?.analytics || null);
    } catch (err) {
      if (err.response?.status === 403) {
        setAnalyticsPremiumRequired(true);
      } else {
        setAnalyticsError(err.response?.data?.message || t('doctorCms.reportsLoadError') || 'Failed to load report metrics.');
      }
    } finally {
      setAnalyticsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadSummary();
    loadAnalytics();
  }, [loadSummary, loadAnalytics]);

  const premiumMetrics = [
    { key: 'APPOINTMENTS_REQUESTED', label: t('doctorCms.metricRequests') || 'Appointment Requests', icon: Calendar },
    { key: 'APPOINTMENTS_CONFIRMED', label: t('doctorCms.metricConfirmed') || 'Confirmed Appointments', icon: CheckCircle2 },
    { key: 'APPOINTMENTS_COMPLETED', label: t('doctorCms.metricCompleted') || 'Completed Appointments', icon: CheckCircle2 },
    { key: 'PATIENTS_SERVED', label: t('doctorCms.metricPatients') || 'Patients Served', icon: Users },
    { key: 'CONSULTATIONS_SIGNED', label: t('doctorCms.metricSigned') || 'Signed Consultations', icon: FileText },
    { key: 'PRESCRIPTIONS_ISSUED', label: t('doctorCms.metricPrescriptions') || 'Prescriptions Issued', icon: Pill },
    { key: 'SERVICES_ACTIVE', label: t('doctorCms.metricServices') || 'Active Services', icon: Tag }
  ];

  const statusCounters = [
    { key: 'total', label: t('doctorCms.reportsTotal') || 'Total', icon: BarChart3, color: 'text-red-600 bg-red-50 dark:bg-red-950/40' },
    { key: 'pending', label: t('doctorCms.statusPending') || 'Pending', icon: Hourglass, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
    { key: 'confirmed', label: t('doctorCms.statusConfirmed') || 'Confirmed', icon: Calendar, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { key: 'completed', label: t('doctorCms.statusCompleted') || 'Completed', icon: CheckCircle2, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    { key: 'cancelled', label: t('doctorCms.statusCancelled') || 'Cancelled', icon: XCircle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
    { key: 'noShow', label: t('doctorCms.statusNoShow') || 'No-show', icon: AlertCircle, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40' }
  ];

  const typeCounters = [
    { key: 'CLINIC', label: t('doctorSchedule.types.CLINIC') || 'Clinic Consultation', icon: Building2, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
    { key: 'HOME_VISIT', label: t('doctorSchedule.types.HOME_VISIT') || 'Home Visit', icon: Home, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { key: 'ONLINE', label: t('doctorSchedule.types.ONLINE') || 'Online Consultation', icon: Video, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' }
  ];

  const consultationCounters = [
    { key: 'total', label: t('doctorCms.reportsTotal') || 'Total', icon: FileText, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
    { key: 'drafts', label: t('doctorCms.draftConsultations') || 'Drafts', icon: Pencil, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
    { key: 'signed', label: t('doctorCms.signedConsultations') || 'Signed Consultations', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { key: 'amended', label: t('doctorCms.amendedConsultations') || 'Amended Consultations', icon: RefreshCw, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40' }
  ];

  const patientCounters = [
    { key: 'homelyServ', label: t('doctorCms.homelyservPatientsTitle') || 'HomelyServ Patients', icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    { key: 'clinicPatients', label: t('doctorCms.clinicPatientsTitle') || 'Clinic Patients', icon: Building2, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
    { key: 'combined', label: t('doctorCms.combinedPatients') || 'Combined Patients', icon: Users, color: 'text-red-600 bg-red-50 dark:bg-red-950/40' }
  ];

  const resourceCounters = [
    { key: 'activeServices', label: t('doctorCms.activeServices') || 'Active Services', icon: Tag, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
    { key: 'activeClinics', label: t('doctorCms.activeClinics') || 'Active Clinics', icon: Building2, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' }
  ];

  const dailyActivity = Array.isArray(analytics?.dailyActivity) ? analytics.dailyActivity : [];
  const maxDaily = Math.max(1, ...dailyActivity.map((day) => Math.max(day.confirmed || 0, day.completed || 0)));

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <DashboardHeader title={t('doctorCms.reportsTitle') || 'Reports'} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <RolePageHeader
          icon={BarChart3}
          title={t('doctorCms.reportsTitle') || 'Reports'}
          subtitle={t('doctorCms.reportsSubtitle') || 'Real activity from your clinic: appointments, patients, consultations, and prescriptions.'}
        />

        {/* Activity period filter (native presets, no date library) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide me-1">
            {t('doctorCms.reportsPeriod') || 'Period'}
          </span>
          {PERIODS.map(({ id, labelKey }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPeriod(id)}
              aria-pressed={period === id}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                period === id
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {t(`doctorCms.${labelKey}`) || labelKey}
            </button>
          ))}
        </div>

        {summaryError ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{summaryError}</p>
          </div>
        ) : null}

        {/* Operational counters (existing dashboard endpoint, no Premium gate).
            Hidden on error so failed requests never render misleading zeros. */}
        {!summaryError ? (
          <>
            <SectionCard title={t('doctorCms.appointmentsByStatus') || 'Appointments by Status'} icon={Calendar}>
              {summaryLoading ? (
                <SectionLoader label={t('doctorCms.loading')} />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {statusCounters.map((counter) => (
                    <CmsStatCard
                      key={counter.key}
                      icon={counter.icon}
                      label={counter.label}
                      value={summary?.appointments?.[counter.key] ?? 0}
                      color={counter.color}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title={t('doctorCms.appointmentsByType') || 'Appointments by Consultation Type'} icon={Tag}>
              {summaryLoading ? (
                <SectionLoader label={t('doctorCms.loading')} />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeCounters.map((counter) => (
                    <CmsStatCard
                      key={counter.key}
                      icon={counter.icon}
                      label={counter.label}
                      value={summary?.appointments?.byConsultationType?.[counter.key] ?? 0}
                      color={counter.color}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title={t('doctorCms.consultationsTitle') || 'Consultations'} icon={FileText}>
              {summaryLoading ? (
                <SectionLoader label={t('doctorCms.loading')} />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {consultationCounters.map((counter) => (
                    <CmsStatCard
                      key={counter.key}
                      icon={counter.icon}
                      label={counter.label}
                      value={summary?.consultations?.[counter.key] ?? 0}
                      color={counter.color}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title={t('doctorCms.patientsTitle') || 'Patients'} icon={Users}>
              {summaryLoading ? (
                <SectionLoader label={t('doctorCms.loading')} />
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {patientCounters.map((counter) => (
                      <CmsStatCard
                        key={counter.key}
                        icon={counter.icon}
                        label={counter.label}
                        value={summary?.patientBreakdown?.[counter.key] ?? 0}
                        color={counter.color}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    {t('doctorCms.patientsAllTimeNote') || 'Patient totals are all-time and are not affected by the period filter.'}
                  </p>
                </>
              )}
            </SectionCard>

            <SectionCard title={t('doctorCms.clinicResources') || 'Clinic Resources'} icon={Building2}>
              {summaryLoading ? (
                <SectionLoader label={t('doctorCms.loading')} />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {resourceCounters.map((counter) => (
                    <CmsStatCard
                      key={counter.key}
                      icon={counter.icon}
                      label={counter.label}
                      value={summary?.[counter.key] ?? 0}
                      color={counter.color}
                    />
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        ) : null}

        {/* Premium metric set (existing analytics endpoint) */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-red-500" />
              {t('doctorCms.last30Days') || 'Last 30 days'}
            </h3>
            <Link to="/doctor-premium" className="text-xs font-medium text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
              <Crown size={12} />
              {t('doctorNav.premium') || 'Premium'}
            </Link>
          </div>

          {analyticsLoading ? (
            <div className="py-10 flex flex-col items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-red-600 mb-2" />
              <p className="text-sm text-gray-500">{t('doctorCms.loading') || 'Loading clinic operations...'}</p>
            </div>
          ) : analyticsPremiumRequired ? (
            <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center">
              <Crown className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t('doctorCms.reportsPremiumRequired') || 'Upgrade to Doctor Premium to unlock Profile Performance analytics.'}
              </p>
              <Link
                to="/doctor-premium"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold shadow-sm hover:from-amber-600 hover:to-amber-700 transition-all"
              >
                <Crown size={16} />
                {t('doctorCms.premiumSubscribe') || 'Subscribe'}
              </Link>
            </div>
          ) : analyticsError ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-700 dark:text-rose-300">
              {analyticsError}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {premiumMetrics.map(({ key, label, icon }) => (
                <CmsStatCard
                  key={key}
                  icon={icon}
                  label={label}
                  value={analytics?.metrics?.[key] ?? 0}
                  color="text-red-600 bg-red-50 dark:bg-red-950/40"
                />
              ))}
            </div>
          )}
        </section>


        {/* Daily activity chart (real appointment counts, Premium metric set) */}
        {!analyticsLoading && !analyticsPremiumRequired && !analyticsError && dailyActivity.length > 0 ? (
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('doctorCms.dailyActivity') || 'Daily Activity (last 30 days)'}
              </h3>
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />
                  {t('doctorCms.statusConfirmed') || 'Confirmed'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                  {t('doctorCms.statusCompleted') || 'Completed'}
                </span>
              </div>
            </div>
            <div className="flex items-end gap-[3px] h-28">
              {dailyActivity.map((day) => (
                <div
                  key={day.day}
                  className="flex-1 flex flex-col justify-end gap-[2px] min-w-0"
                  title={`${day.day}: ${day.confirmed || 0} / ${day.completed || 0}`}
                >
                  <div
                    className="bg-emerald-500 rounded-t-sm"
                    style={{ height: `${((day.completed || 0) / maxDaily) * 100}%`, minHeight: day.completed ? '3px' : 0 }}
                  />
                  <div
                    className="bg-blue-500 rounded-t-sm"
                    style={{ height: `${((day.confirmed || 0) / maxDaily) * 100}%`, minHeight: day.confirmed ? '3px' : 0 }}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default DoctorCmsReports;

