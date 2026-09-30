// frontend/src/pages/DoctorClinicPatientDetails.jsx
// ============================================================
// CLINIC PATIENT FILE (Phase 2A)
//
// The doctor's own file for an independent ClinicPatient. Separate
// from DoctorPatientDetails.jsx, which assumes a HomelyServ User.
//
// TWO DISTINCT STORES, deliberately kept apart:
//   â€¢ Patient Information  -> ClinicPatient              (demographics)
//   â€¢ Medical Record       -> ClinicPatientMedicalRecord (persistent
//                            history the DOCTOR maintains)
//
// The medical record is the patient's PERSISTENT BACKGROUND only.
// It is NOT a consultation: no diagnosis history, no treatment plan,
// no exam findings, no visit symptoms/vitals, no prescriptions and no
// appointments live here. A "Future Clinical Activity" placeholder
// marks where those will appear in later phases.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import AppointmentCreateModal from '../components/doctor/cms/AppointmentCreateModal';
import VisitPaymentRow from '../components/doctor/VisitPaymentRow';
import {
  ArrowRight, Loader2, AlertCircle, Phone, Mail, MapPin, Stethoscope,
  User, Pencil, Save, X, CheckCircle2, History, StickyNote, CalendarClock
} from 'lucide-react';

// Appointments section (Phase 2B). Declared at module scope so its
// identity is stable and it cannot remount while editing the record.
const STATUS_STYLES = {
  PENDING: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  CONFIRMED: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  COMPLETED: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  CANCELLED: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  NO_SHOW: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
};

