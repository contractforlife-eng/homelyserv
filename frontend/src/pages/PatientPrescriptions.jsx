// frontend/src/pages/PatientPrescriptions.jsx
// Patient Prescription records (Phase 9) — READ-ONLY.
// Shows only the patient's own ISSUED prescriptions via /api/medical/prescriptions.
// Patients can view details and open a printable view; no write operations exist.
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import { Pill, ArrowLeft, AlertCircle, Loader2, Printer, FileText, Crown, ArrowRight } from 'lucide-react';

const PatientPrescriptions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPremiumDenied, setIsPremiumDenied] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setIsPremiumDenied(false);
      const res = await api.get('/api/medical/prescriptions');
      setPrescriptions(Array.isArray(res.data?.prescriptions) ? res.data.prescriptions : []);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'PREMIUM_REQUIRED') {
        setIsPremiumDenied(true);
      } else {
        setErrorMessage(
          err.response?.data?.message || t('doctorPrescriptions.loadError') || 'Failed to load prescriptions.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '');
  const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : '');

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('medicalProfile.tabPrescriptions') || 'My Prescriptions'}
        subtitle={t('medicalProfile.rxPageSubtitle') || 'Prescriptions issued by your doctors.'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        {!isPremiumDenied && (
          <button
            onClick={() => {
              if (selectedRecord) {
                setSelectedRecord(null);
              } else {
                navigate(-1);
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>
              {selectedRecord
                ? t('medicalProfile.rxBackToList') || 'Back to Prescriptions'
                : t('medicalProfile.rxBack') || 'Back'}
            </span>
          </button>
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

        {errorMessage && !isPremiumDenied && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{errorMessage}</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-slate-500">{t('medicalProfile.rxLoading') || 'Loading prescriptions...'}</p>
          </div>
        )}

        {/* ---------------- LIST ---------------- */}
        {!loading && !selectedRecord && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-500" />
                {t('medicalProfile.rxListTitle') || 'Prescription History'}
              </h3>
              <span className="text-xs text-slate-500">
                {prescriptions.length} {t('medicalProfile.rxRecords') || 'Records'}
              </span>
            </div>

            {prescriptions.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('medicalProfile.rxNoIssued') || 'No issued prescriptions yet'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t('medicalProfile.rxNoIssuedDesc') ||
                    'When your doctor issues a prescription, it will appear here.'}
                </p>
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {t('doctorPrescriptions.statuses.ISSUED') || 'Issued'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-md">
                        {Array.isArray(rx.items) && rx.items.length > 0
                          ? rx.items.map((i) => i.drugName).join(', ')
                          : ''}
                      </p>
                      <p className="text-xs text-slate-500">
                        {rx.doctorId?.fullName
                          ? `${t('doctorPrescriptions.doctorInfo') || 'Doctor'}: ${rx.doctorId.fullName}`
                          : ''}
                        {rx.issuedAt ? ` • ${t('doctorPrescriptions.issueDate') || 'Issued'}: ${fmtDate(rx.issuedAt)}` : ''}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedRecord(rx)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                    >
                      {t('medicalProfile.rxView') || 'View'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- DETAIL (READ-ONLY) ---------------- */}
        {!loading && selectedRecord && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100">
                    {selectedRecord.prescriptionNumber}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {t('doctorPrescriptions.statuses.ISSUED') || 'Issued'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {t('doctorPrescriptions.issueDate') || 'Issued'}: {fmtDateTime(selectedRecord.issuedAt)}
                </p>
              </div>
              <button
                onClick={() => navigate(`/my-prescriptions/${selectedRecord._id}/print`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                {t('doctorPrescriptions.printPrescription') || 'Print'}
              </button>
            </div>

            {/* Doctor info from snapshot */}
            {selectedRecord.documentSnapshot?.doctor && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  {t('doctorPrescriptions.doctorInfo') || 'Doctor'}
                </h4>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {selectedRecord.documentSnapshot.doctor.professionalTitle
                    ? `${selectedRecord.documentSnapshot.doctor.professionalTitle} `
                    : ''}
                  {selectedRecord.documentSnapshot.doctor.fullName}
                </p>
                {selectedRecord.documentSnapshot.doctor.specialty && (
                  <p className="text-xs text-slate-500">{selectedRecord.documentSnapshot.doctor.specialty}</p>
                )}
              </div>
            )}

            {/* Medications */}
            {Array.isArray(selectedRecord.items) && selectedRecord.items.length > 0 && (
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
                  {fmtDate(selectedRecord.followUpDate)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientPrescriptions;
