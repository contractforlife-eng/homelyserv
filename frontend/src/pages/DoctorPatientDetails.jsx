// frontend/src/pages/DoctorPatientDetails.jsx
// Doctor Patient Details page.
//
// Displays non-medical patient overview and appointment history for a verified patient relationship.
// If no confirmed/completed appointment relationship exists, shows not-found state with back navigation.
// Displays an upcoming placeholder card for Phase 6 (Medical Record).
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import api from '../utils/api';
import {
  User,
  Calendar,
  Clock,
  Building2,
  Home,
  Video,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileText,
  Phone,
  Globe,
  MapPin,
  CheckCircle2,
  Info,
  Activity,
  Shield,
  ShieldAlert,
  Heart,
  Crown,
  FileQuestion
} from 'lucide-react';

const DoctorPatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notFound, setNotFound] = useState(false);

  // Phase 7: Medical Profile state
  // medProfileStatus: 'idle' | 'loading' | 'available' | 'no_profile' | 'consent_required' | 'premium_required' | 'error'
  const [medicalProfile, setMedicalProfile] = useState(null);
  const [medProfileLoading, setMedProfileLoading] = useState(true);
  const [medProfileStatus, setMedProfileStatus] = useState('loading');
  const [medProfileError, setMedProfileError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setNotFound(false);

      const [patientRes, apptsRes] = await Promise.all([
        api.get(`/api/doctors/patients/${patientId}`),
        api.get(`/api/doctors/patients/${patientId}/appointments`)
      ]);

      setPatient(patientRes.data?.patient || null);
      setAppointments(Array.isArray(apptsRes.data?.appointments) ? apptsRes.data.appointments : []);

      // If patient exists and relationship valid, fetch medical profile
      setMedProfileLoading(true);
      setMedProfileError('');
      try {
        const medRes = await api.get(`/api/doctors/patients/${patientId}/medical-profile`);
        if (medRes.data?.medicalProfile) {
          setMedicalProfile(medRes.data.medicalProfile);
          setMedProfileStatus('available');
        } else {
          setMedicalProfile(null);
          setMedProfileStatus('no_profile');
        }
      } catch (medErr) {
        setMedicalProfile(null);
        const status = medErr.response?.status;
        const code = medErr.response?.data?.code;

        if (status === 404) {
          setMedProfileStatus('no_profile');
        } else if (status === 403 && code === 'MEDICAL_PROFILE_CONSENT_REQUIRED') {
          setMedProfileStatus('consent_required');
        } else if (status === 403 && code === 'PATIENT_PREMIUM_REQUIRED') {
          setMedProfileStatus('premium_required');
        } else {
          setMedProfileStatus('error');
          setMedProfileError(
            medErr.response?.data?.message || t('doctorPatients.medicalProfileError') || 'Failed to load medical profile.'
          );
        }
      } finally {
        setMedProfileLoading(false);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setErrorMessage(
          err.response?.data?.message || t('doctorPatients.loadError') || 'Failed to load patient details.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [patientId, t]);

  useEffect(() => {
    if (patientId) {
      loadData();
    }
  }, [loadData, patientId]);

  const getStatusBadge = (status) => {
    const map = {
      CONFIRMED: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        label: t('doctorAppointments.statuses.CONFIRMED') || 'Confirmed'
      },
      COMPLETED: {
        bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        label: t('doctorAppointments.statuses.COMPLETED') || 'Completed'
      }
    };
    const conf = map[status] || {
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      label: status || '—'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${conf.bg}`}>
        {conf.label}
      </span>
    );
  };

  // `doctorAppointments.consultationTypes.*` does not exist in any language,
  // so i18next rendered the raw key. `doctorSchedule.types` is the existing
  // dictionary already used by DoctorAppointments.jsx (Arabic CLINIC =
  // كشف في العيادة). Reuse it rather than adding a duplicate dictionary.
  const getConsultationBadge = (type) => {
    if (type === 'CLINIC') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-blue-500" />
          {t('doctorSchedule.types.CLINIC') || 'Clinic'}
        </span>
      );
    }
    if (type === 'HOME_VISIT') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
          <Home className="w-3.5 h-3.5 text-amber-500" />
          {t('doctorSchedule.types.HOME_VISIT') || 'Home Visit'}
        </span>
      );
    }
    if (type === 'ONLINE') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
          <Video className="w-3.5 h-3.5 text-purple-500" />
          {t('doctorSchedule.types.ONLINE') || 'Online'}
        </span>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('doctorPatients.patientDetailsTitle') || 'Patient Details'}
        subtitle={
          t('doctorPatients.patientDetailsSubtitle') ||
          'Consultation history and patient overview.'
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate('/doctor-patients')}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t('doctorPatients.backToPatients') || 'Back to Patients'}</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading patient details...</p>
          </div>
        )}

        {/* Not Found State */}
        {!loading && notFound && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <EmptyState
              icon={User}
              title={t('doctorPatients.patientNotFound') || 'Patient not found'}
              description={
                t('doctorPatients.patientNotFoundDesc') ||
                'No established patient relationship exists with this user.'
              }
            />
          </div>
        )}

        {/* Error Alert */}
        {!loading && !notFound && errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{errorMessage}</p>
          </div>
        )}

        {/* Patient Content */}
        {!loading && !notFound && patient && (
          <div className="space-y-6">
            {/* Top Patient Overview Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {patient.profileImage ? (
                    <img
                      src={patient.profileImage}
                      alt={patient.patientName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-inner"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-2xl shadow-inner">
                      {(patient.patientName || 'P').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {patient.patientName || t('doctorPatients.patient')}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {(patient.location || patient.city) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {patient.location || patient.city}
                          {patient.countryName ? `, ${patient.countryName}` : ''}
                        </span>
                      )}
                      {patient.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {patient.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Consultation relationship summary numbers */}
                <div className="flex items-center gap-6 sm:border-l sm:dark:border-slate-800 sm:pl-6 rtl:sm:border-r rtl:sm:border-l-0 rtl:sm:pr-6 rtl:sm:pl-0">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {patient.totalAppointments || appointments.length}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('doctorPatients.totalAppointments') || 'Total Appointments'}
                    </p>
                  </div>
                  {patient.lastAppointmentDate && (
                    <div className="text-center sm:text-right rtl:sm:text-left">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(patient.lastAppointmentDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('doctorPatients.lastAppointment') || 'Last Appointment'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Phase 7: Medical Profile Section (Self-Reported) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {t('doctorPatients.medicalProfileTitle') || 'Medical Profile (Self-Reported)'}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {t('common.readOnly') || 'Read Only'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('doctorPatients.medicalProfileSubtitle') || 'Patient-provided medical history and biological indicators.'}
                    </p>
                  </div>
                </div>

                {medProfileStatus === 'available' && medicalProfile?.lastReviewedAt && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t('doctorPatients.lastReviewed') || 'Last reviewed'}:{' '}
                    <strong className="text-slate-700 dark:text-slate-300 font-medium">
                      {new Date(medicalProfile.lastReviewedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </strong>
                  </span>
                )}
              </div>

              {/* State 1: Loading */}
              {medProfileLoading && (
                <div className="flex items-center justify-center py-10 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm text-slate-500">
                    {t('doctorPatients.medicalProfileLoading') || 'Loading medical profile...'}
                  </span>
                </div>
              )}

              {/* State 2: No Profile */}
              {!medProfileLoading && medProfileStatus === 'no_profile' && (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 p-6 text-center space-y-2">
                  <FileQuestion className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('doctorPatients.noMedicalProfile') || 'No Medical Profile'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {t('doctorPatients.noMedicalProfileDesc') || 'This patient has not created a medical profile yet.'}
                  </p>
                </div>
              )}

              {/* State 3: Consent Not Granted */}
              {!medProfileLoading && medProfileStatus === 'consent_required' && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-5 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      {t('doctorPatients.medicalProfileConsentRequired') || 'Sharing Consent Not Granted'}
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                      {t('doctorPatients.medicalProfileConsentRequiredDesc') ||
                        'The patient has not granted permission to share their medical profile with doctors.'}
                    </p>
                  </div>
                </div>
              )}

              {/* State 4: Patient Premium Required */}
              {!medProfileLoading && medProfileStatus === 'premium_required' && (
                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 p-5 flex items-start gap-3">
                  <Crown className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                      {t('doctorPatients.medicalProfilePremiumRequired') || 'Premium Subscription Required'}
                    </h4>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                      {t('doctorPatients.medicalProfilePremiumRequiredDesc') ||
                        'The patient does not currently have an active HomelyServ Premium subscription.'}
                    </p>
                  </div>
                </div>
              )}

              {/* State 5: Error */}
              {!medProfileLoading && medProfileStatus === 'error' && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    {medProfileError || t('doctorPatients.medicalProfileError') || 'Failed to load medical profile.'}
                  </p>
                </div>
              )}

              {/* State 6: Available Medical Profile Data */}
              {!medProfileLoading && medProfileStatus === 'available' && medicalProfile && (
                <div className="space-y-6">
                  {/* Row 1: Biological Indicators */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                      {t('doctorPatients.biologicalInfo') || 'Biological Indicators'}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 block">
                          {t('medicalProfile.bloodGroup') || 'Blood Group'}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {medicalProfile.bloodGroup || '—'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 block">
                          {t('medicalProfile.sex') || 'Sex'}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {medicalProfile.sex || '—'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 block">
                          {t('medicalProfile.heightCm') || 'Height'}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {medicalProfile.heightCm ? `${medicalProfile.heightCm} cm` : '—'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 block">
                          {t('medicalProfile.weightKg') || 'Weight'}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {medicalProfile.weightKg ? `${medicalProfile.weightKg} kg` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Allergies & Chronic Conditions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Allergies */}
                    <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-950/50 bg-rose-50/30 dark:bg-rose-950/10 space-y-2">
                      <h4 className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {t('medicalProfile.allergies') || 'Allergies'}
                      </h4>
                      {Array.isArray(medicalProfile.allergies) && medicalProfile.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {medicalProfile.allergies.map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          {t('doctorPatients.noAllergies') || 'No allergies reported.'}
                        </p>
                      )}
                    </div>

                    {/* Chronic Conditions */}
                    <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-950/50 bg-amber-50/30 dark:bg-amber-950/10 space-y-2">
                      <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5" />
                        {t('medicalProfile.chronicConditions') || 'Chronic Conditions'}
                      </h4>
                      {Array.isArray(medicalProfile.chronicConditions) && medicalProfile.chronicConditions.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {medicalProfile.chronicConditions.map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          {t('doctorPatients.noChronicConditions') || 'No chronic conditions reported.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Current Medications & Surgeries */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Current Medications */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t('medicalProfile.currentMedications') || 'Current Medications'}
                      </h4>
                      {Array.isArray(medicalProfile.currentMedications) && medicalProfile.currentMedications.length > 0 ? (
                        <ul className="text-xs text-slate-700 dark:text-slate-300 list-disc list-inside space-y-1">
                          {medicalProfile.currentMedications.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          {t('doctorPatients.noCurrentMedications') || 'No current medications reported.'}
                        </p>
                      )}
                    </div>

                    {/* Surgeries */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t('medicalProfile.surgeries') || 'Previous Surgeries'}
                      </h4>
                      {Array.isArray(medicalProfile.surgeries) && medicalProfile.surgeries.length > 0 ? (
                        <ul className="text-xs text-slate-700 dark:text-slate-300 list-disc list-inside space-y-1">
                          {medicalProfile.surgeries.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          {t('doctorPatients.noSurgeries') || 'No previous surgeries reported.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 4: Lifestyle, Family History & Emergency Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    {/* Smoking & Disability */}
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-500 block">{t('medicalProfile.smokingStatus') || 'Smoking Status'}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {medicalProfile.smokingStatus || t('doctorPatients.notSpecified') || 'Not specified'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">{t('medicalProfile.disabilityStatus') || 'Disability / Mobility'}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {medicalProfile.disabilityStatus || t('doctorPatients.noneReported') || 'None reported'}
                        </span>
                      </div>
                    </div>

                    {/* Family History */}
                    <div>
                      <span className="text-slate-500 block mb-1">{t('medicalProfile.familyHistory') || 'Family History'}</span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                        {medicalProfile.familyHistory || t('doctorPatients.noneReported') || 'None reported'}
                      </p>
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold block flex items-center gap-1">
                        <Phone className="w-3 h-3 text-rose-500" />
                        {t('doctorPatients.emergencyContact') || 'Emergency Contact'}
                      </span>
                      {medicalProfile.emergencyContact?.name ? (
                        <>
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {medicalProfile.emergencyContact.name}
                            {medicalProfile.emergencyContact.relationship && (
                              <span className="text-slate-500 font-normal"> ({medicalProfile.emergencyContact.relationship})</span>
                            )}
                          </p>
                          {medicalProfile.emergencyContact.phone && (
                            <p className="text-slate-600 dark:text-slate-400">{medicalProfile.emergencyContact.phone}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-slate-500 italic">{t('doctorPatients.noneReported') || 'None reported'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Phase 8: Doctor Clinical Consultations */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {t('doctorConsultations.sectionTitle') || 'Clinical Consultations'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('doctorConsultations.sectionSubtitle') ||
                        'Create, manage, sign, and amend official clinical consultation records.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/doctor-patients/${patientId}/consultations`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t('doctorConsultations.manageConsultations') || 'Manage Consultations'}</span>
                </button>
              </div>
            </div>

            {/* Appointment History List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  {t('doctorPatients.appointmentHistory') || 'Appointment History'}
                </h3>
                <span className="text-xs text-slate-500">
                  {appointments.length} {t('doctorPatients.appointments') || 'Appointments'}
                </span>
              </div>

              {appointments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">
                  {t('doctorPatients.noAppointments') || 'No appointments recorded with this patient.'}
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {appointments.map((appt) => (
                    <div
                      key={appt._id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-medium text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {appt.appointmentDate}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {appt.startTime} - {appt.endTime}
                          </span>
                          {getStatusBadge(appt.status)}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          {getConsultationBadge(appt.consultationType)}
                          {appt.clinicId && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {appt.clinicId.name || t('doctorPatients.clinic')}
                            </span>
                          )}
                          {appt.homeAddress && (
                            <span className="truncate max-w-xs text-slate-500">
                              {appt.homeAddress}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorPatientDetails;
