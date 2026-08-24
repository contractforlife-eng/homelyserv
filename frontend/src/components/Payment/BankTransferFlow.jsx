import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createBankTransferPayment, fetchBankTransferCapability, submitBankTransferReference } from '../../services/paymentService';

const BankTransferFlow = ({ purpose, plan, hireId, onCancel, capabilityAvailable }) => {
  const { t } = useTranslation();
  const [payment, setPayment] = useState(null);
  const [instructions, setInstructions] = useState(null);
  const [referenceInput, setReferenceInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [capabilityLoading, setCapabilityLoading] = useState(capabilityAvailable == null);

  useEffect(() => {
    let active = true;
    const create = async (allowed = capabilityAvailable === true) => {
      try {
        if (!allowed) return;
        setLoading(true);
        setError(null);
        const result = await createBankTransferPayment({ purpose, plan, hireId });
        if (!active) return;
        if (!result?.success) throw new Error(result?.error || t('bankTransfer.unavailable'));
        setPayment(result.payment);
        setInstructions(result.transferInstructions);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.error || requestError.message || t('bankTransfer.unavailable'));
      } finally {
        if (active) setLoading(false);
      }
    };
    const loadCapability = async () => {
      if (capabilityAvailable !== undefined && capabilityAvailable !== null) {
        setCapabilityLoading(false);
        if (capabilityAvailable) create(true);
        else {
          setLoading(false);
          setError(t('bankTransfer.unavailable'));
        }
        return;
      }
      try {
        const capability = await fetchBankTransferCapability({ purpose, plan, hireId });
        if (!active) return;
        setCapabilityLoading(false);
        if (capability?.available === true) create(true);
        else {
          setLoading(false);
          setError(t('bankTransfer.unavailable'));
        }
      } catch (capabilityError) {
        if (!active) return;
        setCapabilityLoading(false);
        setLoading(false);
        setError(capabilityError.response?.data?.error || t('bankTransfer.unavailable'));
      }
    };
    loadCapability();
    return () => { active = false; };
  }, [purpose, plan, hireId, capabilityAvailable, t]);

  const submitReference = async (event) => {
    event.preventDefault();
    if (!payment || !referenceInput.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      const result = await submitBankTransferReference(payment.id, referenceInput.trim());
      if (!result?.success) throw new Error(result?.error || t('bankTransfer.failed'));
      setPayment(result.payment);
    } catch (submitError) {
      setError(submitError.response?.data?.error || submitError.message || t('bankTransfer.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitted = payment?.manualReviewState === 'pending_verification';

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('bankTransfer.category')}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('bankTransfer.description')}</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm flex gap-2"><AlertCircle size={16} />{error}</div>}

      {(capabilityLoading || loading) && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 size={16} className="animate-spin" />{t('bankTransfer.loading')}</div>}

      {!loading && instructions && payment && !submitted && (
        <>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {payment.canonicalAmount && payment.canonicalCurrency && (
              <p><strong>{t('bankTransfer.canonicalAmount')}:</strong> {payment.canonicalAmount} {payment.canonicalCurrency}</p>
            )}
            <p><strong>{t('bankTransfer.amount')}:</strong> {instructions.amount} {instructions.currency}</p>
            <p><strong>{t('bankTransfer.reference')}:</strong> {instructions.reference}</p>
            <p><strong>{t('bankTransfer.accountName')}:</strong> {instructions.accountName}</p>
            <p><strong>{t('bankTransfer.bankName')}:</strong> {instructions.bankName}</p>
            <p><strong>{t('bankTransfer.accountNumber')}:</strong> {instructions.accountNumber}</p>
            <p><strong>{t('bankTransfer.routingNumber')}:</strong> {instructions.routingNumber}</p>
            {instructions.accountType && <p><strong>{t('bankTransfer.accountType')}:</strong> {instructions.accountType}</p>}
          </div>
          <form onSubmit={submitReference} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('bankTransfer.transferReference')}</label>
            <input value={referenceInput} onChange={(event) => setReferenceInput(event.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2" required maxLength={100} />
            <button type="submit" disabled={submitting || !referenceInput.trim()} className="w-full rounded-lg bg-teal-600 text-white py-2.5 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={16} className="animate-spin" />}{t('bankTransfer.completedAction')}
            </button>
          </form>
        </>
      )}

      {submitted && <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 flex gap-2"><CheckCircle size={18} />{t('bankTransfer.awaitingVerification')}</div>}
      <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">{t('bankTransfer.cancel')}</button>
    </section>
  );
};

export default BankTransferFlow;
