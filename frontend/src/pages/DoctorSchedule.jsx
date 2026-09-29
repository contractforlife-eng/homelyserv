// frontend/src/pages/DoctorSchedule.jsx
// Doctor Schedule module.
//
// This page manages weekly availability for HomelyServ consultations.
// Reuses the existing DoctorSchedule API:
//   - GET /api/doctors/schedule
//   - POST /api/doctors/schedule
//   - PUT /api/doctors/schedule/:id
//   - DELETE /api/doctors/schedule/:id
//
// Scoped to the authenticated doctor with overlap protection and clinic association.
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import api from '../utils/api';
import {
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Video,
  Home,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ChevronRight
} from 'lucide-react';

const WEEKDAYS = [
  { dayOfWeek: 1, key: '1' }, // Monday
  { dayOfWeek: 2, key: '2' }, // Tuesday
  { dayOfWeek: 3, key: '3' }, // Wednesday
  { dayOfWeek: 4, key: '4' }, // Thursday
  { dayOfWeek: 5, key: '5' }, // Friday
  { dayOfWeek: 6, key: '6' }, // Saturday
  { dayOfWeek: 0, key: '0' }  // Sunday
];

const EMPTY_SLOT_FORM = {
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '13:00',
  consultationType: 'CLINIC',
  clinicId: '',
  slotDurationMinutes: 30,
  isActive: true
};

