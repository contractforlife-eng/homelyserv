// frontend/src/pages/MedicalProfile.jsx
// My Medical Profile (Phase 6).
// Shared by WORKER, EMPLOYER, TEACHER, STUDENT.
// Premium-only self-service medical profile editor.
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import {
  Heart,
  Crown,
  Activity,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Shield,
  Phone,
  User,
  ArrowRight,
  Info,
  Loader2,
  Save,
  X,
  FileText,
  History,
  Pill
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const MedicalProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPremiumDenied, setIsPremiumDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Phase 8: Tab switching between Profile and Clinical Consultations
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'consultations' | 'prescriptions'
  const [consultations, setConsultations] = useState([]);
  const [consultationsLoading, setConsultationsLoading] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  // Phase 9: Patient Prescriptions (read-only, ISSUED only)
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    sex: '',
    bloodGroup: '',
    heightCm: '',
    weightKg: '',
    chronicConditions: [],
    allergies: [],
    currentMedications: [],
    surgeries: [],
    familyHistory: '',
    smokingStatus: '',
    disabilityStatus: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    consentToShareWithDoctors: false
  });

  // Array input draft states
  const [conditionDraft, setConditionDraft] = useState('');
  const [allergyDraft, setAllergyDraft] = useState('');
  const [medicationDraft, setMedicationDraft] = useState('');
  const [surgeryDraft, setSurgeryDraft] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setIsPremiumDenied(false);

      const res = await api.get('/api/medical/profile');
      if (res.data?.profile) {
        const p = res.data.profile;
        setFormData({
          dateOfBirth: p.dateOfBirth || '',
          sex: p.sex || '',
          bloodGroup: p.bloodGroup || '',
          heightCm: p.heightCm != null ? String(p.heightCm) : '',
          weightKg: p.weightKg != null ? String(p.weightKg) : '',
          chronicConditions: Array.isArray(p.chronicConditions) ? p.chronicConditions : [],
          allergies: Array.isArray(p.allergies) ? p.allergies : [],
          currentMedications: Array.isArray(p.currentMedications) ? p.currentMedications : [],
          surgeries: Array.isArray(p.surgeries) ? p.surgeries : [],
          familyHistory: p.familyHistory || '',
          smokingStatus: p.smokingStatus || '',
          disabilityStatus: p.disabilityStatus || '',
          emergencyContact: {
            name: p.emergencyContact?.name || '',
            relationship: p.emergencyContact?.relationship || '',
            phone: p.emergencyContact?.phone || ''
          },
          consentToShareWithDoctors: Boolean(p.consentToShareWithDoctors)
        });
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'PREMIUM_REQUIRED') {
        setIsPremiumDenied(true);
      } else {
        setErrorMessage(
          err.response?.data?.message || t('medicalProfile.loadError') || 'Failed to load medical profile.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadConsultations = useCallback(async () => {
    try {
      setConsultationsLoading(true);
      const res = await api.get('/api/medical/consultations');
      setConsultations(Array.isArray(res.data?.consultations) ? res.data.consultations : []);
    } catch (err) {
      console.error('Error fetching patient consultations:', err);
    } finally {
      setConsultationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (activeTab === 'consultations') {
      loadConsultations();
    }
  }, [activeTab, loadConsultations]);

  const loadPrescriptions = useCallback(async () => {
    try {
      setPrescriptionsLoading(true);
      const res = await api.get('/api/medical/prescriptions');
      setPrescriptions(Array.isArray(res.data?.prescriptions) ? res.data.prescriptions : []);
    } catch (err) {
      console.error('Error fetching patient prescriptions:', err);
    } finally {
      setPrescriptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'prescriptions') {
      loadPrescriptions();
    }
  }, [activeTab, loadPrescriptions]);

  // Array item handlers
  const handleAddItem = (field, draft, setDraft) => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setFormData((prev) => {
      const current = prev[field] || [];
      if (current.includes(trimmed)) return prev;
      return { ...prev, [field]: [...current, trimmed] };
    });
    setDraft('');
  };

  const handleRemoveItem = (field, indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== indexToRemove)
    }));
  };

  // Submit handler
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Frontend validations
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      if (dob > new Date()) {
        setErrorMessage(t('medicalProfile.validationErrors.dobFuture') || 'Date of birth cannot be in the future.');
        setSaving(false);
        return;
      }
    }
    if (formData.heightCm !== '') {
      const h = Number(formData.heightCm);
      if (isNaN(h) || h < 30 || h > 300) {
        setErrorMessage(t('medicalProfile.validationErrors.heightRange') || 'Height must be between 30 and 300 cm.');
        setSaving(false);
        return;
      }
    }
    if (formData.weightKg !== '') {
      const w = Number(formData.weightKg);
      if (isNaN(w) || w < 1 || w > 500) {
        setErrorMessage(t('medicalProfile.validationErrors.weightRange') || 'Weight must be between 1 and 500 kg.');
        setSaving(false);
        return;
      }
    }

    try {
      const payload = {
        dateOfBirth: formData.dateOfBirth || null,
        sex: formData.sex || null,
        bloodGroup: formData.bloodGroup || null,
        heightCm: formData.heightCm ? Number(formData.heightCm) : null,
        weightKg: formData.weightKg ? Number(formData.weightKg) : null,
        chronicConditions: formData.chronicConditions,
        allergies: formData.allergies,
        currentMedications: formData.currentMedications,
        surgeries: formData.surgeries,
        familyHistory: formData.familyHistory,
        smokingStatus: formData.smokingStatus || null,
        disabilityStatus: formData.disabilityStatus,
        emergencyContact: formData.emergencyContact,
        consentToShareWithDoctors: formData.consentToShareWithDoctors
      };

      const res = await api.put('/api/medical/profile', payload);
      if (res.data?.success) {
        setSuccessMessage(t('medicalProfile.profileSaved') || 'Medical profile saved successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('medicalProfile.saveError') || 'Failed to save medical profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    setDeleting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.delete('/api/medical/profile');
      if (res.data?.success) {
        setShowDeleteModal(false);
        setSuccessMessage(t('medicalProfile.profileDeleted') || 'Medical profile deleted successfully.');
        setFormData({
          dateOfBirth: '',
          sex: '',
          bloodGroup: '',
          heightCm: '',
          weightKg: '',
          chronicConditions: [],
          allergies: [],
          currentMedications: [],
          surgeries: [],
          familyHistory: '',
          smokingStatus: '',
          disabilityStatus: '',
          emergencyContact: { name: '', relationship: '', phone: '' },
          consentToShareWithDoctors: false
        });
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('medicalProfile.deleteError') || 'Failed to delete medical profile.'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('medicalProfile.pageTitle') || 'My Medical Profile'}
        subtitle={
          t('medicalProfile.pageSubtitle') ||
          'Manage your personal medical information, health history, and emergency contacts securely.'
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('medicalProfile.loading') || 'Loading medical profile...'}
            </p>
          </div>
        )}

        {/* NON-PREMIUM PAYWALL STATE */}
        {!loading && isPremiumDenied && (
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/50 rounded-2xl p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <Crown className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {t('medicalProfile.premiumRequiredTitle') || 'Premium Feature'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('medicalProfile.premiumRequiredDesc') ||
                  'My Medical Profile is exclusively available to HomelyServ Premium members. Upgrade your account to maintain a secure personal health profile.'}
              </p>
            </div>
            <div>
              <button
                onClick={() => navigate('/subscription')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm shadow-md hover:from-amber-600 hover:to-amber-700 transition-all cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>{t('medicalProfile.upgradeToPremium') || 'Upgrade to Premium'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* PREMIUM USER CONTENT */}
        {!loading && !isPremiumDenied && (
          <div className="space-y-6">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>{t('medicalProfile.tabMyProfile') || 'My Health Profile'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('consultations')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'consultations'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{t('medicalProfile.tabConsultations') || 'Doctor Consultations'}</span>
                {consultations.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {consultations.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('prescriptions')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'prescriptions'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Pill className="w-4 h-4" />
                <span>{t('medicalProfile.tabPrescriptions') || 'My Prescriptions'}</span>
                {prescriptions.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {prescriptions.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 3: PATIENT PRESCRIPTIONS (READ-ONLY, ISSUED ONLY) */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-6">
                {prescriptionsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                    <p className="text-xs text-slate-500">{t('medicalProfile.rxLoading') || 'Loading prescriptions...'}</p>
                  </div>
                ) : selectedPrescription ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                            {selectedPrescription.prescriptionNumber}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {t('doctorPrescriptions.statuses.ISSUED') || 'Issued'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t('doctorPrescriptions.issueDate') || 'Issue Date'}:{' '}
                          {selectedPrescription.issuedAt
                            ? new Date(selectedPrescription.issuedAt).toLocaleString()
                            : '—'}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/my-prescriptions/${selectedPrescription._id}/print`)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {t('doctorPrescriptions.printPrescription') || 'Print'}
                      </button>
                    </div>

                    {selectedPrescription.documentSnapshot?.doctor?.fullName && (
                      <div className="text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                          {t('doctorPrescriptions.doctorInfo') || 'Doctor'}:
                        </span>
                        <p className="text-slate-800 dark:text-slate-200">
                          {selectedPrescription.documentSnapshot.doctor.professionalTitle
                            ? `${selectedPrescription.documentSnapshot.doctor.professionalTitle} `
                            : ''}
                          {selectedPrescription.documentSnapshot.doctor.fullName}
                          {selectedPrescription.documentSnapshot.doctor.specialty
                            ? ` — ${selectedPrescription.documentSnapshot.doctor.specialty}`
                            : ''}
                        </p>
                      </div>
                    )}

                    {Array.isArray(selectedPrescription.items) && selectedPrescription.items.length > 0 && (
                      <div className="space-y-3">
                        {selectedPrescription.items.map((item, idx) => (
                          <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs space-y-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {idx + 1}. {item.drugName}
                              {item.strength ? ` ${item.strength}` : ''}
                              {item.form ? ` (${item.form})` : ''}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                              <p className="text-slate-600 dark:text-slate-400">
                                <span className="font-medium text-slate-400">{t('doctorPrescriptions.instructions') || 'Instructions'}: </span>
                                {item.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedPrescription.notes && (
                      <div className="text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                          {t('doctorPrescriptions.notes') || 'Notes'}:
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line">{selectedPrescription.notes}</p>
                      </div>
                    )}

                    {selectedPrescription.followUpDate && (
                      <div className="text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                          {t('doctorPrescriptions.followUp') || 'Follow-up Date'}:
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 font-semibold">
                          {new Date(selectedPrescription.followUpDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedPrescription(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      {t('medicalProfile.rxBackToList') || 'Back to Prescriptions'}
                    </button>
                  </div>
                ) : prescriptions.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
                    <Pill className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('medicalProfile.rxNoIssued') || 'No issued prescriptions yet'}
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {t('medicalProfile.rxNoIssuedDesc') ||
                        'When your doctor issues a prescription, it will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((rx) => (
                      <div
                        key={rx._id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-100">
                                {rx.prescriptionNumber}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {t('doctorPrescriptions.statuses.ISSUED') || 'Issued'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate max-w-md">
                              {Array.isArray(rx.items) && rx.items.length > 0
                                ? rx.items.map((i) => i.drugName).join(', ')
                                : ''}
                            </p>
                            <p className="text-xs text-slate-500">
                              {rx.documentSnapshot?.doctor?.fullName
                                ? `${t('doctorPrescriptions.doctorInfo') || 'Doctor'}: ${rx.documentSnapshot.doctor.fullName}`
                                : ''}
                              {rx.issuedAt
                                ? ` • ${t('doctorPrescriptions.issueDate') || 'Issued'}: ${new Date(rx.issuedAt).toLocaleDateString()}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setSelectedPrescription(rx)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              {t('medicalProfile.rxView') || 'View'}
                            </button>
                            <button
                              onClick={() => navigate(`/my-prescriptions/${rx._id}/print`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {t('doctorPrescriptions.printPrescription') || 'Print'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PATIENT CONSULTATIONS (READ-ONLY) */}
            {activeTab === 'consultations' && (
              <div className="space-y-6">
                {consultationsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                    <p className="text-xs text-slate-500">{t('medicalProfile.loadingConsultations') || 'Loading consultations...'}</p>
                  </div>
                ) : consultations.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('medicalProfile.noSignedConsultations') || 'No signed clinical consultations yet'}
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {t('medicalProfile.noSignedConsultationsDesc') ||
                        'When your consulting doctor signs an official clinical record, it will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {consultations.map((c) => (
                      <div
                        key={c._id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                {c.doctorId?.fullName || t('medicalProfile.doctor') || 'Doctor'}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {c.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {c.appointmentId?.appointmentDate || new Date(c.createdAt).toLocaleDateString()}
                              {c.clinicId?.clinicName && ` • ${c.clinicId.clinicName}`}
                            </p>
                          </div>
                          {c.signedAt && (
                            <span className="text-xs text-slate-500">
                              {t('doctorConsultations.signedAt') || 'Signed'}: {new Date(c.signedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="space-y-3 text-xs">
                          {c.chiefComplaint && (
                            <div>
                              <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                                {t('doctorConsultations.chiefComplaint') || 'Chief Complaint'}:
                              </span>
                              <p className="text-slate-800 dark:text-slate-200">{c.chiefComplaint}</p>
                            </div>
                          )}

                          {Array.isArray(c.diagnosis) && c.diagnosis.length > 0 && (
                            <div>
                              <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                                {t('doctorConsultations.diagnosis') || 'Diagnosis'}:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {c.diagnosis.map((d, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                  >
                                    <strong>{d.name}</strong>
                                    {d.icdCode && ` (${d.icdCode})`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {c.treatmentPlan && (
                            <div>
                              <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                                {t('doctorConsultations.treatmentPlan') || 'Treatment Plan & Recommendations'}:
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                {c.treatmentPlan}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: SELF-REPORTED PROFILE FORM */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSave} className="space-y-6">
                {/* Feedback Banners */}
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

            {/* Section 1: Personal Medical Information */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  {t('medicalProfile.personalInfoSection') || 'Personal Medical Information'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('medicalProfile.personalInfoDesc') || 'Basic biological and physical indicators.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.dateOfBirth') || 'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Sex */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.sex') || 'Sex'}
                  </label>
                  <select
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">{t('medicalProfile.selectSex') || 'Select Sex'}</option>
                    <option value="MALE">{t('medicalProfile.sexOptions.MALE') || 'Male'}</option>
                    <option value="FEMALE">{t('medicalProfile.sexOptions.FEMALE') || 'Female'}</option>
                    <option value="OTHER">{t('medicalProfile.sexOptions.OTHER') || 'Other'}</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.bloodGroup') || 'Blood Group'}
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">{t('medicalProfile.selectBloodGroup') || 'Select Blood Group'}</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Height */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.heightCm') || 'Height (cm)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                    placeholder="175"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.weightKg') || 'Weight (kg)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="500"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    placeholder="70"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Medical History (Array items) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  {t('medicalProfile.medicalHistorySection') || 'Medical History'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('medicalProfile.medicalHistoryDesc') ||
                    'Chronic conditions, allergies, and surgical background.'}
                </p>
              </div>

              {/* Chronic Conditions */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('medicalProfile.chronicConditions') || 'Chronic Conditions'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={conditionDraft}
                    onChange={(e) => setConditionDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem('chronicConditions', conditionDraft, setConditionDraft);
                      }
                    }}
                    placeholder={
                      t('medicalProfile.chronicConditionsPlaceholder') || 'e.g., Asthma, Hypertension...'
                    }
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem('chronicConditions', conditionDraft, setConditionDraft)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.chronicConditions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.chronicConditions.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem('chronicConditions', idx)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Allergies */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('medicalProfile.allergies') || 'Allergies'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={allergyDraft}
                    onChange={(e) => setAllergyDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem('allergies', allergyDraft, setAllergyDraft);
                      }
                    }}
                    placeholder={t('medicalProfile.allergiesPlaceholder') || 'e.g., Penicillin, Peanuts...'}
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem('allergies', allergyDraft, setAllergyDraft)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.allergies.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem('allergies', idx)}
                          className="text-rose-400 hover:text-rose-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Medications */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('medicalProfile.currentMedications') || 'Current Medications'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={medicationDraft}
                    onChange={(e) => setMedicationDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem('currentMedications', medicationDraft, setMedicationDraft);
                      }
                    }}
                    placeholder={
                      t('medicalProfile.currentMedicationsPlaceholder') ||
                      'e.g., Metformin 500mg, Salbutamol...'
                    }
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleAddItem('currentMedications', medicationDraft, setMedicationDraft)
                    }
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.currentMedications.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.currentMedications.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem('currentMedications', idx)}
                          className="text-blue-400 hover:text-blue-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Previous Surgeries */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('medicalProfile.surgeries') || 'Previous Surgeries'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={surgeryDraft}
                    onChange={(e) => setSurgeryDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem('surgeries', surgeryDraft, setSurgeryDraft);
                      }
                    }}
                    placeholder={
                      t('medicalProfile.surgeriesPlaceholder') || 'e.g., Appendectomy (2018)...'
                    }
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem('surgeries', surgeryDraft, setSurgeryDraft)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.surgeries.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.surgeries.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem('surgeries', idx)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Family History */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('medicalProfile.familyHistory') || 'Family Medical History'}
                </label>
                <textarea
                  rows="3"
                  maxLength="2000"
                  value={formData.familyHistory}
                  onChange={(e) => setFormData({ ...formData, familyHistory: e.target.value })}
                  placeholder={
                    t('medicalProfile.familyHistoryPlaceholder') ||
                    'Notes on hereditary health conditions in your family...'
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Section 3: Lifestyle & Status */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-purple-500" />
                  {t('medicalProfile.lifestyleSection') || 'Lifestyle & Status'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('medicalProfile.lifestyleDesc') || 'Lifestyle factors and accessibility needs.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Smoking Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.smokingStatus') || 'Smoking Status'}
                  </label>
                  <select
                    value={formData.smokingStatus}
                    onChange={(e) => setFormData({ ...formData, smokingStatus: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">
                      {t('medicalProfile.selectSmokingStatus') || 'Select Smoking Status'}
                    </option>
                    <option value="NEVER">
                      {t('medicalProfile.smokingOptions.NEVER') || 'Never smoked'}
                    </option>
                    <option value="FORMER">
                      {t('medicalProfile.smokingOptions.FORMER') || 'Former smoker'}
                    </option>
                    <option value="CURRENT">
                      {t('medicalProfile.smokingOptions.CURRENT') || 'Current smoker'}
                    </option>
                  </select>
                </div>

                {/* Disability Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.disabilityStatus') || 'Disability Status / Mobility Needs'}
                  </label>
                  <input
                    type="text"
                    maxLength="200"
                    value={formData.disabilityStatus}
                    onChange={(e) => setFormData({ ...formData, disabilityStatus: e.target.value })}
                    placeholder={
                      t('medicalProfile.disabilityStatusPlaceholder') ||
                      'Describe any physical disabilities or mobility assistance required...'
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Emergency Contact */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-rose-500" />
                  {t('medicalProfile.emergencyContactSection') || 'Emergency Contact'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('medicalProfile.emergencyContactDesc') ||
                    'Designated contact person in case of a medical emergency.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.emergencyName') || 'Contact Name'}
                  </label>
                  <input
                    type="text"
                    maxLength="100"
                    value={formData.emergencyContact.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.emergencyRelationship') || 'Relationship'}
                  </label>
                  <input
                    type="text"
                    maxLength="50"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          relationship: e.target.value
                        }
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.emergencyPhone') || 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    maxLength="30"
                    value={formData.emergencyContact.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Doctor Sharing Consent */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  {t('medicalProfile.doctorSharingSection') || 'Doctor Sharing & Consent'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('medicalProfile.doctorSharingDesc') ||
                    'Control whether confirmed consulting Doctors can view your profile.'}
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="checkbox"
                  id="consentToShareWithDoctors"
                  checked={formData.consentToShareWithDoctors}
                  onChange={(e) =>
                    setFormData({ ...formData, consentToShareWithDoctors: e.target.checked })
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="space-y-1">
                  <label
                    htmlFor="consentToShareWithDoctors"
                    className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    {t('medicalProfile.allowDoctorAccess') ||
                      'Allow Doctors to access my Medical Profile'}
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t('medicalProfile.doctorSharingNotice') ||
                      'Enabling this allows Doctors with whom you have confirmed appointments to view your basic medical indicators. It does not replace clinical consultation notes.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('medicalProfile.delete') || 'Delete Profile'}</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('medicalProfile.saving') || 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t('medicalProfile.save') || 'Save Profile'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('medicalProfile.deleteConfirmTitle') || 'Delete Medical Profile?'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('medicalProfile.deleteConfirmDesc') ||
                'Are you sure you want to deactivate and remove your medical profile? You can recreate it anytime.'}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t('medicalProfile.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t('medicalProfile.delete') || 'Delete Profile'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MedicalProfile;
