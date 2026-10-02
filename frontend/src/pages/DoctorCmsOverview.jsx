// frontend/src/pages/DoctorCmsOverview.jsx
// ============================================================
// CLINIC MANAGEMENT SYSTEM — OVERVIEW
// The doctor's operational home inside the CMS. It is intentionally
// different from the general Doctor Dashboard: it focuses on clinic
// operations (today's and upcoming activity, pending requests,
// recent patients, consultation & prescription activity, clinic
// information, quick clinic actions).
//
// Every value comes from existing Doctor backend endpoints. No
// invented numbers, no duplicated medical data, no new backend.
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import CmsStatCard from '../components/doctor/cms/CmsStatCard';
import api from '../utils/api';
import { getDisplayName } from '../utils/userDisplay';
import {
  LayoutGrid, Calendar, Users, FileText, Pill, Building2, Tag, Clock,
  BarChart3, Crown, AlertCircle, Loader2, ArrowRight, Hourglass
} from 'lucide-react';

const localeFor = (language) => (language === 'ar' ? 'ar-EG' : 'en-US');

const formatDateTime = (value, language) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(localeFor(language), {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const formatDate = (value, language) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(localeFor(language), { year: 'numeric', month: 'short', day: 'numeric' });
};

const isSameDay = (value, reference) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === reference.getFullYear()
    && date.getMonth() === reference.getMonth()
    && date.getDate() === reference.getDate();
};

const STATUS_PILLS = {
  PENDING: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  CONFIRMED: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  COMPLETED: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  CANCELLED: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  NO_SHOW: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
};

const STATUS_LABEL_KEYS = {
  PENDING: 'statusPending',
  CONFIRMED: 'statusConfirmed',
  COMPLETED: 'statusCompleted',
  CANCELLED: 'statusCancelled',
  NO_SHOW: 'statusNoShow'
};

const DoctorCmsOverview = () => {
  const { t, i18n } = useTranslation();
  const authUser = useAuthStore((state) => state.user);

  const [summary, setSummary] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadOperations = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const [summaryRes, appointmentsRes, patientsRes, clinicsRes] = await Promise.allSettled([
      api.get('/api/doctors/dashboard/summary'),
      api.get('/api/doctors/appointments?tab=upcoming'),
      api.get('/api/doctors/patients'),
      api.get('/api/doctors/clinics')
    ]);

    if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data?.summary || null);
    if (appointmentsRes.status === 'fulfilled') {
      setAppointments(Array.isArray(appointmentsRes.value.data?.appointments) ? appointmentsRes.value.data.appointments : []);
    }
    if (patientsRes.status === 'fulfilled') {
      setPatients(Array.isArray(patientsRes.value.data?.patients) ? patientsRes.value.data.patients : []);
    }
    if (clinicsRes.status === 'fulfilled') {
      setClinics(Array.isArray(clinicsRes.value.data?.clinics) ? clinicsRes.value.data.clinics : []);
    }
    if ([summaryRes, appointmentsRes, patientsRes, clinicsRes].every((result) => result.status === 'rejected')) {
      setLoadError(t('doctorCms.loadError') || 'Failed to load clinic operations data.');
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    loadOperations();
  }, [loadOperations]);

  const today = useMemo(() => new Date(), []);
  const todayAppointments = useMemo(
    () => appointments.filter((appointment) => isSameDay(appointment.startsAt, today)),
    [appointments, today]
  );
  const nextAppointments = useMemo(
    () => appointments.filter((appointment) => !isSameDay(appointment.startsAt, today)).slice(0, 5),
    [appointments, today]
  );
  const pendingRequests = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'PENDING'),
    [appointments]
  );
  const recentPatients = useMemo(() => patients.slice(0, 5), [patients]);
  const activeClinics = useMemo(() => clinics.filter((clinic) => clinic.isActive !== false), [clinics]);
  const primaryClinic = useMemo(
    () => activeClinics.find((clinic) => clinic.isPrimary === true) || activeClinics[0] || null,
    [activeClinics]
  );

  const quickActions = [
    { id: 'appointments', icon: Calendar, label: t('doctorCms.newAppointment') || 'New Appointment', path: '/doctor-cms/appointments' },
    { id: 'patients', icon: Users, label: t('doctorNav.patients') || 'Patients', path: '/doctor-cms/patients' },
    { id: 'services', icon: Tag, label: t('doctorNav.servicesFees') || 'Services & Fees', path: '/doctor-cms/services' },
    { id: 'clinics', icon: Building2, label: t('doctorNav.clinics') || 'Clinics', path: '/doctor-cms/clinics' },
    { id: 'schedule', icon: Clock, label: t('doctorNav.schedule') || 'Schedule', path: '/doctor-cms/schedule' },
    { id: 'reports', icon: BarChart3, label: t('doctorNav.reports') || 'Reports', path: '/doctor-cms/reports' },
    { id: 'homelyserv', icon: LayoutGrid, label: t('doctorNav.homelyserv') || 'HomelyServ', path: '/doctor-homelyserv' },
    { id: 'premium', icon: Crown, label: t('doctorNav.premium') || 'Premium', path: '/subscription' }
  ];

  const doctorName = getDisplayName(authUser) || authUser?.fullName || '';


