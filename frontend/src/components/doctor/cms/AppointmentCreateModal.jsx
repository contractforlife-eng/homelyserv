// frontend/src/components/doctor/cms/AppointmentCreateModal.jsx
// ============================================================
// PHASE 2B — shared "New Appointment" workflow.
//
// This is the ONLY appointment creation form in the Doctor CMS. Used by
// both DoctorAppointments.jsx and DoctorClinicPatientDetails.jsx.
//
// PATIENT SOURCE (additive — NOT polymorphic):
//   clinicPatientId -> the Doctor's own ClinicPatient (may be a walk-in
//                      with no HomelyServ account)
//   patientId       -> the Doctor's existing HomelyServ patients
// Exactly one is sent; the backend rejects both/neither.
//
// Reuses the existing appointment API and its clinic/schedule/service
// validation. No second scheduling engine.
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, X, Calendar, Users } from 'lucide-react';
import api from '../../../utils/api';

const INPUT_CLS =
  'w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500';
const LABEL_CLS = 'block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1';

const toDate = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}:00`);
const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

const AppointmentCreateModal = ({
  open,
  onClose,
  onCreated,
  // Preselected + locked when opened from the Clinic Patient File.
  presetClinicPatient = null
}) => {
  const { t } = useTranslation();

  const [clinics, setClinics] = useState([]);
  const [clinicPatients, setClinicPatients] = useState([]);
  const [homelyPatients, setHomelyPatients] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [patientSource, setPatientSource] = useState('CLINIC');
  const [selectedClinicPatient, setSelectedClinicPatient] = useState('');
  const [selectedHomelyPatient, setSelectedHomelyPatient] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [consultationType, setConsultationType] = useState('CLINIC');
  const [dateStr, setDateStr] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('30');
  const [reason, setReason] = useState('');

  const resetForm = useCallback(() => {
    setPatientSource('CLINIC');
    setSelectedClinicPatient(
      presetClinicPatient
        ? String(presetClinicPatient.patientId || presetClinicPatient._id || '')
        : ''
    );
    setSelectedHomelyPatient('');
    setClinicId('');
    setConsultationType('CLINIC');
    setDateStr('');
    setStartTime('09:00');
    setDuration('30');
    setReason('');
    setError('');
  }, [presetClinicPatient]);

  useEffect(() => {
    if (!open) return;
    resetForm();
    let cancelled = false;
    (async () => {
      try {
        setLoadingOptions(true);
        // Only THIS doctor's own data. The backend never exposes another
        // doctor's ClinicPatients.
        const [clinicRes, clinicPatientRes, patientRes] = await Promise.all([
          api.get('/api/doctors/clinics').catch(() => ({ data: {} })),
          api.get('/api/doctors/clinic-patients').catch(() => ({ data: {} })),
          api.get('/api/doctors/patients').catch(() => ({ data: {} }))
        ]);
        if (cancelled) return;
        setClinics(Array.isArray(clinicRes.data?.clinics) ? clinicRes.data.clinics : []);
        setClinicPatients(
          Array.isArray(clinicPatientRes.data?.patients) ? clinicPatientRes.data.patients : []
        );
        const hp = patientRes.data?.patients;
        setHomelyPatients(Array.isArray(hp) ? hp : []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load options.');
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, resetForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError('');

    if (!dateStr) { setError(t('doctorCms.appointmentDateRequired') || 'Please choose a date.'); return; }

    const useClinic = patientSource === 'CLINIC';
    const chosenId = useClinic ? selectedClinicPatient : selectedHomelyPatient;
    if (!chosenId) {
      setError(t('doctorCms.appointmentPatientRequired') || 'Please select a patient.');
      return;
    }

    const startsAt = toDate(dateStr, startTime);
    if (Number.isNaN(startsAt.getTime())) {
      setError(t('doctorCms.appointmentDateRequired') || 'Please choose a valid date.');
      return;
    }
    const endsAt = addMinutes(startsAt, Number(duration) || 30);

    // Exactly ONE patient source is sent — never both.
    const payload = {
      consultationType,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      reason: reason.trim(),
      ...(clinicId ? { clinicId } : {}),
      ...(useClinic ? { clinicPatientId: chosenId } : { patientId: chosenId })
    };

    try {
      setSaving(true);
      const res = await api.post('/api/doctors/appointments', payload);
      onCreated?.(res.data?.appointment);
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create appointment.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  const disabled = saving || loadingOptions;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl my-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Calendar size={16} className="text-red-500" />
            {t('doctorCms.newAppointment') || 'New Appointment'}
          </h2>
          <button type="button" onClick={onClose} disabled={saving}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <span className={LABEL_CLS}>{t('doctorCms.patientSource') || 'Patient source'}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPatientSource('CLINIC')}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold border ${
                  patientSource === 'CLINIC'
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}>
                {t('doctorCms.clinicPatient') || 'Clinic Patient'}
              </button>
              <button type="button" onClick={() => setPatientSource('HOMELY')}
                disabled={Boolean(presetClinicPatient)}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold border disabled:opacity-50 ${
                  patientSource === 'HOMELY'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}>
                {t('doctorCms.homelyservPatient') || 'HomelyServ Patient'}
              </button>
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>
              {patientSource === 'CLINIC'
                ? (t('doctorCms.clinicPatient') || 'Clinic Patient')
                : (t('doctorCms.homelyservPatient') || 'HomelyServ Patient')} *
            </label>
            {patientSource === 'CLINIC' ? (
              <select className={INPUT_CLS} value={selectedClinicPatient}
                disabled={Boolean(presetClinicPatient) || disabled}
                onChange={(e) => setSelectedClinicPatient(e.target.value)}>
                <option value="">{t('doctorCms.selectClinicPatient') || 'Select a clinic patient'}</option>
                {clinicPatients.map((p) => (
                  <option key={p.patientId} value={p.patientId}>
                    {p.fullName} — {t('doctorCms.clinicPatient') || 'Clinic Patient'}
                  </option>
                ))}
              </select>
            ) : (
              <select className={INPUT_CLS} value={selectedHomelyPatient} disabled={disabled}
                onChange={(e) => setSelectedHomelyPatient(e.target.value)}>
                <option value="">{t('doctorCms.selectHomelyservPatient') || 'Select a patient'}</option>
                {homelyPatients.map((p) => {
                  const pid = p.patientId || p._id;
                  return (
                    <option key={pid} value={pid}>
                      {p.fullName || 'Patient'} — {t('doctorCms.homelyservPatient') || 'HomelyServ Patient'}
                    </option>
                  );
                })}
              </select>
            )}
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>{t('doctorCms.clinic') || 'Clinic'}</label>
              <select className={INPUT_CLS} value={clinicId} disabled={disabled}
                onChange={(e) => setClinicId(e.target.value)}>
                <option value="">{t('doctorCms.noClinic') || 'No clinic'}</option>
                {clinics.map((c) => (
                  <option key={c.clinicId || c._id} value={c.clinicId || c._id}>
                    {c.clinicName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>{t('doctorCms.appointmentType') || 'Type'}</label>
              <select className={INPUT_CLS} value={consultationType} disabled={disabled}
                onChange={(e) => setConsultationType(e.target.value)}>
                {/* Backend enum: DOCTOR_CONSULTATION_TYPES = CLINIC / HOME_VISIT / ONLINE.
                    `doctorSchedule.types` is the shared dictionary already used by
                    DoctorAppointments.jsx and DoctorPatients.jsx for these values. */}
                <option value="CLINIC">{t('doctorSchedule.types.CLINIC') || 'CLINIC'}</option>
                <option value="HOME_VISIT">{t('doctorSchedule.types.HOME_VISIT') || 'HOME_VISIT'}</option>
                <option value="ONLINE">{t('doctorSchedule.types.ONLINE') || 'ONLINE'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className={LABEL_CLS}>{t('doctorCms.date') || 'Date'} *</label>
              <input type="date" className={INPUT_CLS} value={dateStr} disabled={disabled}
                onChange={(e) => setDateStr(e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLS}>{t('doctorCms.startTime') || 'Start'}</label>
              <input type="time" className={INPUT_CLS} value={startTime} disabled={disabled}
                onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLS}>{t('doctorCms.duration') || 'Duration'}</label>
              <select className={INPUT_CLS} value={duration} disabled={disabled}
                onChange={(e) => setDuration(e.target.value)}>
                {['15', '30', '45', '60', '90'].map((m) => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>{t('doctorCms.reason') || 'Reason'}</label>
            <textarea rows={2} className={INPUT_CLS} value={reason} disabled={disabled}
              onChange={(e) => setReason(e.target.value)} />
          </div>

          {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={saving}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              {t('doctorCms.cancel') || 'Cancel'}
            </button>
            <button type="submit" disabled={disabled}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 px-4 py-2 text-xs font-semibold text-white">
              {saving || loadingOptions ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
              {t('doctorCms.createAppointment') || 'Create Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentCreateModal;