const fmtDate = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB');
};
const fmtTime = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// One appointment = one visit. The row shows the visit number and the payment
// state for THAT appointment only; a paid sibling visit never hides this control.
const AppointmentRow = ({ appt, notRecorded, visitNumber, paidIncome, paidLabel, unpaidLabel, visitLabel, patientId, onPaid }) => (
  <div className="py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-2">
          {visitNumber > 0 && (
            <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
              {visitLabel}
            </span>
          )}
          {fmtDate(appt.startsAt)} · {fmtTime(appt.startsAt)} – {fmtTime(appt.endsAt)}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {appt.clinic?.clinicName || notRecorded} · {appt.consultationType}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
          paidIncome
            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
        }`}>
          {paidIncome ? paidLabel : unpaidLabel}
        </span>
        <span className={`self-start sm:self-auto px-2 py-0.5 rounded-full text-[11px] font-medium border ${
          STATUS_STYLES[appt.status] || STATUS_STYLES.PENDING
        }`}>
          {appt.status}
        </span>
      </div>
    </div>
    <VisitPaymentRow
      appointment={appt}
      visitNumber={visitNumber}
      paidIncome={paidIncome}
      patientType="CLINIC"
      patientId={patientId}
      onPaid={onPaid}
    />
  </div>
);

const SEX_LABELS = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };
const SMOKING_LABELS = {
  NEVER: 'Never smoked',
  FORMER: 'Former smoker',
  CURRENT: 'Current smoker',
  UNKNOWN: 'Unknown'
};

const INPUT_CLS = 'w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500';
const LABEL_CLS = 'block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1';

const EMPTY_RECORD = {
  chronicConditions: [], allergies: [], currentMedications: [],
  previousSurgeries: [], familyHistory: '', smokingStatus: 'UNKNOWN',
  disabilityStatus: '', otherMedicalHistory: '', clinicalNotes: '',
  importantConditions: ''
};

// ------------------------------------------------------------
// Presentational helpers are declared at MODULE scope on purpose.
// Defining them inside DoctorClinicPatientDetails gave them a new
// function identity on every render, so React treated them as a
// different component type and remounted their subtree — which
// destroyed focus in the edit-mode inputs after every keystroke.
// Stable identity here keeps the focused DOM node mounted.
// ------------------------------------------------------------
const Field = ({ label, value, empty, notRecorded }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
      {value || empty || notRecorded}
    </span>
  </div>
);

const ListField = ({ label, items, notRecorded }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    {Array.isArray(items) && items.length > 0 ? (
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <li key={`${item}-${i}`} className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <span className="text-sm text-slate-400 dark:text-slate-500">{notRecorded}</span>
    )}
  </div>
);

const SectionCard = ({
  icon: Icon, title, editing, onEdit, onCancel, onSave, saving,
  editLabel, cancelLabel, saveLabel, children
}) => (
  <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <Icon size={16} className="text-red-500" />
        {title}
      </h2>
      {!editing ? (
        <button type="button" onClick={onEdit}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
          <Pencil size={13} />
          {editLabel}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} disabled={saving}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X size={13} />
            {cancelLabel}
          </button>
          <button type="button" onClick={onSave} disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saveLabel}
          </button>
        </div>
      )}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const DoctorClinicPatientDetails = () => {
  const { patientId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [record, setRecord] = useState(EMPTY_RECORD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // View/Edit state â€” two independent editors, same UX as Services & Fees.
  const [editingInfo, setEditingInfo] = useState(false);
  const [editingRecord, setEditingRecord] = useState(false);
  const [infoDraft, setInfoDraft] = useState(EMPTY_RECORD);
  const [recordDraft, setRecordDraft] = useState(EMPTY_RECORD);
  // Raw STRING text for the four list fields while editing. Keeping the
  // raw text (instead of a parsed array) is what allows normal spaces.
  const [listDraft, setListDraft] = useState({
    chronicConditions: '',
    allergies: '',
    currentMedications: '',
    previousSurgeries: ''
  });
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ---- Appointments (Phase 2B) ----
  const [upcomingAppts, setUpcomingAppts] = useState([]);
  const [pastAppts, setPastAppts] = useState([]);
  const [showCreateAppt, setShowCreateAppt] = useState(false);

  // ---- Per-visit payment state ----
  // appointmentId (string) -> the RECEIVED DoctorIncome for that visit.
  // Only RECEIVED counts: a PENDING or REFUNDED income leaves the visit payable.
  const [paidByAppointment, setPaidByAppointment] = useState({});

  const loadPaidIncome = useCallback(async () => {
    try {
      const res = await api.get('/api/doctor-accounts/income');
      const rows = Array.isArray(res.data?.income) ? res.data.income : [];
      const map = {};
      for (const row of rows) {
        if (row?.status !== 'RECEIVED') continue;
        const raw = row.appointmentId;
        const id = raw ? String(raw._id ? raw._id : raw) : '';
        if (id) map[id] = { amount: row.amount, currency: row.currency };
      }
      setPaidByAppointment(map);
    } catch (err) {
      // A payment list that cannot be read must not break the Patient File; the
      // backend still refuses a duplicate via its unique appointment index.
      console.error('Error loading visit payments:', err);
      setPaidByAppointment({});
    }
  }, []);

  // Visit numbering: an appointment IS a visit. The Upcoming and Past sections
  // are the SAME list split by time, so both are combined and numbered ONCE, by
  // `startsAt` ascending. The number depends ONLY on the appointment list, never
  // on a payment, so paying, refunding or adding a later appointment cannot
  // renumber an existing visit. `appointmentId` breaks ties deterministically.
  const { upcomingVisits, pastVisits } = useMemo(() => {
    const byStarts = (a, b) => {
      const at = new Date(a?.startsAt || 0).getTime();
      const bt = new Date(b?.startsAt || 0).getTime();
      const av = Number.isNaN(at) ? 0 : at;
      const bv = Number.isNaN(bt) ? 0 : bt;
      if (av !== bv) return av - bv;
      return String(a?.appointmentId || '').localeCompare(String(b?.appointmentId || ''));
    };
    const all = [...upcomingAppts, ...pastAppts].sort(byStarts);
    const numberOf = new Map(all.map((a, i) => [String(a?.appointmentId || ''), i + 1]));
    const decorate = (list) => list.map((a) => ({
      appointment: a,
      visitNumber: numberOf.get(String(a?.appointmentId || '')) || 0,
      paidIncome: paidByAppointment[String(a?.appointmentId || '')] || null
    }));
    return { upcomingVisits: decorate(upcomingAppts), pastVisits: decorate(pastAppts) };
  }, [upcomingAppts, pastAppts, paidByAppointment]);

  const loadAppointments = useCallback(async () => {
    try {
      const res = await api.get(`/api/doctors/clinic-patients/${patientId}/appointments`);
      setUpcomingAppts(Array.isArray(res.data?.upcoming) ? res.data.upcoming : []);
      setPastAppts(Array.isArray(res.data?.past) ? res.data.past : []);
    } catch {
      // A missing/failed appointments list must not break the Patient File.
      setUpcomingAppts([]);
      setPastAppts([]);
    }
  }, [patientId]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [patientRes, recordRes] = await Promise.all([
        api.get(`/api/doctors/clinic-patients/${patientId}`),
        api.get(`/api/doctors/clinic-patients/${patientId}/medical-record`)
      ]);
      const p = patientRes.data?.patient || null;
      setPatient(p);
      const r = recordRes.data?.record || EMPTY_RECORD;
      setRecord(r);
      setInfoDraft(p || EMPTY_RECORD);
      setRecordDraft(r);
    } catch (err) {
      setError(err.response?.data?.message || t('doctorCms.profileLoadError') || 'Failed to load clinic patient.');
    } finally {
      setLoading(false);
    }
  }, [patientId, t]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadAppointments();
      loadPaidIncome();
  }, [loadAppointments, loadPaidIncome]);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };


  // ---- Patient Information (ClinicPatient) ----
  const saveInfo = async () => {
    setSaveError('');
    try {
      setSavingInfo(true);
      const res = await api.put(`/api/doctors/clinic-patients/${patientId}`, {
        fullName: (infoDraft.fullName || '').trim(),
        phone: (infoDraft.phone || '').trim(),
        email: (infoDraft.email || '').trim(),
        dateOfBirth: infoDraft.dateOfBirth || null,
        sex: infoDraft.sex || null,
        address: (infoDraft.address || '').trim(),
        notes: (infoDraft.notes || '').trim()
      });
      setPatient(res.data?.patient || null);
      setEditingInfo(false);
      flash(t('doctorCms.clinicPatientUpdated') || 'Patient information updated');
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save patient information.');
    } finally {
      setSavingInfo(false);
    }
  };

  const cancelInfo = () => {
    setInfoDraft(patient || EMPTY_RECORD); // discard unsaved edits
    setEditingInfo(false);
    setSaveError('');
  };

  // ---- Medical Record (ClinicPatientMedicalRecord) ----
  const saveRecord = async () => {
    setSaveError('');
    try {
      setSavingRecord(true);
      // Parse the list fields HERE, at save time — never per keystroke.
      // Splitting is on newline only, so "high blood pressure" stays a
      // single item.
      const listPayload = LIST_FIELDS.reduce((acc, key) => {
        acc[key] = textToList(listDraft[key]);
        return acc;
      }, {});
      const res = await api.put(`/api/doctors/clinic-patients/${patientId}/medical-record`, {
        ...listPayload,
        familyHistory: recordDraft.familyHistory || '',
        smokingStatus: recordDraft.smokingStatus || 'UNKNOWN',
        disabilityStatus: recordDraft.disabilityStatus || '',
        otherMedicalHistory: recordDraft.otherMedicalHistory || '',
        clinicalNotes: recordDraft.clinicalNotes || '',
        importantConditions: recordDraft.importantConditions || ''
      });
      setRecord(res.data?.record || EMPTY_RECORD);
      setEditingRecord(false);
      flash(t('doctorCms.medicalRecordSaved') || 'Medical record saved');
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save medical record.');
    } finally {
      setSavingRecord(false);
    }
  };

  const cancelRecord = () => {
    setRecordDraft(record); // discard unsaved edits
    setListDraft(listToDraft(record)); // discard unsaved edits
    setEditingRecord(false);
    setSaveError('');
  };

  // Builds the raw-text editing draft from a saved record.
  const listToDraft = (r) =>
    LIST_FIELDS.reduce((acc, key) => {
      acc[key] = listToText(r?.[key]);
      return acc;
    }, { chronicConditions: '', allergies: '', currentMedications: '', previousSurgeries: '' });

  const startEditRecord = () => {
    setRecordDraft(record);
    setListDraft(listToDraft(record));
    setEditingRecord(true);
  };

  // List fields are edited as one entry per line.
  //
  // While EDITING, the raw textarea text is held as a STRING in
  // `listDraft` and never round-tripped through the array. Previously
  // the textarea was controlled by `listToText(textToList(value))` on
  // every keystroke; textToList() trims each entry, so a trailing
  // space typed mid-sentence was stripped and immediately written back
  // into the input. React overwrote the DOM value and deleted the
  // space, which is why spaces between words could not be typed.
  // Parsing now happens ONLY in saveRecord().
  const LIST_FIELDS = [
    'chronicConditions',
    'allergies',
    'currentMedications',
    'previousSurgeries'
  ];

  const listToText = (arr) => (Array.isArray(arr) ? arr.join('\n') : '');
  const textToList = (text) =>
    String(text || '').split('\n').map((s) => s.trim()).filter(Boolean);

  const formatDob = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB');
  };


  const notRecorded = t('doctorCms.clinicPatientNotRecorded') || 'Not recorded';
  const editRecordLabel = t('doctorCms.editMedicalRecord') || 'Edit Medical Record';
  const cancelLabel = t('doctorCms.cancel') || 'Cancel';
  const saveLabel = t('doctorCms.saveChanges') || 'Save Changes';

  const dob = formatDob(patient?.dateOfBirth);
  const age = patient?.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <DashboardHeader title={patient?.fullName || (t('doctorCms.clinicPatientDetails') || 'Clinic Patient')} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        )}

        {notice && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>
          </div>
        )}

        {saveError && (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{saveError}</p>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-red-600 mb-2" />
            <p className="text-sm text-gray-500">{t('doctorCms.loading') || 'Loading...'}</p>
          </div>
        ) : patient ? (
          <>
            {/* ---------- Header ---------- */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xl shrink-0">
                  {(patient.fullName || 'P').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                      {patient.fullName}
                    </h1>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      patient.isActive !== false
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}>
                      {patient.isActive !== false
                        ? (t('doctorCms.clinicPatientActive') || 'Active')
                        : (t('doctorCms.clinicPatientInactive') || 'Inactive')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {[dob, age !== null ? `${age} yrs` : null, patient.sex ? (SEX_LABELS[patient.sex] || patient.sex) : null]
                      .filter(Boolean).join(' • ') || (t('doctorCms.clinicPatientNotRecorded') || 'Not recorded')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {patient.phone && <span className="inline-flex items-center gap-1"><Phone size={12} />{patient.phone}</span>}
                    {patient.email && <span className="inline-flex items-center gap-1"><Mail size={12} />{patient.email}</span>}
                    {patient.address && <span className="inline-flex items-center gap-1"><MapPin size={12} />{patient.address}</span>}
                  </div>
                </div>
              </div>
            </div>


            {/* ---------- Patient Information (ClinicPatient) ---------- */}
            <SectionCard
              icon={User}
              title={t('doctorCms.patientInformation') || 'Patient Information'}
              editLabel={t('doctorCms.editPatient') || 'Edit Patient'}
              cancelLabel={cancelLabel}
              saveLabel={saveLabel}
              editing={editingInfo}
              onEdit={() => { setInfoDraft(patient); setEditingInfo(true); }}
              onCancel={cancelInfo}
              onSave={saveInfo}
              saving={savingInfo}
            >
              {!editingInfo ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Field label={t('doctorCms.clinicPatientName') || 'Full Name'} value={patient.fullName} notRecorded={notRecorded} />
                  <Field label={t('doctorCms.clinicPatientPhone') || 'Phone'} value={patient.phone} notRecorded={notRecorded} />
                  <Field label={t('doctorCms.clinicPatientEmail') || 'Email'} value={patient.email} notRecorded={notRecorded} />
                  <Field label={t('doctorCms.clinicPatientDob') || 'Date of Birth'} value={dob} notRecorded={notRecorded} />
                  <Field label={t('doctorCms.clinicPatientSex') || 'Sex'}
                    value={patient.sex ? (SEX_LABELS[patient.sex] || patient.sex) : ''} notRecorded={notRecorded} />
                  <Field label={t('doctorCms.clinicPatientAddress') || 'Address'} value={patient.address} notRecorded={notRecorded} />
                  {patient.notes && (
                    <div className="col-span-2 sm:col-span-3">
                      <Field label={t('doctorCms.clinicPatientNotes') || 'Notes'} value={patient.notes} notRecorded={notRecorded} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLS}>{t('doctorCms.clinicPatientName') || 'Full Name'} *</label>
                    <input className={INPUT_CLS} value={infoDraft.fullName || ''}
                      onChange={(e) => setInfoDraft((d) => ({ ...d, fullName: e.target.value }))} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>{t('doctorCms.clinicPatientPhone') || 'Phone'}</label>
                    <input className={INPUT_CLS} value={infoDraft.phone || ''}
                      onChange={(e) => setInfoDraft((d) => ({ ...d, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>{t('doctorCms.clinicPatientEmail') || 'Email'}</label>
                    <input className={INPUT_CLS} value={infoDraft.email || ''}
                      onChange={(e) => setInfoDraft((d) => ({ ...d, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>{t('doctorCms.clinicPatientDob') || 'Date of Birth'}</label>
                    <input type="date" className={INPUT_CLS}
                      value={infoDraft.dateOfBirth ? String(infoDraft.dateOfBirth).slice(0, 10) : ''}
                      onChange={(e) => setInfoDraft((d) => ({ ...d, dateOfBirth: e.target.value }))} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>{t('doctorCms.clinicPatientSex') || 'Sex'}</label>
                    <select className={INPUT_CLS} value={infoDraft.sex || ''}
                      onChange={(e) => setInfoDraft((d) => ({ ...d, sex: e.target.value }))}>
                      <option value="">{t('doctorCms.clinicPatientSexUnset') || 'Not specified'}</option>
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLS}>{t('doctorCms.clinicPatientAddress') || 'Address'}</label>
                    <input className={INPUT_CLS} value={infoDraft.address || ''}
                      onChange={(e) => setInfoDraft((d) => ({ ...d, address: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLS}>{t('doctorCms.clinicPatientNotes') || 'Notes'}</label>
                    <textarea rows={2} className={INPUT_CLS} value={infoDraft.notes || ''}
                      onChange={(e) => setInfoDraft((d) => ({ ...d, notes: e.target.value }))} />
                  </div>
                </div>
              )}
            </SectionCard>


            {/* ---------- Medical History (persistent, doctor-maintained) ---------- */}
            <SectionCard
              icon={History}
              title={t('doctorCms.medicalHistory') || 'Medical History'}
              editLabel={editRecordLabel}
              cancelLabel={cancelLabel}
              saveLabel={saveLabel}
              editing={editingRecord}
              onEdit={startEditRecord}
              onCancel={cancelRecord}
              onSave={saveRecord}
              saving={savingRecord}
            >
              {!editingRecord ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ListField label={t('doctorCms.chronicConditions') || 'Chronic Conditions'} items={record.chronicConditions} notRecorded={notRecorded} />
                  <ListField label={t('doctorCms.allergies') || 'Allergies'} items={record.allergies} notRecorded={notRecorded} />
                  <ListField label={t('doctorCms.currentMedications') || 'Current Medications'} items={record.currentMedications} notRecorded={notRecorded} />
                  <ListField label={t('doctorCms.previousSurgeries') || 'Previous Surgeries'} items={record.previousSurgeries} notRecorded={notRecorded} />
                  <Field label={t('doctorCms.familyHistory') || 'Family History'} value={record.familyHistory} notRecorded={notRecorded} />
                  <Field label={t('doctorCms.smokingStatus') || 'Smoking Status'}
                    value={SMOKING_LABELS[record.smokingStatus] || record.smokingStatus} notRecorded={notRecorded} />
                  <Field label={t('doctorCms.disabilityStatus') || 'Disability Status'} value={record.disabilityStatus} notRecorded={notRecorded} />
                  <div className="sm:col-span-2">
                    <Field label={t('doctorCms.otherMedicalHistory') || 'Other Medical History'} value={record.otherMedicalHistory} notRecorded={notRecorded} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ['chronicConditions', t('doctorCms.chronicConditions') || 'Chronic Conditions'],
                    ['allergies', t('doctorCms.allergies') || 'Allergies'],
                    ['currentMedications', t('doctorCms.currentMedications') || 'Current Medications'],
                    ['previousSurgeries', t('doctorCms.previousSurgeries') || 'Previous Surgeries']
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className={LABEL_CLS}>{label}</label>
                      <textarea rows={2} className={INPUT_CLS}
                        placeholder={t('doctorCms.onePerLine') || 'One per line'}
                        value={listDraft[key] ?? ''}
                        onChange={(e) => setListDraft((d) => ({ ...d, [key]: e.target.value }))} />
                    </div>
                  ))}
                  <div>
                    <label className={LABEL_CLS}>{t('doctorCms.familyHistory') || 'Family History'}</label>
                    <textarea rows={2} className={INPUT_CLS} value={recordDraft.familyHistory || ''}
                      onChange={(e) => setRecordDraft((d) => ({ ...d, familyHistory: e.target.value }))} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>{t('doctorCms.smokingStatus') || 'Smoking Status'}</label>
                    <select className={INPUT_CLS} value={recordDraft.smokingStatus || 'UNKNOWN'}
                      onChange={(e) => setRecordDraft((d) => ({ ...d, smokingStatus: e.target.value }))}>
                      {Object.entries(SMOKING_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLS}>{t('doctorCms.disabilityStatus') || 'Disability Status'}</label>
                    <input className={INPUT_CLS} value={recordDraft.disabilityStatus || ''}
                      onChange={(e) => setRecordDraft((d) => ({ ...d, disabilityStatus: e.target.value }))} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>{t('doctorCms.otherMedicalHistory') || 'Other Medical History'}</label>
                    <textarea rows={2} className={INPUT_CLS} value={recordDraft.otherMedicalHistory || ''}
                      onChange={(e) => setRecordDraft((d) => ({ ...d, otherMedicalHistory: e.target.value }))} />
                  </div>
                </div>
              )}
            </SectionCard>


            {/* ---------- Clinical Summary (persistent) ---------- */}
            <SectionCard
              icon={StickyNote}
              title={t('doctorCms.clinicalSummary') || 'Clinical Summary'}
              editLabel={editRecordLabel}
              cancelLabel={cancelLabel}
              saveLabel={saveLabel}
              editing={editingRecord}
              onEdit={startEditRecord}
              onCancel={cancelRecord}
              onSave={saveRecord}
              saving={savingRecord}
            >
              {!editingRecord ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t('doctorCms.importantConditions') || 'Important Conditions'} value={record.importantConditions} notRecorded={notRecorded} />
                  <Field label={t('doctorCms.clinicalNotes') || 'Clinical Notes'} value={record.clinicalNotes} notRecorded={notRecorded} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className={LABEL_CLS}>{t('doctorCms.importantConditions') || 'Important Conditions'}</label>
                    <textarea rows={2} className={INPUT_CLS} value={recordDraft.importantConditions || ''}
                      onChange={(e) => setRecordDraft((d) => ({ ...d, importantConditions: e.target.value }))} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>{t('doctorCms.clinicalNotes') || 'Clinical Notes'}</label>
                    <textarea rows={3} className={INPUT_CLS} value={recordDraft.clinicalNotes || ''}
                      onChange={(e) => setRecordDraft((d) => ({ ...d, clinicalNotes: e.target.value }))} />
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ---------- Appointments (Phase 2B) ---------- */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <CalendarClock size={16} className="text-red-500" />
                  {t('doctorCms.appointments') || 'Appointments'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateAppt(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700"
                >
                  <Pencil size={13} />
                  {t('doctorCms.newAppointment') || 'New Appointment'}
                </button>
              </div>
              <div className="px-5 py-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 pt-3">
                  {t('doctorCms.upcomingAppointments') || 'Upcoming'}
                </p>
                {upcomingVisits.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 py-3">{notRecorded}</p>
                ) : (
                  upcomingVisits.map(({ appointment: a, visitNumber, paidIncome }) => (
                    <AppointmentRow
                      key={a.appointmentId}
                      appt={a}
                      notRecorded={notRecorded}
                      visitNumber={visitNumber}
                      paidIncome={paidIncome}
                      paidLabel={t('doctorPatients.paid')}
                      unpaidLabel={t('doctorPatients.unpaid')}
                      visitLabel={t('doctorPatients.visitLabel', { n: visitNumber })}
                      patientId={patientId}
                      onPaid={loadPaidIncome}
                    />
                  ))
                )}

                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 pt-4">
                  {t('doctorCms.pastAppointments') || 'Recent / Past'}
                </p>
                {pastVisits.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 py-3">{notRecorded}</p>
                ) : (
                  pastVisits.map(({ appointment: a, visitNumber, paidIncome }) => (
                    <AppointmentRow
                      key={a.appointmentId}
                      appt={a}
                      notRecorded={notRecorded}
                      visitNumber={visitNumber}
                      paidIncome={paidIncome}
                      paidLabel={t('doctorPatients.paid')}
                      unpaidLabel={t('doctorPatients.unpaid')}
                      visitLabel={t('doctorPatients.visitLabel', { n: visitNumber })}
                      patientId={patientId}
                      onPaid={loadPaidIncome}
                    />
                  ))
                )}
              </div>
            </section>

            {/* ---------- Clinical Consultations (ClinicPatient) ---------- */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <Stethoscope size={16} className="text-red-500" />
                    {t('doctorCms.clinicalConsultations') || 'Clinical Consultations'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('doctorCms.clinicalConsultationsDesc')
                      || 'Record a consultation for this patient using one of their eligible appointments.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/doctor-cms/clinic-patients/${patientId}/consultations`)}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2.5 transition-colors"
                >
                  <Stethoscope size={15} />
                  {t('doctorCms.openConsultations') || 'Open Consultations'}
                </button>
              </div>
            </section>

            {/* ---------- Future Clinical Activity (placeholder only) ----------
                Prescriptions and clinical timelines are deliberately NOT built
                here yet; they are a later phase. ---------- */}
            <section className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {t('doctorCms.futureClinicalActivity') || 'Clinical Activity'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('doctorCms.futureConsultationsDesc')
                  || 'Diagnoses, treatment plans and prescriptions for this patient will appear here in a later release.'}
              </p>
            </section>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => navigate('/doctor-cms/patients')}
          className="inline-flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400"
        >
          <ArrowRight size={16} className="rotate-180 rtl:rotate-0" />
          {t('doctorCms.back') || 'Back to Patients'}
        </button>

        {/* Phase 2B — reuses the SAME creation component as the
            Appointments page, with this Clinic Patient preselected. */}
        <AppointmentCreateModal
          open={showCreateAppt}
          onClose={() => setShowCreateAppt(false)}
          onCreated={async () => {
            await loadAppointments();
            flash(t('doctorCms.appointmentCreated') || 'Appointment created successfully.');
          }}
          presetClinicPatient={patient}
        />
      </div>
    </DashboardLayout>
  );
};

export default DoctorClinicPatientDetails;

