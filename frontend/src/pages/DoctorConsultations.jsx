// frontend/src/pages/DoctorConsultations.jsx
// Doctor Clinical Consultation Records management for a patient (Phase 8).
// Allows viewing consultation history, creating new DRAFT for confirmed/completed appointments,
// editing/saving/deleting DRAFTs, signing records (immutable), and creating amendments.
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import api from '../utils/api';
import {
  FileText,
  Calendar,
  Clock,
  Building2,
  Home,
  Video,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity,
  Heart,
  Edit,
  Save,
  FileCheck,
  FileEdit,
  History,
  X,
  ShieldAlert
} from 'lucide-react';

// The appointments endpoint returns ISO strings (`startsAt` / `endsAt`),
// so format them here rather than reading non-existent `appointmentDate`
// / `startTime` / `endTime` fields.
const formatAptDate = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB');
};
const formatAptTime = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const DoctorConsultations = () => {
  // The patient SOURCE is explicit in the route, never inferred:
  //   /doctor-cms/patients/:patientId/consultations            -> HomelyServ
  //   /doctor-cms/clinic-patients/:patientId/consultations     -> ClinicPatient
  //
  // Both routes declare their id as `:patientId`, so the SOURCE must be read
  // from the path prefix. Previously this read a `clinicPatientId` param that
  // no route declares, so `isClinicPatient` was always false and ClinicPatients
  // were sent to the HomelyServ endpoints (which correctly 404 -> "Patient not
  // found"). The prefix is the same explicit marker the routes already use.
  const { patientId } = useParams();
  const location = useLocation();

  const isClinicPatient = location.pathname.startsWith(
    '/doctor-cms/clinic-patients/'
  );

  // For a ClinicPatient the id arrives as `:patientId` but must be used as the
  // clinicPatientId reference; for a HomelyServ patient `patientId` is used as-is.
  const clinicPatientId = isClinicPatient ? patientId : undefined;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Selected consultation or active editor mode
  // mode: 'list' | 'create' | 'edit' | 'view'
  const [mode, setMode] = useState('list');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    appointmentId: '',
    chiefComplaint: '',
    history: '',
    examination: '',
    diagnosis: [],
    treatmentPlan: '',
    vitals: {
      bloodPressure: '',
      heartRate: '',
      respiratoryRate: '',
      temperature: '',
      oxygenSaturation: '',
      weightKg: '',
      heightCm: ''
    }
  });

  const [diagnosisDraft, setDiagnosisDraft] = useState({ name: '', icdCode: '' });

  // Endpoint helpers. For a ClinicPatient the patient id is a QUERY param,
  // so the record id must go in the PATH and the query string last:
  //   .../clinic-patients/consultations/<id>?clinicPatientId=<cp>
  // HomelyServ keeps the existing path shape untouched.
  const consultBase = isClinicPatient
    ? '/api/doctors/clinic-patients/consultations'
    : `/api/doctors/patients/${patientId}/consultations`;
  const consultQuery = isClinicPatient
    ? `?clinicPatientId=${encodeURIComponent(clinicPatientId)}`
    : '';
  const consultListUrl = `${consultBase}${consultQuery}`;
  const consultRecordUrl = (id, suffix = '') =>
    `${consultBase}/${id}${suffix}${consultQuery}`;

  // The consultation list endpoint deliberately 404s when the patient has no
  // CONFIRMED/COMPLETED appointment yet (the backend relationship gate). That is
  // NOT a missing patient, so it is never reported as "Patient not found".
  const isRelationshipRequired = (err) => (
    err?.response?.status === 404 &&
    String(err?.response?.data?.message || '').trim().toLowerCase() === 'patient not found'
  );

  // A consultation list 404 can also mean the request came from a doctor who does
  // not own this ClinicPatient. Matched exactly so unrelated errors are untouched.
  const isClinicPatientNotFound = (err) => (
    err?.response?.status === 404 &&
    String(err?.response?.data?.message || '').trim().toLowerCase() === 'clinic patient not found'
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    if (isClinicPatient) {
      try {
        // ClinicPatient: patient + appointments + consultations, all scoped
        // to the logged-in doctor by the backend.
        //
        // Each request is handled on its own. Only the PATIENT lookup may report
        // "Patient not found"; the consultation list 404s for a patient who simply
        // has no confirmed/completed appointment yet, and must not blank the page.
        const [patientRes, apptsRes, consultsRes] = await Promise.all([
          api.get(`/api/doctors/clinic-patients/${clinicPatientId}`).catch((err) => {
            if (err.response?.status === 404) {
              setErrorMessage(t('doctorPatients.patientNotFound') || 'Patient not found');
            } else {
              setErrorMessage(
                err.response?.data?.message || t('doctorConsultations.loadError') || 'Failed to load consultations.'
              );
            }
            return null;
          }),
          api.get(`/api/doctors/clinic-patients/${clinicPatientId}/appointments`).catch((err) => {
            setErrorMessage(
              err.response?.data?.message || t('doctorConsultations.loadError') || 'Failed to load consultations.'
            );
            return null;
          }),
          api.get(consultListUrl).catch((err) => {
            // The backend relationship gate. The patient loaded fine.
            setErrorMessage(
              isRelationshipRequired(err)
                ? (t('doctorCms.consultationRelationshipRequired')
                  || 'A consultation is available only after the patient has a confirmed or completed appointment.')
                : isClinicPatientNotFound(err)
                  ? (t('doctorCms.clinicPatientNotFound') || 'Clinic patient not found.')
                  : (err.response?.data?.message || t('doctorConsultations.loadError') || 'Failed to load consultations.')
            );
            return null;
          })
        ]);

        setPatient(patientRes?.data?.patient || null);
        // The ClinicPatient appointments endpoint returns { upcoming, past }.
        const up = Array.isArray(apptsRes?.data?.upcoming) ? apptsRes.data.upcoming : [];
        const past = Array.isArray(apptsRes?.data?.past) ? apptsRes.data.past : [];
        setAppointments([...up, ...past].map((a) => ({
          appointmentId: a.appointmentId,
          startsAt: a.startsAt,
          endsAt: a.endsAt,
          status: a.status,
          consultationType: a.consultationType
        })));
        setConsultations(
          Array.isArray(consultsRes?.data?.consultations) ? consultsRes.data.consultations : []
        );
      } finally {
        setLoading(false);
      }
      return;
    }
    // ---- HomelyServ patient: existing behaviour, unchanged ----
    try {
      const [patientRes, apptsRes, consultsRes] = await Promise.all([
        api.get(`/api/doctors/patients/${patientId}`),
        api.get(`/api/doctors/patients/${patientId}/appointments`),
        api.get(consultListUrl)
      ]);

      setPatient(patientRes.data?.patient || null);
      setAppointments(Array.isArray(apptsRes.data?.appointments) ? apptsRes.data.appointments : []);
      setConsultations(Array.isArray(consultsRes.data?.consultations) ? consultsRes.data.consultations : []);
    } catch (err) {
      if (err.response?.status === 404) {
        setErrorMessage(t('doctorPatients.patientNotFound') || 'Patient not found');
      } else {
        setErrorMessage(
          err.response?.data?.message || t('doctorConsultations.loadError') || 'Failed to load consultations.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [patientId, clinicPatientId, isClinicPatient, consultListUrl, t]);

  useEffect(() => {
    if (patientId || clinicPatientId) {
      loadData();
    }
  }, [loadData, patientId, clinicPatientId]);

  // Appointments eligible to back a new consultation. Shared by the
  // auto-select logic and the dropdown so both agree.
  const eligibleAppointments = appointments.filter(
    (a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED'
  );

  // Open Create Mode.
  // The appointment is NEVER auto-invented: the doctor must explicitly
  // choose one from the eligible list. Preselecting happens only when
  // exactly one eligible appointment exists.
  // NOTE: the appointments endpoints return `appointmentId` (not `_id`).
  const handleOpenCreate = () => {
    const onlyOne =
      eligibleAppointments.length === 1 ? eligibleAppointments[0]?.appointmentId : '';
    setFormData({
      appointmentId: onlyOne || '',
      chiefComplaint: '',
      history: '',
      examination: '',
      diagnosis: [],
      treatmentPlan: '',
      vitals: {
        bloodPressure: '',
        heartRate: '',
        respiratoryRate: '',
        temperature: '',
        oxygenSaturation: '',
        weightKg: '',
        heightCm: ''
      }
    });
    setDiagnosisDraft({ name: '', icdCode: '' });
    setSelectedRecord(null);
    setMode('create');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Open View Mode
  const handleOpenView = (record) => {
    setSelectedRecord(record);
    setMode('view');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Open Edit Mode (DRAFT only)
  const handleOpenEdit = (record) => {
    if (record.status !== 'DRAFT') return;
    setSelectedRecord(record);
    setFormData({
      appointmentId: record.appointmentId?._id || record.appointmentId || '',
      chiefComplaint: record.chiefComplaint || '',
      history: record.history || '',
      examination: record.examination || '',
      diagnosis: Array.isArray(record.diagnosis) ? record.diagnosis.map((d) => ({ ...d })) : [],
      treatmentPlan: record.treatmentPlan || '',
      vitals: {
        bloodPressure: record.vitals?.bloodPressure || '',
        heartRate: record.vitals?.heartRate ?? '',
        respiratoryRate: record.vitals?.respiratoryRate ?? '',
        temperature: record.vitals?.temperature ?? '',
        oxygenSaturation: record.vitals?.oxygenSaturation ?? '',
        weightKg: record.vitals?.weightKg ?? '',
        heightCm: record.vitals?.heightCm ?? ''
      }
    });
    setDiagnosisDraft({ name: '', icdCode: '' });
    setMode('edit');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Diagnosis handlers
  const handleAddDiagnosis = () => {
    if (!diagnosisDraft.name.trim()) return;
    setFormData((prev) => ({
      ...prev,
      diagnosis: [
        ...prev.diagnosis,
        { name: diagnosisDraft.name.trim(), icdCode: diagnosisDraft.icdCode.trim() }
      ]
    }));
    setDiagnosisDraft({ name: '', icdCode: '' });
  };

  const handleRemoveDiagnosis = (index) => {
    setFormData((prev) => ({
      ...prev,
      diagnosis: prev.diagnosis.filter((_, i) => i !== index)
    }));
  };

  // Save DRAFT (Create or Update)
  const handleSaveDraft = async () => {
    // A consultation is ALWAYS tied to a real appointment. For create this is
    // the selected dropdown value; for update it comes from the loaded record.
    if (mode === 'create' && !formData.appointmentId) {
      setErrorMessage(
        t('doctorConsultations.selectAppointmentRequired') ||
          'Please select an appointment before saving.'
      );
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        appointmentId: formData.appointmentId,
        chiefComplaint: formData.chiefComplaint,
        history: formData.history,
        examination: formData.examination,
        diagnosis: formData.diagnosis,
        treatmentPlan: formData.treatmentPlan,
        vitals: formData.vitals
      };

      if (mode === 'create') {
        const res = await api.post(consultListUrl, payload);
        if (res.data?.success) {
          setSuccessMessage(t('doctorConsultations.draftCreated') || 'Consultation draft created.');
          await loadData();
          handleOpenView(res.data.consultation);
        }
      } else if (mode === 'edit' && selectedRecord) {
        const res = await api.put(
          consultRecordUrl(selectedRecord._id),
          payload
        );
        if (res.data?.success) {
          setSuccessMessage(t('doctorConsultations.draftUpdated') || 'Consultation draft updated.');
          await loadData();
          handleOpenView(res.data.consultation);
        }
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorConsultations.saveError') || 'Failed to save draft.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Sign Consultation
  const handleSign = async () => {
    if (!selectedRecord) return;
    if (!window.confirm(t('doctorConsultations.signConfirm') || 'Are you sure you want to sign this consultation? Once signed, it becomes immutable and cannot be edited.')) {
      return;
    }
    setSigning(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.post(
        consultRecordUrl(selectedRecord._id, '/sign')
      );
      if (res.data?.success) {
        setSuccessMessage(t('doctorConsultations.recordSigned') || 'Consultation record signed successfully.');
        await loadData();
        handleOpenView(res.data.consultation);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorConsultations.signError') || 'Failed to sign consultation.'
      );
    } finally {
      setSigning(false);
    }
  };

  // Create Amendment from Signed Record
  const handleCreateAmendment = async () => {
    if (!selectedRecord) return;
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.post(
        consultRecordUrl(selectedRecord._id, '/amend')
      );
      if (res.data?.success) {
        setSuccessMessage(t('doctorConsultations.amendmentCreated') || 'Draft amendment created.');
        await loadData();
        handleOpenEdit(res.data.consultation);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorConsultations.amendError') || 'Failed to create amendment.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete DRAFT
  const handleDeleteDraft = async () => {
    if (!selectedRecord || selectedRecord.status !== 'DRAFT') return;
    if (!window.confirm(t('doctorConsultations.deleteDraftConfirm') || 'Delete this consultation draft?')) {
      return;
    }
    setDeleting(true);
    setErrorMessage('');
    try {
      const res = await api.delete(
        consultRecordUrl(selectedRecord._id)
      );
      if (res.data?.success) {
        setSuccessMessage(t('doctorConsultations.draftDeleted') || 'Consultation draft deleted.');
        await loadData();
        setMode('list');
        setSelectedRecord(null);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorConsultations.deleteError') || 'Failed to delete draft.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'DRAFT') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          {t('doctorConsultations.statuses.DRAFT') || 'Draft'}
        </span>
      );
    }
    if (status === 'SIGNED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          {t('doctorConsultations.statuses.SIGNED') || 'Signed'}
        </span>
      );
    }
    if (status === 'AMENDED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          {t('doctorConsultations.statuses.AMENDED') || 'Amended'}
        </span>
      );
    }
    return null;
  };

  // Back destination depends on the SOURCE. A ClinicPatient returns to its
  // own Patient File; a HomelyServ patient keeps the existing behavior.
  const backTo = isClinicPatient
    ? `/doctor-cms/clinic-patients/${clinicPatientId}`
    : `/doctor-patients/${patientId}`;

  // The identity label: HomelyServ uses `patientName`, ClinicPatient uses
  // `fullName` (both endpoints verified against the real API responses).
  const patientDisplayName =
    (patient && (patient.patientName || patient.fullName)) || '';

  const backLabel = isClinicPatient
    ? (t('doctorCms.backToClinicPatientFile') || 'Back to Patient File')
    : (t('doctorPatients.backToPatients') || 'Back to Patients');

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('doctorConsultations.pageTitle') || 'Clinical Consultations'}
        subtitle={
          patient
            ? `${t('doctorConsultations.patient') || 'Patient'}: ${patientDisplayName}`
            : t('doctorConsultations.pageSubtitle') || 'Doctor clinical records and notes.'
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (mode !== 'list') {
                setMode('list');
                setSelectedRecord(null);
              } else {
                navigate(backTo);
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>
              {mode !== 'list'
                ? t('doctorConsultations.backToList') || 'Back to Consultations'
                : backLabel}
            </span>
          </button>

          {mode === 'list' && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('doctorConsultations.newConsultation') || 'New Consultation'}</span>
            </button>
          )}
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{errorMessage}</p>
          </div>
        )}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-slate-500">{t('doctorConsultations.loading') || 'Loading consultations...'}</p>
          </div>
        )}

        {/* ---------------- MODE 1: LIST CONSULTATIONS ---------------- */}
        {!loading && mode === 'list' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  {t('doctorConsultations.consultationHistory') || 'Consultation History'}
                </h3>
                <span className="text-xs text-slate-500">
                  {consultations.length} {t('doctorConsultations.records') || 'Records'}
                </span>
              </div>

              {consultations.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('doctorConsultations.noConsultations') || 'No clinical consultations recorded yet'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {t('doctorConsultations.noConsultationsDesc') ||
                      'Create a clinical consultation record for any confirmed or completed appointment.'}
                  </p>
                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t('doctorConsultations.createFirst') || 'Create Consultation'}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {consultations.map((rec) => (
                    <div
                      key={rec._id}
                      className="py-4 first:pt-4 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                            {rec.appointmentId?.appointmentDate ||
                              new Date(rec.createdAt).toLocaleDateString()}
                          </span>
                          {getStatusBadge(rec.status)}
                          {rec.amendedRecordId && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded">
                              <History className="w-3 h-3" />
                              {t('doctorConsultations.amendment') || 'Amendment'}
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-md">
                          {rec.chiefComplaint || rec.diagnosis?.[0]?.name || t('doctorConsultations.generalConsultation') || 'General Consultation'}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          {rec.consultationType && (
                            <span>{rec.consultationType}</span>
                          )}
                          {rec.signedAt && (
                            <span>
                              {t('doctorConsultations.signedAt') || 'Signed'}:{' '}
                              {new Date(rec.signedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenView(rec)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          {t('doctorConsultations.viewRecord') || 'View'}
                        </button>
                        {rec.status === 'DRAFT' && (
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                          >
                            {t('doctorConsultations.editDraft') || 'Edit Draft'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- MODE 2 & 3: FORM EDITOR (CREATE OR EDIT DRAFT) ---------------- */}
        {!loading && (mode === 'create' || mode === 'edit') && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {mode === 'create'
                      ? t('doctorConsultations.newDraft') || 'New Consultation Draft'
                      : t('doctorConsultations.editDraft') || 'Edit Consultation Draft'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('doctorConsultations.draftNotice') || 'Drafts can be modified until signed. Signing makes the record immutable.'}
                  </p>
                </div>
                {mode === 'edit' && selectedRecord?.status === 'DRAFT' && (
                  <button
                    onClick={handleDeleteDraft}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting ? t('common.deleting') || 'Deleting...' : t('doctorConsultations.deleteDraft') || 'Delete Draft'}
                  </button>
                )}
              </div>

              {/* Appointment Selection (Create Mode) */}
              {mode === 'create' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('doctorConsultations.selectAppointment') || 'Appointment (CONFIRMED or COMPLETED) *'}
                  </label>
                  <select
                    value={formData.appointmentId}
                    onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">{t('doctorConsultations.chooseAppointment') || 'Select appointment...'}</option>
                    {eligibleAppointments.map((a) => (
                      <option key={a.appointmentId} value={a.appointmentId}>
                        {formatAptDate(a.startsAt)} ({formatAptTime(a.startsAt)} - {formatAptTime(a.endsAt)}) — {a.consultationType} [{a.status}]
                      </option>
                    ))}
                  </select>
                  {eligibleAppointments.length === 0 && (
                    <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                      {t('doctorConsultations.appointmentRequiredToCreate')
                        || 'An eligible appointment (CONFIRMED or COMPLETED) is required before a consultation can be created. Book an appointment first.'}
                    </p>
                  )}
                </div>
              )}

              {/* Clinical Notes Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('doctorConsultations.chiefComplaint') || 'Chief Complaint'}
                  </label>
                  <textarea
                    rows="2"
                    maxLength="2000"
                    value={formData.chiefComplaint}
                    onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                    placeholder={t('doctorConsultations.chiefComplaintPlaceholder') || 'Primary symptoms or reason for visit...'}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('doctorConsultations.history') || 'Clinical History'}
                  </label>
                  <textarea
                    rows="3"
                    maxLength="10000"
                    value={formData.history}
                    onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                    placeholder={t('doctorConsultations.historyPlaceholder') || 'Detailed history of presenting illness, past medical context...'}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('doctorConsultations.examination') || 'Physical Examination'}
                  </label>
                  <textarea
                    rows="3"
                    maxLength="10000"
                    value={formData.examination}
                    onChange={(e) => setFormData({ ...formData, examination: e.target.value })}
                    placeholder={t('doctorConsultations.examinationPlaceholder') || 'Clinical findings, inspection, palpation, auscultation...'}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Structured Diagnosis */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('doctorConsultations.diagnosis') || 'Diagnosis'}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input
                      type="text"
                      maxLength="300"
                      placeholder={t('doctorConsultations.diagnosisName') || 'Diagnosis name...'}
                      value={diagnosisDraft.name}
                      onChange={(e) => setDiagnosisDraft({ ...diagnosisDraft, name: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="text"
                      maxLength="30"
                      placeholder={t('doctorConsultations.icdCode') || 'ICD Code (optional)'}
                      value={diagnosisDraft.icdCode}
                      onChange={(e) => setDiagnosisDraft({ ...diagnosisDraft, icdCode: e.target.value })}
                      className="w-full sm:w-40 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddDiagnosis}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-medium"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {formData.diagnosis.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.diagnosis.map((d, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        >
                          <strong>{d.name}</strong>
                          {d.icdCode && <span className="opacity-70">({d.icdCode})</span>}
                          <button
                            type="button"
                            onClick={() => handleRemoveDiagnosis(idx)}
                            className="hover:text-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('doctorConsultations.treatmentPlan') || 'Treatment Plan & Recommendations'}
                  </label>
                  <textarea
                    rows="3"
                    maxLength="10000"
                    value={formData.treatmentPlan}
                    onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                    placeholder={t('doctorConsultations.treatmentPlanPlaceholder') || 'Doctor clinical management plan, lifestyle instructions...'}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Vitals Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  {t('doctorConsultations.vitals') || 'Vitals (Optional)'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      {t('doctorConsultations.bloodPressure') || 'Blood Pressure'}
                    </label>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={formData.vitals.bloodPressure}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitals: { ...formData.vitals, bloodPressure: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      {t('doctorConsultations.heartRate') || 'Heart Rate (bpm)'}
                    </label>
                    <input
                      type="number"
                      placeholder="72"
                      value={formData.vitals.heartRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitals: { ...formData.vitals, heartRate: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      {t('doctorConsultations.temperature') || 'Temp (°C)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="36.8"
                      value={formData.vitals.temperature}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitals: { ...formData.vitals, temperature: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      {t('doctorConsultations.oxygenSaturation') || 'SpO2 (%)'}
                    </label>
                    <input
                      type="number"
                      placeholder="98"
                      value={formData.vitals.oxygenSaturation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitals: { ...formData.vitals, oxygenSaturation: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode('list');
                    setSelectedRecord(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? t('doctorConsultations.saving') || 'Saving...' : t('doctorConsultations.saveDraft') || 'Save Draft'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- MODE 4: VIEW CONSULTATION (READ-ONLY) ---------------- */}
        {!loading && mode === 'view' && selectedRecord && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                      {t('doctorConsultations.consultationRecord') || 'Consultation Record'}
                    </h3>
                    {getStatusBadge(selectedRecord.status)}
                    {selectedRecord.amendedRecordId && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded">
                        <History className="w-3 h-3" />
                        {t('doctorConsultations.amendment') || 'Amendment'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {selectedRecord.appointmentId?.appointmentDate || new Date(selectedRecord.createdAt).toLocaleDateString()}
                    {selectedRecord.signedAt && (
                      <span> • {t('doctorConsultations.signedAt') || 'Signed'}: {new Date(selectedRecord.signedAt).toLocaleString()}</span>
                    )}
                  </p>
                </div>

                {/* Top Action Bar */}
                <div className="flex items-center gap-2">
                  {selectedRecord.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(selectedRecord)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        {t('doctorConsultations.editDraft') || 'Edit Draft'}
                      </button>
                      <button
                        onClick={handleSign}
                        disabled={signing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        {signing ? t('doctorConsultations.signing') || 'Signing...' : t('doctorConsultations.signRecord') || 'Sign Record'}
                      </button>
                    </>
                  )}

                  {(selectedRecord.status === 'SIGNED' || selectedRecord.status === 'AMENDED') && (
                    <button
                      onClick={handleCreateAmendment}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      {saving ? t('doctorConsultations.creating') || 'Creating...' : t('doctorConsultations.createAmendment') || 'Create Amendment'}
                    </button>
                  )}

                  {/* Prescriptions are HomelyServ-only for now. The button is
                      hidden in ClinicPatient mode rather than deep-linking to
                      the HomelyServ-only prescription page. */}
                  {!isClinicPatient && (selectedRecord.status === 'SIGNED' || selectedRecord.status === 'AMENDED') && (
                    <button
                      onClick={() => navigate(`/doctor-patients/${patientId}/consultations/${selectedRecord._id}/prescriptions`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {t('doctorPrescriptions.pageTitle') || 'Prescriptions'}
                    </button>
                  )}

                  {isClinicPatient && (selectedRecord.status === 'SIGNED' || selectedRecord.status === 'AMENDED') && (
                    <span
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold"
                      title={t('doctorCms.prescriptionsNotAvailable') || 'Not available for clinic patients yet'}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {t('doctorCms.prescriptionsNotAvailable') || 'Prescriptions not available yet'}
                    </span>
                  )}
                </div>
              </div>

              {/* Consultation Details & Vitals */}
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    {t('doctorConsultations.chiefComplaint') || 'Chief Complaint'}
                  </h4>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {selectedRecord.chiefComplaint || '—'}
                  </p>
                </div>

                {selectedRecord.history && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      {t('doctorConsultations.history') || 'Clinical History'}
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {selectedRecord.history}
                    </p>
                  </div>
                )}

                {selectedRecord.examination && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      {t('doctorConsultations.examination') || 'Examination'}
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {selectedRecord.examination}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    {t('doctorConsultations.diagnosis') || 'Diagnosis'}
                  </h4>
                  {Array.isArray(selectedRecord.diagnosis) && selectedRecord.diagnosis.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedRecord.diagnosis.map((d, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        >
                          <strong>{d.name}</strong>
                          {d.icdCode && <span className="opacity-70">({d.icdCode})</span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">None specified</p>
                  )}
                </div>

                {selectedRecord.treatmentPlan && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      {t('doctorConsultations.treatmentPlan') || 'Treatment Plan'}
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {selectedRecord.treatmentPlan}
                    </p>
                  </div>
                )}

                {/* Vitals summary */}
                {selectedRecord.vitals && Object.values(selectedRecord.vitals).some((v) => v !== null && v !== '') && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      {t('doctorConsultations.vitals') || 'Vitals'}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {selectedRecord.vitals.bloodPressure && (
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-slate-500 block">BP</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {selectedRecord.vitals.bloodPressure}
                          </span>
                        </div>
                      )}
                      {selectedRecord.vitals.heartRate && (
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-slate-500 block">Heart Rate</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {selectedRecord.vitals.heartRate} bpm
                          </span>
                        </div>
                      )}
                      {selectedRecord.vitals.temperature && (
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-slate-500 block">Temp</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {selectedRecord.vitals.temperature} °C
                          </span>
                        </div>
                      )}
                      {selectedRecord.vitals.oxygenSaturation && (
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-slate-500 block">SpO2</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {selectedRecord.vitals.oxygenSaturation}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorConsultations;
