// frontend/src/pages/DoctorPrescriptions.jsx
// Doctor Prescription management (Phase 9).
// Create DRAFT prescriptions for SIGNED consultations, edit/delete DRAFTs,
// issue (DRAFT -> ISSUED, immutable), and cancel (ISSUED -> CANCELLED).
// Each ISSUED/CANCELLED prescription can be opened in a printable view.
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import {
  Pill,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  Edit,
  Save,
  X,
  FileCheck,
  Ban,
  Info
} from 'lucide-react';

const emptyItem = () => ({
  drugName: '',
  strength: '',
  form: '',
  dosage: '',
  frequency: '',
  duration: '',
  quantity: '',
  instructions: ''
});

const DoctorPrescriptions = () => {
  const { patientId, consultationId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [patient, setPatient] = useState(null);
  const [consultation, setConsultation] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // mode: 'list' | 'create' | 'edit' | 'view'
  const [mode, setMode] = useState('list');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [formData, setFormData] = useState({
    items: [emptyItem()],
    notes: '',
    followUpDate: ''
  });

  const base = `/api/doctors/patients/${patientId}/consultations/${consultationId}/prescriptions`;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const [patientRes, consultRes, rxRes] = await Promise.all([
        api.get(`/api/doctors/patients/${patientId}`),
        api.get(`/api/doctors/patients/${patientId}/consultations/${consultationId}`),
        api.get(base)
      ]);
      setPatient(patientRes.data?.patient || null);
      setConsultation(consultRes.data?.consultation || null);
      setPrescriptions(Array.isArray(rxRes.data?.prescriptions) ? rxRes.data.prescriptions : []);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorPrescriptions.loadError') || 'Failed to load prescriptions.'
      );
    } finally {
      setLoading(false);
    }
  }, [patientId, consultationId, base, t]);

  useEffect(() => {
    if (patientId && consultationId) {
      loadData();
    }
  }, [loadData, patientId, consultationId]);

  const handleOpenCreate = () => {
    setFormData({ items: [emptyItem()], notes: '', followUpDate: '' });
    setSelectedRecord(null);
    setMode('create');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleOpenEdit = (record) => {
    if (record.status !== 'DRAFT') return;
    setSelectedRecord(record);
    setFormData({
      items:
        Array.isArray(record.items) && record.items.length > 0
          ? record.items.map((i) => ({ ...i }))
          : [emptyItem()],
      notes: record.notes || '',
      followUpDate: record.followUpDate ? new Date(record.followUpDate).toISOString().slice(0, 10) : ''
    });
    setMode('edit');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleOpenView = (record) => {
    setSelectedRecord(record);
    setMode('view');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Medication item handlers
  const handleItemChange = (idx, field, value) => {
    setFormData((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const handleAddItem = () => setFormData((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

  const handleRemoveItem = (idx) => {
    setFormData((prev) => {
      const items = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items: items.length > 0 ? items : [emptyItem()] };
    });
  };

  // Build payload: skip fully empty items (server allows creating an empty draft)
  const buildPayload = () => {
    const items = formData.items
      .map((i) => ({
        drugName: i.drugName?.trim(),
        strength: i.strength?.trim(),
        form: i.form?.trim(),
        dosage: i.dosage?.trim(),
        frequency: i.frequency?.trim(),
        duration: i.duration?.trim(),
        quantity: i.quantity?.trim(),
        instructions: i.instructions?.trim()
      }))
      .filter((i) => i.drugName || i.dosage || i.frequency || i.duration);
    return {
      items,
      notes: formData.notes,
      followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null
    };
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (mode === 'create') {
        const res = await api.post(base, buildPayload());
        if (res.data?.success) {
          setSuccessMessage(t('doctorPrescriptions.draftCreated') || 'Prescription draft created.');
          await loadData();
          handleOpenView(res.data.prescription);
        }
      } else if (mode === 'edit' && selectedRecord) {
        const res = await api.put(`${base}/${selectedRecord._id}`, buildPayload());
        if (res.data?.success) {
          setSuccessMessage(t('doctorPrescriptions.draftUpdated') || 'Prescription draft updated.');
          await loadData();
          handleOpenView(res.data.prescription);
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || t('doctorPrescriptions.saveError') || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleIssue = async () => {
    if (!selectedRecord) return;
    if (
      !window.confirm(
        t('doctorPrescriptions.issueConfirm') ||
          'Issue this prescription? Once issued, it becomes immutable and visible to the patient.'
      )
    ) {
      return;
    }
    setIssuing(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.post(`${base}/${selectedRecord._id}/issue`);
      if (res.data?.success) {
        setSuccessMessage(t('doctorPrescriptions.issuedSuccess') || 'Prescription issued successfully.');
        await loadData();
        handleOpenView(res.data.prescription);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || t('doctorPrescriptions.issueError') || 'Failed to issue prescription.');
    } finally {
      setIssuing(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedRecord) return;
    setCancelling(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.post(`${base}/${selectedRecord._id}/cancel`, {
        cancellationReason: cancelReason
      });
      if (res.data?.success) {
        setSuccessMessage(t('doctorPrescriptions.cancelledSuccess') || 'Prescription cancelled.');
        setCancelReason('');
        await loadData();
        handleOpenView(res.data.prescription);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || t('doctorPrescriptions.cancelError') || 'Failed to cancel prescription.');
    } finally {
      setCancelling(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!selectedRecord || selectedRecord.status !== 'DRAFT') return;
    if (!window.confirm(t('doctorPrescriptions.deleteDraftConfirm') || 'Delete this prescription draft?')) return;
    setDeleting(true);
    setErrorMessage('');
    try {
      const res = await api.delete(`${base}/${selectedRecord._id}`);
      if (res.data?.success) {
        setSuccessMessage(t('doctorPrescriptions.draftDeleted') || 'Prescription draft deleted.');
        await loadData();
        setMode('list');
        setSelectedRecord(null);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || t('doctorPrescriptions.deleteError') || 'Failed to delete draft.');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const cls = {
      DRAFT: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      ISSUED: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      CANCELLED: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
    }[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls || ''}`}>
        {t(`doctorPrescriptions.statuses.${status}`) || status}
      </span>
    );
  };

  const renderMedicationItemInputs = () => (
    <div className="space-y-4">
      {formData.items.map((item, idx) => (
        <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {t('doctorPrescriptions.medication') || 'Medication'} #{idx + 1}
            </span>
            {formData.items.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveItem(idx)}
                className="text-rose-500 hover:text-rose-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                {t('doctorPrescriptions.drugName') || 'Drug Name'} *
              </label>
              <input
                type="text"
                maxLength="200"
                value={item.drugName}
                onChange={(e) => handleItemChange(idx, 'drugName', e.target.value)}
                placeholder={t('doctorPrescriptions.drugNamePlaceholder') || 'e.g. Amoxicillin'}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                {t('doctorPrescriptions.strength') || 'Strength'}
              </label>
              <input
                type="text"
                maxLength="100"
                value={item.strength}
                onChange={(e) => handleItemChange(idx, 'strength', e.target.value)}
                placeholder="500mg"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                {t('doctorPrescriptions.form') || 'Form'}
              </label>
              <input
                type="text"
                maxLength="100"
                value={item.form}
                onChange={(e) => handleItemChange(idx, 'form', e.target.value)}
                placeholder={t('doctorPrescriptions.formPlaceholder') || 'Tablet, Capsule, Syrup...'}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                {t('doctorPrescriptions.dosage') || 'Dosage'} *
              </label>
              <input
                type="text"
                maxLength="150"
                value={item.dosage}
                onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                placeholder={t('doctorPrescriptions.dosagePlaceholder') || '1 capsule'}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                {t('doctorPrescriptions.frequency') || 'Frequency'} *
              </label>
              <input
                type="text"
                maxLength="150"
                value={item.frequency}
                onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                placeholder={t('doctorPrescriptions.frequencyPlaceholder') || '3 times daily'}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                {t('doctorPrescriptions.duration') || 'Duration'} *
              </label>
              <input
                type="text"
                maxLength="100"
                value={item.duration}
                onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                placeholder="7 days"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                {t('doctorPrescriptions.quantity') || 'Quantity'}
              </label>
              <input
                type="text"
                maxLength="50"
                value={item.quantity}
                onChange={(x) => handleItemChange(idx, 'quantity', x.target.value)}
                placeholder="21 capsules"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                {t('doctorPrescriptions.instructions') || 'Instructions'}
              </label>
              <input
                type="text"
                maxLength="500"
                value={item.instructions}
                onChange={(e) => handleItemChange(idx, 'instructions', e.target.value)}
                placeholder={t('doctorPrescriptions.instructionsPlaceholder') || 'Special precautions...'}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddItem}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {t('doctorPrescriptions.addMedication') || 'Add Medication'}
      </button>
    </div>
  );

  const canCreate = consultation && (consultation.status === 'SIGNED' || consultation.status === 'AMENDED');

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('doctorPrescriptions.pageTitle') || 'Prescriptions'}
        subtitle={
          patient
            ? `${t('doctorPrescriptions.patient') || 'Patient'}: ${patient.fullName}`
            : t('doctorPrescriptions.pageSubtitle') || 'Manage patient prescriptions.'
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
                navigate(`/doctor-patients/${patientId}/consultations`);
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>
              {mode !== 'list'
                ? t('doctorPrescriptions.backToList') || 'Back to Prescriptions'
                : t('doctorConsultations.backToList') || 'Back to Consultations'}
            </span>
          </button>

          {mode === 'list' && canCreate && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('doctorPrescriptions.newPrescription') || 'New Prescription'}</span>
            </button>
          )}
          {mode === 'list' && !canCreate && (
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              {t('doctorPrescriptions.requiresSignedConsultation') || 'Consultation must be signed to prescribe.'}
            </span>
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
            <p className="text-sm text-slate-500">{t('doctorPrescriptions.loading') || 'Loading prescriptions...'}</p>
          </div>
        )}

        {/* ---------------- MODE 1: LIST ---------------- */}
        {!loading && mode === 'list' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-500" />
                {t('doctorPrescriptions.prescriptionHistory') || 'Prescription History'}
              </h3>
              <span className="text-xs text-slate-500">
                {prescriptions.length} {t('doctorPrescriptions.records') || 'Records'}
              </span>
            </div>

            {prescriptions.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Pill className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('doctorPrescriptions.noPrescriptions') || 'No prescriptions recorded yet'}
                </p>
                {canCreate && (
                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t('doctorPrescriptions.createFirst') || 'Create Prescription'}
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {prescriptions.map((rx) => (
                  <div
                    key={rx._id}
                    className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {rx.prescriptionNumber}
                        </span>
                        {getStatusBadge(rx.status)}
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-md">
                        {Array.isArray(rx.items) && rx.items.length > 0
                          ? rx.items.map((i) => i.drugName).join(', ')
                          : t('doctorPrescriptions.emptyDraft') || 'Empty draft'}
                      </p>
                      {rx.issuedAt && (
                        <p className="text-xs text-slate-500">
                          {t('doctorPrescriptions.issueDate') || 'Issued'}: {new Date(rx.issuedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => handleOpenView(rx)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        {t('doctorPrescriptions.view') || 'View'}
                      </button>
                      {rx.status === 'DRAFT' && (
                        <button
                          onClick={() => handleOpenEdit(rx)}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                        >
                          {t('doctorPrescriptions.editDraft') || 'Edit Draft'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- MODE 2 & 3: FORM (CREATE / EDIT DRAFT) ---------------- */}
        {!loading && (mode === 'create' || mode === 'edit') && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {mode === 'create'
                    ? t('doctorPrescriptions.newPrescription') || 'New Prescription'
                    : t('doctorPrescriptions.editDraft') || 'Edit Prescription Draft'}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('doctorPrescriptions.draftNotice') ||
                    'Drafts can be modified until issued. Issuing makes the prescription immutable and visible to the patient.'}
                </p>
              </div>
              {mode === 'edit' && (
                <button
                  onClick={handleDeleteDraft}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? t('common.deleting') || 'Deleting...' : t('doctorPrescriptions.deleteDraft') || 'Delete Draft'}
                </button>
              )}
            </div>

            {renderMedicationItemInputs()}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('doctorPrescriptions.notes') || 'Notes'}
              </label>
              <textarea
                rows="3"
                maxLength="2000"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('doctorPrescriptions.notesPlaceholder') || 'General notes for the patient...'}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('doctorPrescriptions.followUp') || 'Follow-up Date (optional)'}
              </label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

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
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? t('doctorPrescriptions.saving') || 'Saving...' : t('doctorPrescriptions.saveDraft') || 'Save Draft'}
              </button>
            </div>
          </div>
        )}

        {/* ---------------- MODE 4: VIEW ---------------- */}
        {!loading && mode === 'view' && selectedRecord && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100">
                    {selectedRecord.prescriptionNumber}
                  </h3>
                  {getStatusBadge(selectedRecord.status)}
                </div>
                <p className="text-xs text-slate-500">
                  {selectedRecord.issuedAt
                    ? `${t('doctorPrescriptions.issueDate') || 'Issued'}: ${new Date(selectedRecord.issuedAt).toLocaleString()}`
                    : `${t('doctorPrescriptions.created') || 'Created'}: ${new Date(selectedRecord.createdAt).toLocaleString()}`}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedRecord.status === 'ISSUED' && (
                  <button
                    onClick={() =>
                      navigate(
                        `/doctor-patients/${patientId}/consultations/${consultationId}/prescriptions/${selectedRecord._id}/print`
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {t('doctorPrescriptions.printPrescription') || 'Print'}
                  </button>
                )}
                {selectedRecord.status === 'DRAFT' && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(selectedRecord)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {t('doctorPrescriptions.editDraft') || 'Edit Draft'}
                    </button>
                    <button
                      onClick={handleIssue}
                      disabled={issuing}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      {issuing
                        ? t('doctorPrescriptions.issuing') || 'Issuing...'
                        : t('doctorPrescriptions.issuePrescription') || 'Issue Prescription'}
                    </button>
                  </>
                )}
                {selectedRecord.status === 'ISSUED' && (
                  <button
                    onClick={() => {
                      setCancelReason('');
                      setMode('cancel');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {t('doctorPrescriptions.cancelPrescription') || 'Cancel Prescription'}
                  </button>
                )}
              </div>
            </div>

            {/* Medications display */}
            {Array.isArray(selectedRecord.items) && selectedRecord.items.length > 0 ? (
              <div className="space-y-4">
                {selectedRecord.items.map((item, idx) => (
                  <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {item.drugName}
                        {item.strength ? ` ${item.strength}` : ''}
                      </p>
                      {item.form && <span className="text-xs text-slate-500">({item.form})</span>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pl-8">
                      <div>
                        <span className="block text-slate-400 font-medium">{t('doctorPrescriptions.dosage') || 'Dosage'}</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.dosage}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-medium">{t('doctorPrescriptions.frequency') || 'Frequency'}</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.frequency}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-medium">{t('doctorPrescriptions.duration') || 'Duration'}</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.duration}</span>
                      </div>
                      {item.quantity && (
                        <div>
                          <span className="block text-slate-400 font-medium">{t('doctorPrescriptions.quantity') || 'Quantity'}</span>
                          <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.quantity}</span>
                        </div>
                      )}
                    </div>
                    {item.instructions && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 pl-8">
                        <span className="font-medium text-slate-400">
                          {t('doctorPrescriptions.instructions') || 'Instructions'}:{' '}
                        </span>
                        {item.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">
                {t('doctorPrescriptions.emptyDraft') || 'No medication items yet.'}
              </p>
            )}

            {selectedRecord.notes && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  {t('doctorPrescriptions.notes') || 'Notes'}
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{selectedRecord.notes}</p>
              </div>
            )}

            {selectedRecord.followUpDate && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  {t('doctorPrescriptions.followUp') || 'Follow-up'}
                </h4>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {new Date(selectedRecord.followUpDate).toLocaleDateString()}
                </p>
              </div>
            )}

            {selectedRecord.status === 'CANCELLED' && selectedRecord.cancellationReason && (
              <div className="border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 rounded-xl p-4">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1">
                  {t('doctorPrescriptions.cancelReasonTitle') || 'Cancellation Reason'}
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400">{selectedRecord.cancellationReason}</p>
              </div>
            )}
          </div>
        )}

        {/* ---------------- MODE 5: CANCEL (reason prompt) ---------------- */}
        {!loading && mode === 'cancel' && selectedRecord && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5 max-w-xl">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-500" />
                {t('doctorPrescriptions.cancelPrescription') || 'Cancel Prescription'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">{selectedRecord.prescriptionNumber}</p>
              <p className="text-xs text-slate-500 mt-2">
                {t('doctorPrescriptions.cancelWarning') ||
                  'Cancelling is permanent. The prescription will be marked CANCELLED and can no longer be edited, deleted, or re-issued.'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('doctorPrescriptions.cancelReasonLabel') || 'Cancellation Reason'}
              </label>
              <textarea
                rows="3"
                maxLength="1000"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t('doctorPrescriptions.cancelReasonPlaceholder') || 'Reason for cancellation...'}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMode('view')}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                {cancelling ? t('doctorPrescriptions.cancelling') || 'Cancelling...' : t('doctorPrescriptions.confirmCancel') || 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorPrescriptions;
