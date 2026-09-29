// frontend/src/pages/DoctorHomelyServRequests.jsx
// ============================================================
// HOMELYSERV MODULE — APPOINTMENT REQUESTS
// Requests coming from HomelyServ members. This page reuses the
// EXISTING Doctor appointment records:
//   GET  /api/doctors/appointments?status=PENDING
//   PUT  /api/doctors/appointments/:id/status   (CONFIRMED / CANCELLED)
// No second appointment backend, no new appointment model, and the
// existing status transitions + notifications are preserved.
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import api from '../utils/api';
import { isMemberAppointment } from '../utils/doctorHomelyServ';
import {
  Calendar, Loader2, AlertCircle, CheckCircle2, XCircle, ArrowRight,
  Building2, Tag, Info, Stethoscope
} from 'lucide-react';

const localeFor = (language) => (language === 'ar' ? 'ar-EG' : 'en-US');

const formatRequestedAt = (value, language) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(localeFor(language), {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const DoctorHomelyServRequests = () => {
  const { t, i18n } = useTranslation();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await api.get('/api/doctors/appointments?status=PENDING');
      const list = Array.isArray(res.data?.appointments) ? res.data.appointments : [];
      // Member requests only: walk-in ClinicPatient appointments the doctor
      // created himself are clinical records, not member requests.
      setRequests(list.filter(isMemberAppointment));
    } catch (err) {
      setLoadError(err.response?.data?.message || t('doctorCms.requestsLoadError') || 'Failed to load appointment requests.');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const sortedRequests = useMemo(
    () => [...requests].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)),
    [requests]
  );

  const updateRequestStatus = async (appointmentId, status) => {
    setActionError('');
    try {
      setProcessingId(appointmentId);
      await api.put(`/api/doctors/appointments/${appointmentId}/status`, { status });
      setRequests((prev) => prev.filter((request) => request._id !== appointmentId));
    } catch (err) {
      setActionError(err.response?.data?.message || t('doctorCms.requestsActionError') || 'Failed to update the request.');
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = (request) => (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={processingId === request._id}
        onClick={() => updateRequestStatus(request._id, 'CONFIRMED')}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
      >
        <CheckCircle2 size={14} />
        {t('doctorCms.acceptRequest') || 'Accept'}
      </button>
      <button
        type="button"
        disabled={processingId === request._id}
        onClick={() => updateRequestStatus(request._id, 'CANCELLED')}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-60 text-xs font-semibold transition-colors"
      >
        <XCircle size={14} />
        {t('doctorCms.declineRequest') || 'Decline'}
      </button>
    </div>
  );

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <DashboardHeader title={t('doctorCms.requestsTitle') || 'Appointment Requests'} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <RolePageHeader
          icon={Calendar}
          title={t('doctorCms.requestsTitle') || 'Appointment Requests'}
          subtitle={t('doctorCms.requestsSubtitle') || 'Requests from HomelyServ members. Accept or decline with the existing appointment workflow.'}
          actions={
            <Link
              to="/doctor-cms/appointments"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              <ArrowRight size={16} className="rtl:rotate-180" />
              {t('doctorNav.appointments') || 'Appointments'}
            </Link>
          }
        />

        {actionError ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{actionError}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-red-600 mb-2" />
            <p className="text-sm text-gray-500">{t('doctorCms.loading') || 'Loading clinic operations...'}</p>
          </div>
        ) : loadError ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{loadError}</p>
          </div>
        ) : sortedRequests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 shadow-sm text-center">
            <Calendar size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('doctorCms.noRequests') || 'No pending appointment requests right now.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="text-start font-medium px-4 py-3">{t('doctorCms.member') || 'Member'}</th>
                    <th className="text-start font-medium px-4 py-3">{t('doctorCms.requestedDateTime') || 'Requested Date & Time'}</th>
                    <th className="text-start font-medium px-4 py-3">{t('doctorCms.appointmentType') || 'Type'}</th>
                    <th className="text-start font-medium px-4 py-3">{t('doctorCms.clinicLabel') || 'Clinic'}</th>
                    <th className="text-start font-medium px-4 py-3">{t('doctorCms.serviceLabel') || 'Service'}</th>
                    <th className="text-start font-medium px-4 py-3">{t('doctorCms.feeLabel') || 'Fee'}</th>
                    <th className="text-end font-medium px-4 py-3">{t('doctorCms.respondRequest') || 'Respond'}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {sortedRequests.map((request) => (
                    <tr key={request._id} className="align-middle">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{request.patientId?.fullName || t('doctorCms.member') || 'Member'}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {t('doctorCms.statusPending') || 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatRequestedAt(request.startsAt, i18n.language)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {t(`doctorSchedule.types.${request.consultationType}`) || request.consultationType}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{request.clinicId?.clinicName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{request.serviceId?.serviceName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {Number(request.feeSnapshot) ? `${request.feeSnapshot} ${request.currency || 'EGP'}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">{renderActions(request)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Small screens: stacked request cards (no horizontal scrolling) */}
            <ul className="lg:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {sortedRequests.map((request) => (
                <li key={request._id} className="p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {request.patientId?.fullName || t('doctorCms.member') || 'Member'}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {t('doctorCms.statusPending') || 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Calendar size={12} />
                    {formatRequestedAt(request.startsAt, i18n.language)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Stethoscope size={12} />
                    {t(`doctorSchedule.types.${request.consultationType}`) || request.consultationType}
                  </p>
                  {request.clinicId?.clinicName ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Building2 size={12} />
                      {request.clinicId.clinicName}
                    </p>
                  ) : null}
                  {request.serviceId?.serviceName ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Tag size={12} />
                      {request.serviceId.serviceName}
                    </p>
                  ) : null}
                  {Number(request.feeSnapshot) ? (
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {t('doctorCms.feeLabel') || 'Fee'}: {request.feeSnapshot} {request.currency || 'EGP'}
                    </p>
                  ) : null}
                  <div className="pt-1">{renderActions(request)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
          <Info size={12} />
          {t('doctorCms.homelyservSeparationNote') || 'This module is separate from clinical records, consultations, prescriptions, and medical history.'}
        </p>
      </div>
    </DashboardLayout>
  );
};

export default DoctorHomelyServRequests;