const statusPill = (status, t) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${STATUS_PILLS[status] || STATUS_PILLS.NO_SHOW}`}>
    {t(`doctorCms.${STATUS_LABEL_KEYS[status] || 'statusPending'}`) || status}
  </span>
);

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <DashboardHeader title={t('doctorNav.clinicManagementSystem') || 'Clinic Management System'} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <RolePageHeader
          icon={LayoutGrid}
          title={t('doctorCms.systemTitle', { name: doctorName }) || `Dr. ${doctorName} — Clinic Management System`}
          subtitle={t('doctorCms.overviewSubtitle') || 'Clinic operations at a glance: today, upcoming, and pending activity.'}
          actions={
            <Link
              to="/doctor-cms/reports"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              <BarChart3 size={16} />
              {t('doctorCms.reportsTitle') || 'Reports'}
            </Link>
          }
        />

        {loadError ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{loadError}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-red-600 mb-2" />
            <p className="text-sm text-gray-500">{t('doctorCms.loading') || 'Loading clinic operations...'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Operational counters (real backend values) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <CmsStatCard
                icon={Calendar}
                label={t('doctorCms.todayAppointments') || "Today's Appointments"}
                value={todayAppointments.length}
                color="text-red-600 bg-red-50 dark:bg-red-950/40"
                path="/doctor-cms/appointments"
              />
              <CmsStatCard
                icon={Hourglass}
                label={t('doctorCms.pendingRequests') || 'Pending Appointment Requests'}
                value={summary?.appointments?.pending ?? pendingRequests.length}
                color="text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                path="/doctor-cms/appointments"
              />
              <CmsStatCard
                icon={Users}
                label={t('doctorCms.totalPatients') || 'Patients'}
                value={summary?.patients ?? patients.length}
                color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                path="/doctor-cms/patients"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Today's appointments */}
              <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar size={16} className="text-red-500" />
                    {t('doctorCms.todayAppointments') || "Today's Appointments"}
                  </h3>
                  <Link to="/doctor-cms/appointments" className="text-xs font-medium text-red-600 dark:text-red-400 inline-flex items-center gap-1">
                    {t('doctorCms.viewAll') || 'View all'}
                    <ArrowRight size={12} className="rtl:rotate-180" />
                  </Link>
                </div>
                {todayAppointments.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('doctorCms.noAppointmentsToday') || 'No appointments scheduled for today.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {todayAppointments.slice(0, 5).map((appointment) => (
                      <li key={appointment._id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {appointment.patientId?.fullName || t('doctorCms.member') || 'Member'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(appointment.startsAt, i18n.language)}
                            {appointment.clinicId?.clinicName ? ` • ${appointment.clinicId.clinicName}` : ''}
                          </p>
                        </div>
                        {statusPill(appointment.status, t)}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Pending appointment requests */}
              <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Hourglass size={16} className="text-amber-500" />
                    {t('doctorCms.pendingRequests') || 'Pending Appointment Requests'}
                  </h3>
                  <Link to="/doctor-homelyserv/requests" className="text-xs font-medium text-red-600 dark:text-red-400 inline-flex items-center gap-1">
                    {t('doctorCms.reviewRequests') || 'Review Requests'}
                    <ArrowRight size={12} className="rtl:rotate-180" />
                  </Link>
                </div>
                {pendingRequests.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('doctorCms.noPendingRequests') || 'No pending appointment requests.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {pendingRequests.slice(0, 5).map((appointment) => (
                      <li key={appointment._id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {appointment.patientId?.fullName || t('doctorCms.member') || 'Member'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(appointment.startsAt, i18n.language)}
                          </p>
                        </div>
                        {statusPill(appointment.status, t)}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Upcoming appointments (after today) */}
              <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-blue-500" />
                  {t('doctorCms.upcomingAppointments') || 'Upcoming Appointments'}
                </h3>
                {nextAppointments.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('doctorCms.noPendingRequests') || 'No pending appointment requests.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {nextAppointments.map((appointment) => (
                      <li key={appointment._id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {appointment.patientId?.fullName || t('doctorCms.member') || 'Member'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(appointment.startsAt, i18n.language)}
                          </p>
                        </div>
                        {statusPill(appointment.status, t)}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Recent patients */}
              <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users size={16} className="text-teal-500" />
                    {t('doctorCms.recentPatients') || 'Recent Patients'}
                  </h3>
                  <Link to="/doctor-cms/patients" className="text-xs font-medium text-red-600 dark:text-red-400 inline-flex items-center gap-1">
                    {t('doctorCms.viewAll') || 'View all'}
                    <ArrowRight size={12} className="rtl:rotate-180" />
                  </Link>
                </div>
                {recentPatients.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('doctorCms.noRecentPatients') || 'No recent patients yet.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {recentPatients.map((patient) => (
                      <li key={patient.patientId} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {patient.patientName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(patient.lastAppointmentDate, i18n.language)}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {patient.totalAppointments} {t('doctorCms.patientAppointmentsCount') || 'Appointments'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <CmsStatCard
                icon={FileText}
                label={t('doctorCms.recentConsultations') || 'Recent Consultations'}
                value={summary?.consultations?.signed ?? 0}
                color="text-purple-600 bg-purple-50 dark:bg-purple-950/40"
                path="/doctor-cms/consultations"
              />
              <CmsStatCard
                icon={Pill}
                label={t('doctorCms.prescriptionsIssued') || 'Prescriptions Issued'}
                value={summary?.prescriptionsIssued ?? 0}
                color="text-rose-600 bg-rose-50 dark:bg-rose-950/40"
                path="/doctor-cms/prescriptions"
              />
              <CmsStatCard
                icon={Building2}
                label={t('doctorCms.activeClinics') || 'Active Clinics'}
                value={summary?.activeClinics ?? activeClinics.length}
                color="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40"
                path="/doctor-cms/clinics"
              />
            </div>



            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Clinical activity counters (clinic operations overview) */}
              <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <FileText size={16} className="text-purple-500" />
                  {t('doctorCms.recentConsultations') || 'Recent Consultations'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{summary?.consultations?.signed ?? 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('doctorCms.signedConsultations') || 'Signed Consultations'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{summary?.consultations?.drafts ?? 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('doctorCms.draftConsultations') || 'Draft Consultations'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                    <p className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Pill size={14} className="text-emerald-500" />
                      {summary?.prescriptionsIssued ?? 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('doctorCms.prescriptionsIssued') || 'Prescriptions Issued'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                    <p className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Tag size={14} className="text-rose-500" />
                      {summary?.activeServices ?? 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('doctorCms.activeServices') || 'Active Services'}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4">
                  <Link to="/doctor-cms/consultations" className="text-xs font-medium text-red-600 dark:text-red-400 inline-flex items-center gap-1">
                    {t('doctorCms.consultationsTitle') || 'Consultations'}
                    <ArrowRight size={12} className="rtl:rotate-180" />
                  </Link>
                  <Link to="/doctor-cms/prescriptions" className="text-xs font-medium text-red-600 dark:text-red-400 inline-flex items-center gap-1">
                    {t('doctorCms.prescriptionsTitle') || 'Prescriptions'}
                    <ArrowRight size={12} className="rtl:rotate-180" />
                  </Link>
                </div>
              </section>

              {/* Clinic information */}
              <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Building2 size={16} className="text-indigo-500" />
                    {t('doctorCms.clinicInformation') || 'Clinic Information'}
                  </h3>
                  <Link to="/doctor-cms/clinics" className="text-xs font-medium text-red-600 dark:text-red-400 inline-flex items-center gap-1">
                    {t('doctorCms.addClinic') || 'Add Clinic'}
                    <ArrowRight size={12} className="rtl:rotate-180" />
                  </Link>
                </div>
                {activeClinics.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('doctorCms.noClinics') || 'No clinic registered yet.'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {t('doctorCms.primaryClinic') || 'Primary Clinic'}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                        {primaryClinic?.clinicName || t('doctorCms.noPrimaryClinic') || 'Primary clinic not set'}
                      </p>
                      {(primaryClinic?.city || primaryClinic?.addressLine) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {[primaryClinic?.city, primaryClinic?.addressLine].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                      {activeClinics.slice(0, 4).map((clinic) => (
                        <li key={clinic._id} className="py-2 flex items-center justify-between gap-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{clinic.clinicName}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {clinic.city || '—'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>

            {/* Quick clinic actions */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {t('doctorCms.quickActions') || 'Quick Actions'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.id}
                      to={action.path}
                      className="flex items-center gap-2 px-3 py-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <Icon size={16} className="text-red-500 shrink-0" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorCmsOverview;