const DoctorSchedule = () => {
  const { t } = useTranslation();

  const [schedules, setSchedules] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add / Edit modal state
  const [formMode, setFormMode] = useState(null); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_SLOT_FORM);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Load schedules and clinics
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [scheduleRes, clinicRes] = await Promise.all([
        api.get('/api/doctors/schedule?includeInactive=true'),
        api.get('/api/doctors/clinics')
      ]);

      setSchedules(Array.isArray(scheduleRes.data?.schedules) ? scheduleRes.data.schedules : []);
      setClinics(Array.isArray(clinicRes.data?.clinics) ? clinicRes.data.clinics : []);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorSchedule.loadError') || 'Failed to load schedule.'
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side quick form validation mirroring backend rules
  const validateForm = (values) => {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(values.startTime) || !timeRegex.test(values.endTime)) {
      return t('doctorSchedule.timeFormatError') || 'Times must be in HH:mm 24-hour format.';
    }

    const [sH, sM] = values.startTime.split(':').map(Number);
    const [eH, eM] = values.endTime.split(':').map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;

    if (startMins >= endMins) {
      return t('doctorSchedule.timeRangeError') || 'End time must be after start time.';
    }

    if (values.consultationType === 'CLINIC' && !values.clinicId && clinics.length > 0) {
      // If doctor has clinics available, suggest picking one
      // (not strictly required if doctor operates mobile or unlisted, but validated if attached)
    }

    return '';
  };

  const openAddModal = (presetDay = 1) => {
    setFormMode('add');
    setEditingId(null);
    setForm({
      ...EMPTY_SLOT_FORM,
      dayOfWeek: Number(presetDay),
      clinicId: clinics.find(c => c.isPrimary)?._id || (clinics.length > 0 ? clinics[0]._id : '')
    });
    setFormError('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const openEditModal = (slot) => {
    setFormMode('edit');
    setEditingId(slot._id || slot.id);
    setForm({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime || '09:00',
      endTime: slot.endTime || '13:00',
      consultationType: slot.consultationType || 'CLINIC',
      clinicId: slot.clinicId?._id || slot.clinicId || '',
      slotDurationMinutes: slot.slotDurationMinutes || 30,
      isActive: slot.isActive !== undefined ? Boolean(slot.isActive) : true
    });
    setFormError('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const closeModal = () => {
    if (saving) return;
    setFormMode(null);
    setEditingId(null);
    setForm(EMPTY_SLOT_FORM);
    setFormError('');
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const validationError = validateForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      dayOfWeek: Number(form.dayOfWeek),
      startTime: form.startTime,
      endTime: form.endTime,
      consultationType: form.consultationType,
      clinicId: form.clinicId || null,
      slotDurationMinutes: Number(form.slotDurationMinutes) || 30,
      isActive: Boolean(form.isActive)
    };

    try {
      setSaving(true);
      setErrorMessage('');
      setFormError('');

      if (formMode === 'edit') {
        await api.put(`/api/doctors/schedule/${editingId}`, payload);
        setSuccessMessage(t('doctorSchedule.updateSuccess') || 'Availability slot updated successfully.');
      } else {
        await api.post('/api/doctors/schedule', payload);
        setSuccessMessage(t('doctorSchedule.createSuccess') || 'Availability slot added successfully.');
      }

      setFormMode(null);
      setEditingId(null);
      setForm(EMPTY_SLOT_FORM);
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || t('doctorSchedule.saveError') || 'Failed to save availability slot.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteBusy) return;
    const id = deleteTarget._id || deleteTarget.id;
    try {
      setDeleteBusy(true);
      setErrorMessage('');
      await api.delete(`/api/doctors/schedule/${id}`);
      setDeleteTarget(null);
      setSuccessMessage(t('doctorSchedule.deleteSuccess') || 'Availability slot removed successfully.');
      await loadData();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorSchedule.deleteError') || 'Failed to delete availability slot.'
      );
      setDeleteTarget(null);
    } finally {
      setDeleteBusy(false);
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
  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <DashboardHeader title={t('doctorSchedule.headerTitle') || 'Schedule'} />

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
              {t('doctorSchedule.pageTitle') || 'Schedule'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('doctorSchedule.pageSubtitle') || 'Manage your weekly availability for HomelyServ consultations.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => openAddModal(1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>{t('doctorSchedule.addSlotBtn') || 'Add Availability'}</span>
          </button>
        </div>

        {/* Weekly Availability Columns / Stack */}
        {loading ? (
          <div className={`${cardClass} p-12 flex items-center justify-center`}>
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {WEEKDAYS.map(({ dayOfWeek, key }) => {
              const daySlots = schedules
                .filter(s => s.dayOfWeek === dayOfWeek)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

              const dayName = t(`doctorSchedule.days.${key}`) || (
                dayOfWeek === 1 ? 'Monday' :
                dayOfWeek === 2 ? 'Tuesday' :
                dayOfWeek === 3 ? 'Wednesday' :
                dayOfWeek === 4 ? 'Thursday' :
                dayOfWeek === 5 ? 'Friday' :
                dayOfWeek === 6 ? 'Saturday' : 'Sunday'
              );

              return (
                <div key={dayOfWeek} className={`${cardClass} p-5 space-y-3`}>
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center font-bold text-xs">
                        {dayName.slice(0, 3)}
                      </div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white">
                        {dayName}
                      </h2>
                      <span className="text-xs text-gray-400 font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                        {daySlots.length} {daySlots.length === 1
                          ? (t('doctorSchedule.slotCountOne') || 'slot')
                          : (t('doctorSchedule.slotCountOther') || 'slots')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openAddModal(dayOfWeek)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium transition-colors"
                    >
                      <Plus size={14} />
                      <span>{t('doctorSchedule.addSlotBtn') || 'Add Availability'}</span>
                    </button>
                  </div>

                  {/* Day Availability Slots List */}
                  {daySlots.length === 0 ? (
                    <div className="py-3 px-4 text-xs text-gray-400 dark:text-gray-500 italic bg-gray-50/50 dark:bg-gray-800/30 rounded-xl">
                      {t('doctorSchedule.emptyDay') || 'No availability slots for this day.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {daySlots.map((slot) => {
                        const slotId = slot._id || slot.id;
                        const clinicInfo = slot.clinicId;
                        const typeName = t(`doctorSchedule.types.${slot.consultationType}`) || slot.consultationType;

                        return (
                          <div
                            key={slotId}
                            className={`p-3.5 rounded-xl border transition-all ${
                              slot.isActive
                                ? 'border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40'
                                : 'border-gray-200 dark:border-gray-800 bg-gray-100/40 dark:bg-gray-900/30 opacity-60'
                            } flex items-start justify-between gap-3`}
                          >
                            <div className="space-y-1.5 min-w-0 flex-1">
                              {/* Time Range */}
                              <div className="flex items-center gap-2">
                                <Clock size={16} className="text-red-600 flex-shrink-0" />
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {slot.startTime} – {slot.endTime}
                                </span>
                                {!slot.isActive && (
                                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                    {t('doctorSchedule.inactive') || 'Inactive'}
                                  </span>
                                )}
                              </div>

                              {/* Consultation Type & Duration */}
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                <span className="inline-flex items-center gap-1">
                                  {renderTypeIcon(slot.consultationType)}
                                  <span className="font-medium">{typeName}</span>
                                </span>
                                <span>•</span>
                                <span>{slot.slotDurationMinutes} {t('doctorSchedule.minutesShort') || 'min'}</span>
                              </div>

                              {/* Associated Clinic if present */}
                              {clinicInfo && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                                  <Building2 size={13} className="flex-shrink-0 text-gray-400" />
                                  <span className="truncate">
                                    {clinicInfo.clinicName || (t('doctorSchedule.clinic') || 'Clinic')} {clinicInfo.city ? `(${clinicInfo.city})` : ''}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Slot Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(slot)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
                                title={t('doctorSchedule.editBtn') || 'Edit'}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(slot)}
                                className="p-1.5 rounded-lg text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                title={t('doctorSchedule.deleteBtn') || 'Delete'}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ================= Add / Edit Modal ================= */}
        {formMode && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
            <div className={`${cardClass} w-full max-w-lg my-8`}>
              <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {formMode === 'edit'
                    ? (t('doctorSchedule.saveChangesBtn') || 'Edit Availability Slot')
                    : (t('doctorSchedule.addAvailabilityBtn') || 'Add Availability Slot')}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label={t('cancel') || 'Close'}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-5 space-y-4">
                  {formError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-2 text-red-800 dark:text-red-200 text-sm">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Day of Week */}
                  <div>
                    <label className={labelClass} htmlFor="scheduleDay">
                      {t('doctorSchedule.day') || 'Day of week'} *
                    </label>
                    <select
                      id="scheduleDay"
                      value={form.dayOfWeek}
                      onChange={(e) => handleFormChange('dayOfWeek', Number(e.target.value))}
                      className={inputClass}
                    >
                      {WEEKDAYS.map(({ dayOfWeek, key }) => (
                        <option key={dayOfWeek} value={dayOfWeek}>
                          {t(`doctorSchedule.days.${key}`) || `Day ${dayOfWeek}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Time & End Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="startTime">
                        {t('doctorSchedule.startTime') || 'Start Time'} (24h) *
                      </label>
                      <input
                        id="startTime"
                        type="time"
                        value={form.startTime}
                        onChange={(e) => handleFormChange('startTime', e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="endTime">
                        {t('doctorSchedule.endTime') || 'End Time'} (24h) *
                      </label>
                      <input
                        id="endTime"
                        type="time"
                        value={form.endTime}
                        onChange={(e) => handleFormChange('endTime', e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Consultation Type */}
                  <div>
                    <label className={labelClass} htmlFor="consultationType">
                      {t('doctorSchedule.consultationType') || 'Consultation Type'} *
                    </label>
                    <select
                      id="consultationType"
                      value={form.consultationType}
                      onChange={(e) => handleFormChange('consultationType', e.target.value)}
                      className={inputClass}
                    >
                      <option value="CLINIC">{t('doctorSchedule.types.CLINIC') || 'Clinic Consultation'}</option>
                      <option value="HOME_VISIT">{t('doctorSchedule.types.HOME_VISIT') || 'Home Visit'}</option>
                      <option value="ONLINE">{t('doctorSchedule.types.ONLINE') || 'Online Consultation'}</option>
                    </select>
                  </div>

                  {/* Clinic Association (when CLINIC or when doctor has clinics) */}
                  {form.consultationType === 'CLINIC' && (
                    <div>
                      <label className={labelClass} htmlFor="scheduleClinic">
                        {t('doctorSchedule.clinic') || 'Clinic Location'}
                      </label>
                      <select
                        id="scheduleClinic"
                        value={form.clinicId}
                        onChange={(e) => handleFormChange('clinicId', e.target.value)}
                        className={inputClass}
                      >
                        <option value="">{t('doctorSchedule.selectClinic') || 'Select a clinic (optional)'}</option>
                        {clinics.map((clinic) => (
                          <option key={clinic._id || clinic.id} value={clinic._id || clinic.id}>
                            {clinic.clinicName} ({clinic.city || clinic.addressLine}) {clinic.isPrimary ? `★ ${t('doctorClinics.primaryBadge') || 'Primary'}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Slot Duration */}
                  <div>
                    <label className={labelClass} htmlFor="slotDuration">
                      {t('doctorSchedule.slotDuration') || 'Slot Duration (minutes)'}
                    </label>
                    <select
                      id="slotDuration"
                      value={form.slotDurationMinutes}
                      onChange={(e) => handleFormChange('slotDurationMinutes', Number(e.target.value))}
                      className={inputClass}
                    >
                      <option value={15}>15 min</option>
                      <option value={20}>20 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                      <option value={120}>120 min</option>
                    </select>
                  </div>

                  {/* Active / Inactive State */}
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => handleFormChange('isActive', e.target.checked)}
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('doctorSchedule.active') || 'Slot is active and bookable'}
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
                  >
                    {t('cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    <span>
                      {saving
                        ? (t('saving') || 'Saving...')
                        : (formMode === 'edit'
                          ? (t('doctorSchedule.saveChangesBtn') || 'Save Changes')
                          : (t('doctorSchedule.addAvailabilityBtn') || 'Add Availability'))}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= Delete Confirmation Modal ================= */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className={`${cardClass} w-full max-w-md`}>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center flex-shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('doctorSchedule.deleteConfirmTitle') || 'Delete Availability Slot?'}
                  </h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('doctorSchedule.deleteConfirmDesc') || 'This will remove the selected availability time slot from your schedule.'}
                </p>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white">
                  {t(`doctorSchedule.days.${deleteTarget.dayOfWeek}`)}: {deleteTarget.startTime} – {deleteTarget.endTime} ({t(`doctorSchedule.types.${deleteTarget.consultationType}`) || deleteTarget.consultationType})
                </div>
              </div>

              <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteBusy}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteBusy}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {deleteBusy && <Loader2 size={16} className="animate-spin" />}
                  <span>{t('doctorSchedule.deleteConfirmBtn') || 'Yes, delete'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorSchedule;
