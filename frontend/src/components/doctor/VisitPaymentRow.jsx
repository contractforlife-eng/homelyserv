// frontend/src/components/doctor/VisitPaymentRow.jsx
// Per-visit payment row for Doctor patient appointment history.
//
// An APPOINTMENT IS THE VISIT. There is no Visit model, no payment model and
// no new endpoint: payment is the existing `DoctorIncome` record linked to
// `DoctorIncome.appointmentId`, created through the existing
// POST /api/doctor-accounts/income route.
//
// This component is intentionally small and shared by BOTH patient detail
// pages (HomelyServ and Clinic) so the amount input, validation, per-visit
// submitting state and duplicate handling exist in exactly one place.
//
// The parent supplies the appointment (already numbered) and the paid map
// built from RECEIVED income only; this component owns only the input state
// and the submit.
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Wallet, CheckCircle2 } from 'lucide-react';
import api from '../../utils/api';
import { formatCurrencyAmount } from '../../utils/currencyPresentation';

// Money can never be received for a cancelled visit or a no-show.
const NON_PAYABLE_STATUSES = ['CANCELLED', 'NO_SHOW'];

const stop = (e) => e?.stopPropagation?.();

/**
 * @param appointment the appointment as returned by the patient appointments
 *                    endpoint (appointmentId, startsAt, status, currency …)
 * @param visitNumber 1-based number derived from the appointment list order
 * @param paidIncome  the RECEIVED DoctorIncome for this appointment, or null
 * @param patientType 'HOMELY' (send patientId) | 'CLINIC' (send clinicPatientId)
 * @param patientId   the HomelyServ user id, or the ClinicPatient id
 * @param onPaid      called after a successful payment so the parent re-reads
 *                    its income list and rebuilds the paid map
 */
const VisitPaymentRow = ({ appointment, visitNumber, paidIncome, patientType, patientId, onPaid }) => {
  const { t } = useTranslation();

  const appointmentId = appointment?.appointmentId;
  // Local to this appointment, so two visits never share input or busy state.
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!appointmentId) return null;

  const isPaid = Boolean(paidIncome);
  const isPayable = !isPaid && !NON_PAYABLE_STATUSES.includes(appointment?.status);

  const start = (event) => {
    stop(event);
    if (submitting || !isPayable) return;

    const trimmed = String(amount).trim();
    if (trimmed === '') { setError(t('doctorPatients.amountRequired')); return; }
    const value = Number(trimmed);
    if (!Number.isFinite(value) || value <= 0 || value > 1000000) {
      setError(t('doctorPatients.amountInvalid'));
      return;
    }

    setSubmitting(true);
    setError('');
    setNotice(null);

    // Exactly ONE patient reference: CONSULTATION income enforces this XOR.
    const patientRef = patientType === 'CLINIC'
      ? { clinicPatientId: patientId }
      : { patientId };

    api.post('/api/doctor-accounts/income', {
      amount: value,                          // the doctor's entered amount
      currency: appointment.currency || 'EGP',
      incomeDate: new Date().toISOString(),   // money received today
      source: 'CONSULTATION',
      // Recording the visit as Paid IS the receipt, so the status is stated
      // explicitly rather than relying on the model default. This is the ONLY
      // thing that marks money as received: a COMPLETED/CONFIRMED appointment
      // or a signed consultation never implies payment.
      status: 'RECEIVED',
      appointmentId,                          // this exact visit
      ...patientRef
    })
      .then(() => {
        setAmount('');
        setNotice({ type: 'success', text: t('doctorPatients.paymentRecordedForVisit') });
        return onPaid?.();
      })
      .catch((err) => {
        // The backend's partial unique index on appointmentId rejects a second
        // payment for the same visit. That means "already paid", not a failure.
        const message = String(err?.response?.data?.message || '');
        const duplicate = err?.response?.status === 400 &&
          (err?.response?.data?.code === 11000 || /E11000|duplicate key/i.test(message));
        if (duplicate) {
          setAmount('');
          setNotice({ type: 'info', text: t('doctorPatients.alreadyPaid') });
          return onPaid?.();
        }
        console.error('Error recording visit payment:', err);
        setError(err?.response?.data?.message || t('doctorPatients.paymentError'));
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2" onClick={stop} onKeyDown={stop}>
      {isPaid ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={12} />
          {t('doctorPatients.amount')}:{' '}
          {/* Single currency label: the formatter already emits the code. */}
          {formatCurrencyAmount(paidIncome.amount, paidIncome.currency || appointment.currency || 'EGP')}
        </span>
      ) : (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {t('doctorPatients.amount')}: —
        </span>
      )}

      {/* The control belongs to THIS visit. A paid sibling never hides it. */}
      {isPayable && (
        <>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            aria-label={t('doctorPatients.amount')}
            placeholder={t('doctorPatients.amountPlaceholder')}
            value={amount}
            disabled={submitting}
            onClick={stop}
            onKeyDown={stop}
            onChange={(e) => { stop(e); setAmount(e.target.value); if (error) setError(''); }}
            className="w-24 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:opacity-60"
          />
          <button
            type="button"
            disabled={submitting}
            onClick={start}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-950/70 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Wallet size={12} />}
            {submitting ? t('doctorPatients.markingPaid') : t('doctorPatients.markPaid')}
          </button>
        </>
      )}

      {error && <span className="text-[11px] text-rose-600 dark:text-rose-400">{error}</span>}
      {notice && (
        <span className={`text-[11px] ${notice.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
          {notice.text}
        </span>
      )}
    </div>
  );
};

export default VisitPaymentRow;
