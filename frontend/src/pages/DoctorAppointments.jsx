// frontend/src/pages/DoctorAppointments.jsx
// Doctor Appointments module.
//
// Tabs:
//   1. Upcoming (PENDING, CONFIRMED in future)
//   2. Home Visit Requests (consultationType: HOME_VISIT)
//   3. History (COMPLETED, CANCELLED, NO_SHOW, past)
//
// Actions:
//   PENDING: Confirm, Cancel
//   CONFIRMED: Complete, Mark No-Show, Cancel
//   Terminal states: read-only
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import AppointmentCreateModal from '../components/doctor/cms/AppointmentCreateModal';
import api from '../utils/api';
import {
  Calendar,
  Clock,
  Building2,
  Home,
  Video,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock3,
  UserX,
  Plus,
  Loader2,
  X
} from 'lucide-react';

const DoctorAppointments = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'home_visits' | 'history'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Status Action Modal (Confirm, Complete, Cancel, No-Show)
  const [actionTarget, setActionTarget] = useState(null); // appointment object
  const [actionType, setActionType] = useState(''); // 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  const [cancellationReason, setCancellationReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  // Phase 2B — shared "New Appointment" workflow (also used by the
  // Clinic Patient File). One form, no duplication.
  const [showCreate, setShowCreate] = useState(false);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await api.get(`/api/doctors/appointments?tab=${activeTab}`);
      setAppointments(Array.isArray(res.data?.appointments) ? res.data.appointments : []);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorAppointments.loadError') || 'Failed to load appointments.'
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, t]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const openActionModal = (appointment, type) => {
    setActionTarget(appointment);
    setActionType(type);
    setCancellationReason('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const closeActionModal = () => {
    if (actionBusy) return;
    setActionTarget(null);
    setActionType('');
    setCancellationReason('');
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!actionTarget || !actionType || actionBusy) return;

    const aptId = actionTarget._id || actionTarget.id;
    const payload = { status: actionType };
    if (actionType === 'CANCELLED') {
      payload.cancellationReason = cancellationReason.trim();
    }

    try {
      setActionBusy(true);
      setErrorMessage('');
      await api.put(`/api/doctors/appointments/${aptId}/status`, payload);
      setSuccessMessage(t('doctorAppointments.statusUpdatedSuccess') || 'Appointment status updated.');
      closeActionModal();
      await loadAppointments();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorAppointments.actionError') || 'Failed to update appointment status.'
      );
      closeActionModal();
    } finally {
      setActionBusy(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
            <CheckCircle size={12} />
            {t('doctorAppointments.statuses.CONFIRMED') || 'Confirmed'}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
            <Clock3 size={12} />
            {t('doctorAppointments.statuses.PENDING') || 'Pending'}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            <CheckCircle size={12} />
            {t('doctorAppointments.statuses.COMPLETED') || 'Completed'}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            <XCircle size={12} />
            {t('doctorAppointments.statuses.CANCELLED') || 'Cancelled'}
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            <UserX size={12} />
            {t('doctorAppointments.statuses.NO_SHOW') || 'No Show'}
          </span>
        );
      default:
        return null;
    }
  };

  const renderTypeIcon = (type) => {
    switch (type) {
      case 'ONLINE':
        return <Video size={14} className="text-blue-500" />;
      case 'HOME_VISIT':
        return <Home size={14} className="text-emerald-500" />;
      case 'CLINIC':
      default:
        return <Building2 size={14} className="text-purple-500" />;
    }
  };

  const cardClass = 'bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm';

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <DashboardHeader title={t('doctorAppointments.headerTitle') || 'Appointments'} />

        {/* Global Feedback Alerts */}
        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 text-red-800 dark:text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3 text-green-800 dark:text-green-200 text-sm">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('doctorAppointments.pageTitle') || 'Appointments'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('doctorAppointments.pageSubtitle') || 'Manage clinical consultations, home visits, and patient appointments.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            <Plus size={16} />
            {t('doctorCms.newAppointment') || 'New Appointment'}
          </button>
        </div>

        {/* Navigation Tabs: Upcoming, Home Visit Requests, History */}
        <div className="border-b border-gray-200 dark:border-gray-700 flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'upcoming'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t('doctorAppointments.tabUpcoming') || 'Upcoming'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('home_visits')}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'home_visits'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t('doctorAppointments.tabHomeVisits') || 'Home Visit Requests'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'history'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t('doctorAppointments.tabHistory') || 'History'}
          </button>
        </div>

        {/* Appointments List / Table */}
        {loading ? (
          <div className={`${cardClass} p-12 flex items-center justify-center`}>
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={
              activeTab === 'home_visits'
                ? (t('doctorAppointments.emptyHomeVisits') || 'No pending home visit requests.')
                : activeTab === 'history'
                ? (t('doctorAppointments.emptyHistory') || 'No past appointments.')
                : (t('doctorAppointments.emptyUpcoming') || 'No upcoming appointments scheduled.')
            }
            description={t('doctorSchedule.emptyDesc') || 'Appointments booked by patients will appear here.'}
          />
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const aptId = appointment._id || appointment.id;
              // Phase 2B: an appointment references EITHER a HomelyServ
              // User (patientId) OR a ClinicPatient (clinicPatientId).
              // Both are populated by the backend; exactly one is set.
              const isClinicPatient = Boolean(appointment.clinicPatientId);
              const patient = isClinicPatient
                ? (typeof appointment.clinicPatientId === 'object'
                    ? appointment.clinicPatientId
                    : {})
                : (appointment.patientId || {});
              const clinic = appointment.clinicId;
              const service = appointment.serviceId;
              const startDate = new Date(appointment.startsAt);
              const endDate = new Date(appointment.endsAt);

              const formattedDate = !Number.isNaN(startDate.getTime())
                ? startDate.toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : '—';

              const formattedTime = !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())
                ? `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : '—';

              return (
                <div key={aptId} className={`${cardClass} p-5 space-y-4`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    {/* Patient & Consultation Meta */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold overflow-hidden flex-shrink-0">
                        {patient.profileImage ? (
                          <img
                            src={patient.profileImage}
                            alt={patient.fullName || 'Patient'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (patient.fullName?.[0] || 'P').toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                            {patient.fullName || t('doctorAppointments.patient') || 'Patient'}
                          </h3>
                          {isClinicPatient && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                              {t('doctorCms.clinicPatient') || 'Clinic Patient'}
                            </span>
                          )}
                          {getStatusBadge(appointment.status)}
                        </div>

                        {/* Consultation Type & Clinic */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                            {renderTypeIcon(appointment.consultationType)}
                            <span>{t(`doctorSchedule.types.${appointment.consultationType}`) || appointment.consultationType}</span>
                          </span>
                          {clinic && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <Building2 size={13} />
                                <span>{clinic.clinicName} ({clinic.city})</span>
                              </span>
                            </>
                          )}
                          {appointment.feeSnapshot > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {appointment.feeSnapshot} {appointment.currency || 'EGP'}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Reason / Notes */}
                        {appointment.reason && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 italic">
                            "{appointment.reason}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Schedule Date & Time info */}
                    <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-white">
                        <Calendar size={14} className="text-red-600" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Clock size={13} />
                        <span>{formattedTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contextual Action Bar */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-gray-400">
                      ID: {String(aptId).slice(-6)}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* PENDING State Actions: Confirm, Cancel */}
                      {appointment.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => openActionModal(appointment, 'CONFIRMED')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
                          >
                            <CheckCircle size={14} />
                            <span>{t('doctorAppointments.confirmBtn') || 'Confirm'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionModal(appointment, 'CANCELLED')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition-colors"
                          >
                            <XCircle size={14} />
                            <span>{t('doctorAppointments.cancelBtn') || 'Cancel'}</span>
                          </button>
                        </>
                      )}

                      {/* CONFIRMED State Actions: Complete, Mark No-Show, Cancel */}
                      {appointment.status === 'CONFIRMED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => openActionModal(appointment, 'COMPLETED')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                          >
                            <CheckCircle size={14} />
                            <span>{t('doctorAppointments.completeBtn') || 'Complete'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionModal(appointment, 'NO_SHOW')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-medium transition-colors"
                          >
                            <UserX size={14} />
                            <span>{t('doctorAppointments.noShowBtn') || 'Mark No-Show'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionModal(appointment, 'CANCELLED')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition-colors"
                          >
                            <XCircle size={14} />
                            <span>{t('doctorAppointments.cancelBtn') || 'Cancel'}</span>
                          </button>
                        </>
                      )}

                      {/* Terminal states have no mutation buttons */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= Action Modal ================= */}
        {actionTarget && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className={`${cardClass} w-full max-w-md`}>
              <form onSubmit={handleStatusSubmit}>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {actionType === 'CONFIRMED' && (t('doctorAppointments.confirmModalTitle') || 'Confirm Appointment?')}
                      {actionType === 'COMPLETED' && (t('doctorAppointments.completeModalTitle') || 'Complete Appointment?')}
                      {actionType === 'CANCELLED' && (t('doctorAppointments.cancelModalTitle') || 'Cancel Appointment?')}
                      {actionType === 'NO_SHOW' && (t('doctorAppointments.noShowModalTitle') || 'Mark Patient as No-Show?')}
                    </h2>
                    <button
                      type="button"
                      onClick={closeActionModal}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {actionType === 'CONFIRMED' && (t('doctorAppointments.confirmModalDesc') || 'Are you sure you want to confirm this appointment with the patient?')}
                    {actionType === 'COMPLETED' && (t('doctorAppointments.completeModalDesc') || 'Mark this consultation as successfully completed.')}
                    {actionType === 'CANCELLED' && (t('doctorAppointments.cancelModalDesc') || 'Please provide a reason for cancelling this appointment.')}
                    {actionType === 'NO_SHOW' && (t('doctorAppointments.noShowModalDesc') || 'Are you sure the patient did not attend this scheduled appointment?')}
                  </p>

                  {/* Reason input for cancellation */}
                  {actionType === 'CANCELLED' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('doctorAppointments.cancellationReasonLabel') || 'Cancellation reason'}
                      </label>
                      <textarea
                        rows={2}
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder={t('doctorAppointments.cancellationReasonPlaceholder') || 'e.g. Doctor unavailable, emergency...'}
                        maxLength={500}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    disabled={actionBusy}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
                  >
                    {t('cancel') || 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={actionBusy}
                    className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50 ${
                      actionType === 'CANCELLED'
                        ? 'bg-red-600 hover:bg-red-700'
                        : actionType === 'COMPLETED'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {actionBusy && <Loader2 size={16} className="animate-spin" />}
                    <span>
                      {actionType === 'CONFIRMED' && (t('doctorAppointments.confirmBtn') || 'Confirm')}
                      {actionType === 'COMPLETED' && (t('doctorAppointments.completeBtn') || 'Complete')}
                      {actionType === 'CANCELLED' && (t('doctorAppointments.cancelBtn') || 'Cancel')}
                      {actionType === 'NO_SHOW' && (t('doctorAppointments.noShowBtn') || 'Mark No-Show')}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Phase 2B — shared New Appointment workflow. The same component
            is used from the Clinic Patient File; there is only one form. */}
        <AppointmentCreateModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setSuccessMessage(
              t('doctorCms.appointmentCreated') || 'Appointment created successfully.'
            );
            await loadAppointments();
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default DoctorAppointments;
