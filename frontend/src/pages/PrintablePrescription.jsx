// frontend/src/pages/PrintablePrescription.jsx
// Printable Prescription view (Phase 9).
// Dedicated browser-print document rendered outside the DashboardLayout chrome.
// Used by both the Doctor portal and the Patient portal (read-only, ISSUED only).
// Uses @media print CSS; does not repurpose LegalDocument.
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Printer, Loader2, AlertCircle, Crown, ArrowRight } from 'lucide-react';
import api from '../utils/api';

const PrintablePrescription = ({ role }) => {
  const { patientId, consultationId, prescriptionId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPremiumDenied, setIsPremiumDenied] = useState(false);

  const loadPrescription = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setIsPremiumDenied(false);
      const url =
        role === 'doctor'
          ? `/api/doctors/patients/${patientId}/consultations/${consultationId}/prescriptions/${prescriptionId}`
          : `/api/medical/prescriptions/${prescriptionId}`;
      const res = await api.get(url);
      setPrescription(res.data?.prescription || null);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'PREMIUM_REQUIRED') {
        setIsPremiumDenied(true);
      } else {
        setErrorMessage(err.response?.data?.message || t('doctorPrescriptions.loadError') || 'Failed to load prescription.');
      }
    } finally {
      setLoading(false);
    }
  }, [role, patientId, consultationId, prescriptionId, t]);

  useEffect(() => {
    loadPrescription();
  }, [loadPrescription]);

  const handlePrint = () => {
    window.print();
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '');
  const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : '');

  // Prefer the immutable server-generated snapshot; fall back to populated refs.
  const snap = prescription?.documentSnapshot || {};
  const doctorName =
    snap.doctor?.fullName || prescription?.doctorId?.fullName || t('doctorPrescriptions.doctorInfo') || 'Doctor';
  const doctorTitle = snap.doctor?.professionalTitle || '';
  const doctorSpecialty = snap.doctor?.specialty || '';
  const doctorEmail = snap.doctor?.email || '';
  const doctorPhone = snap.doctor?.phone || '';
  const patientName = snap.patient?.fullName || t('doctorPrescriptions.patientInfo') || 'Patient';
  const patientCity = [snap.patient?.city, snap.patient?.countryName].filter(Boolean).join(', ');
  const clinic = snap.clinic || {};
  const hasClinic = Boolean(clinic.clinicName || clinic.addressLine || clinic.city || clinic.phone);
  const items = Array.isArray(prescription?.items) ? prescription.items : [];
  const status = prescription?.status || '';

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Print-specific styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
          body { background: #ffffff !important; }
        }
      `}</style>

      {/* Screen-only toolbar */}
      <div className="no-print max-w-3xl mx-auto px-4 pt-6 flex items-center justify-between">
        <button
          onClick={() => {
            if (role === 'doctor') {
              navigate(`/doctor-patients/${patientId}/consultations/${consultationId}/prescriptions`);
            } else {
              navigate('/my-prescriptions');
            }
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t('doctorPrescriptions.backToList') || 'Back to Prescriptions'}</span>
        </button>
        <button
          onClick={handlePrint}
          disabled={loading || !prescription || isPremiumDenied}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
        >
          <Printer className="w-4 h-4" />
          <span>{t('doctorPrescriptions.printPrescription') || 'Print'}</span>
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm text-slate-500">{t('doctorPrescriptions.loading') || 'Loading...'}</p>
        </div>
      )}

      {!loading && isPremiumDenied && (
        <div className="no-print max-w-3xl mx-auto mt-8 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-2xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-600 mx-auto flex items-center justify-center">
            <Crown className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              {t('medicalProfile.premiumRequiredTitle') || 'Premium Feature'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
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

      {!loading && !isPremiumDenied && errorMessage && (
        <div className="no-print max-w-3xl mx-auto mt-8 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700">{errorMessage}</p>
        </div>
      )}

      {!loading && !isPremiumDenied && !errorMessage && prescription && (
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="print-sheet bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 space-y-8">
            {/* Branding Header */}
            <div className="flex items-start justify-between pb-6 border-b-2 border-blue-600">
              <div>
                <h1 className="text-2xl font-extrabold text-blue-700 tracking-tight">HomelyServ</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('doctorPrescriptions.printTitle') || 'Prescription'}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs text-slate-500">{t('doctorPrescriptions.prescriptionNumber') || 'Prescription No.'}</p>
                <p className="text-sm font-bold text-slate-900 font-mono">{prescription.prescriptionNumber}</p>
                <p className="text-xs text-slate-500">
                  {t('doctorPrescriptions.issueDate') || 'Issue Date'}: {fmtDate(prescription.issuedAt)}
                </p>
                {status === 'CANCELLED' && (
                  <p className="text-xs font-semibold text-rose-600 uppercase">
                    {t('doctorPrescriptions.statuses.CANCELLED') || 'Cancelled'}
                  </p>
                )}
              </div>
            </div>

            {/* Doctor & Patient Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {t('doctorPrescriptions.doctorInfo') || 'Doctor'}
                </h2>
                <p className="text-sm font-bold text-slate-900">
                  {doctorTitle ? `${doctorTitle} ` : ''}
                  {doctorName}
                </p>
                {doctorSpecialty && <p className="text-xs text-slate-600">{doctorSpecialty}</p>}
                {doctorEmail && <p className="text-xs text-slate-500">{doctorEmail}</p>}
                {doctorPhone && <p className="text-xs text-slate-500">{doctorPhone}</p>}
              </div>
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {t('doctorPrescriptions.patientInfo') || 'Patient'}
                </h2>
                <p className="text-sm font-bold text-slate-900">{patientName}</p>
                {patientCity && <p className="text-xs text-slate-600">{patientCity}</p>}
                {snap.patient?.phone && <p className="text-xs text-slate-500">{snap.patient.phone}</p>}
              </div>
            </div>

            {/* Clinic / Practice Information */}
            {hasClinic && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {t('doctorPrescriptions.clinicInfo') || 'Clinic'}
                </h2>
                <div className="text-xs text-slate-600 space-y-0.5">
                  {clinic.clinicName && <p className="font-semibold text-slate-800">{clinic.clinicName}</p>}
                  {clinic.addressLine && <p>{clinic.addressLine}</p>}
                  {clinic.city && <p>{clinic.city}</p>}
                  {clinic.phone && <p>{clinic.phone}</p>}
                </div>
              </div>
            )}

            {/* Medications */}
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                {t('doctorPrescriptions.medications') || 'Medications'}
              </h2>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-bold text-slate-900">
                        {item.drugName}
                        {item.strength ? ` ${item.strength}` : ''}
                      </p>
                      {item.form && <span className="text-xs text-slate-500">({item.form})</span>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pl-8">
                      <div>
                        <span className="block text-slate-400 font-medium">
                          {t('doctorPrescriptions.dosage') || 'Dosage'}
                        </span>
                        <span className="text-slate-800 font-semibold">{item.dosage}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-medium">
                          {t('doctorPrescriptions.frequency') || 'Frequency'}
                        </span>
                        <span className="text-slate-800 font-semibold">{item.frequency}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-medium">
                          {t('doctorPrescriptions.duration') || 'Duration'}
                        </span>
                        <span className="text-slate-800 font-semibold">{item.duration}</span>
                      </div>
                      {item.quantity && (
                        <div>
                          <span className="block text-slate-400 font-medium">
                            {t('doctorPrescriptions.quantity') || 'Quantity'}
                          </span>
                          <span className="text-slate-800 font-semibold">{item.quantity}</span>
                        </div>
                      )}
                    </div>
                    {item.instructions && (
                      <p className="text-xs text-slate-600 pl-8">
                        <span className="font-medium text-slate-400">
                          {t('doctorPrescriptions.instructions') || 'Instructions'}:{' '}
                        </span>
                        {item.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {prescription.notes && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {t('doctorPrescriptions.notes') || 'Notes'}
                </h2>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{prescription.notes}</p>
              </div>
            )}

            {/* Follow-up */}
            {prescription.followUpDate && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {t('doctorPrescriptions.followUp') || 'Follow-up'}
                </h2>
                <p className="text-sm font-semibold text-slate-900">{fmtDate(prescription.followUpDate)}</p>
              </div>
            )}

            {/* Cancellation notice */}
            {status === 'CANCELLED' && prescription.cancellationReason && (
              <div className="border border-rose-200 bg-rose-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-rose-700 mb-1">
                  {t('doctorPrescriptions.cancelReasonTitle') || 'Cancellation Reason'}
                </p>
                <p className="text-xs text-rose-600">{prescription.cancellationReason}</p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
              <span>{t('doctorPrescriptions.printFooter') || 'This prescription was issued through HomelyServ.'}</span>
              <span>
                {t('doctorPrescriptions.printGenerated') || 'Printed on'} {fmtDateTime(new Date())}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintablePrescription;
