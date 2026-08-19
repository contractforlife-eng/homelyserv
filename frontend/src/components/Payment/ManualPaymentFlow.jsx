// frontend/src/components/Payment/ManualPaymentFlow.jsx
// Shared manual payment instructions + proof submission flow.
// Used by Subscription, PaymentOptions, PaymentCommission, and PaymentModal.
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Copy,
  CheckCircle,
  Loader2,
  AlertCircle,
  Upload,
  ExternalLink,
  Smartphone,
  Building2
} from 'lucide-react';
import { createManualPayment, submitManualPaymentProof } from '../../services/paymentService';

const MANUAL_PROOF_MAX_SIZE_MB = 5;
const MANUAL_PROOF_MAX_SIZE_BYTES = MANUAL_PROOF_MAX_SIZE_MB * 1024 * 1024;
const MANUAL_PROOF_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ManualPaymentFlow = ({ paymentMethod, purpose, plan, hireId, onSubmitted, onCancel }) => {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);
  const [creationError, setCreationError] = useState(null);
  const [manualPayment, setManualPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isReturningPending, setIsReturningPending] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [externalRef, setExternalRef] = useState('');
  const fileInputRef = useRef(null);
  const createInFlightRef = useRef(false);

  const isVodafone = paymentMethod === 'vodafone_cash';
  const isInstapay = paymentMethod === 'instapay';

  const handleCreate = async () => {
    if (!paymentMethod || createInFlightRef.current) return;
    createInFlightRef.current = true;
    setCreating(true);
    setCreationError(null);

    try {
      const payload = {
        paymentMethod,
        purpose,
        ...(plan ? { plan } : {}),
        ...(hireId ? { hireId } : {}),
      };
      const result = await createManualPayment(payload);
      if (result.success && result.payment) {
        setManualPayment(result);
        if (result.payment.manualReviewState === 'pending_verification') {
          setIsReturningPending(true);
          setSubmitted(true);
        }
      } else {
        setCreationError(result.error || t('manualPayment.errors.creationFailed'));
      }
    } catch (error) {
      setCreationError(error.message || t('manualPayment.errors.creationFailed'));
    } finally {
      createInFlightRef.current = false;
      setCreating(false);
    }
  };

  const handleCopy = async (text, field) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!MANUAL_PROOF_ALLOWED_TYPES.includes(file.type)) {
      setSubmitError(t('manualPayment.errors.invalidFileType'));
      return;
    }
    if (file.size > MANUAL_PROOF_MAX_SIZE_BYTES) {
      setSubmitError(t('manualPayment.errors.fileTooLarge', { max: MANUAL_PROOF_MAX_SIZE_MB }));
      return;
    }

    setProofFile(file);
    setSubmitError(null);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setProofPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  };

  const handleSubmitProof = async () => {
    if (!proofFile || !externalRef.trim() || submitting) return;

    const trimmedRef = externalRef.trim();
    if (trimmedRef.length < 3) {
      setSubmitError(t('manualPayment.errors.referenceTooShort'));
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('externalTransactionReference', trimmedRef);
      formData.append('proof', proofFile);

      const result = await submitManualPaymentProof(manualPayment.payment.id, formData);
      if (result.success) {
        setManualPayment(prev => ({
          ...prev,
          payment: { ...prev.payment, ...result.payment }
        }));
        setSubmitted(true);
        setIsReturningPending(false);
        if (onSubmitted) onSubmitted(result);
      } else {
        setSubmitError(result.error || t('manualPayment.errors.submitFailed'));
      }
    } catch (error) {
      setSubmitError(error.message || t('manualPayment.errors.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setManualPayment(null);
    setSubmitted(false);
    setIsReturningPending(false);
    setCreationError(null);
    setSubmitError(null);
    setProofFile(null);
    setProofPreview(null);
    setExternalRef('');
  };

  useEffect(() => {
    if (paymentMethod && !manualPayment && !submitted && !creating) {
      handleCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (manualPayment) {
    const reviewState = manualPayment.payment?.manualReviewState;

    if (reviewState === 'rejected') {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              {t('manualPayment.rejected.title')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              {t('manualPayment.rejected.description')}
            </p>
          </div>
        </div>
      );
    }

    if (reviewState === 'pending_verification' && submitted) {
      const description = isReturningPending
        ? t('manualPayment.pendingVerification.returningDescription')
        : t('manualPayment.pendingVerification.description');
      const warningText = isReturningPending
        ? t('manualPayment.pendingVerification.returningWarning')
        : t('manualPayment.pendingVerification.warning');

      return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 size={32} className="text-amber-600 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              {t('manualPayment.pendingVerification.title')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4">
              {description}
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 mb-4">
              {warningText}
            </div>
            <div className="text-left bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('manualPayment.method')}</span>
                <span className="font-medium text-gray-800 dark:text-white capitalize">{manualPayment.payment.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('manualPayment.amount')}</span>
                <span className="font-medium text-gray-800 dark:text-white">{manualPayment.payment.amount} {manualPayment.payment.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('manualPayment.reference')}</span>
                <span className="font-mono font-medium text-gray-800 dark:text-white">{manualPayment.payment.manualPaymentReference}</span>
              </div>
              {manualPayment.payment.submittedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('manualPayment.submittedAt')}</span>
                  <span className="font-medium text-gray-800 dark:text-white">{new Date(manualPayment.payment.submittedAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('manualPayment.status')}</span>
                <span className="font-medium text-amber-600">{t('manualPayment.pendingVerification.label')}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (reviewState === 'awaiting_transfer' || reviewState === 'proof_submitted') {
      const instructions = manualPayment.transferInstructions || {};
      return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          {t('manualPayment.instructions.title')}
        </h3>

        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('manualPayment.amount')}</span>
            <span className="font-semibold text-teal-700 dark:text-teal-300">
              {manualPayment.payment.amount} {manualPayment.payment.currency}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('manualPayment.reference')}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-teal-700 dark:text-teal-300">
                {manualPayment.payment.manualPaymentReference}
              </span>
              <button
                onClick={() => handleCopy(manualPayment.payment.manualPaymentReference, 'reference')}
                className="p-1 hover:bg-teal-100 rounded"
                title={t('manualPayment.copy')}
              >
                {copiedField === 'reference' ? <CheckCircle size={16} className="text-teal-600" /> : <Copy size={16} className="text-teal-600" />}
              </button>
            </div>
          </div>
        </div>

        {isVodafone && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('manualPayment.destination')}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 dark:text-white">{instructions.destination}</span>
                <button
                  onClick={() => handleCopy(instructions.destination, 'destination')}
                  className="p-1 hover:bg-gray-200 rounded"
                  title={t('manualPayment.copy')}
                >
                  {copiedField === 'destination' ? <CheckCircle size={16} className="text-gray-600" /> : <Copy size={16} className="text-gray-600" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">{t('manualPayment.instructions.vodafoneInstructions')}</p>
          </div>
        )}

        {isInstapay && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('manualPayment.phone')}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 dark:text-white">{instructions.phone}</span>
                <button
                  onClick={() => handleCopy(instructions.phone, 'phone')}
                  className="p-1 hover:bg-gray-200 rounded"
                  title={t('manualPayment.copy')}
                >
                  {copiedField === 'phone' ? <CheckCircle size={16} className="text-gray-600" /> : <Copy size={16} className="text-gray-600" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('manualPayment.ipa')}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 dark:text-white">{instructions.ipa}</span>
                <button
                  onClick={() => handleCopy(instructions.ipa, 'ipa')}
                  className="p-1 hover:bg-gray-200 rounded"
                  title={t('manualPayment.copy')}
                >
                  {copiedField === 'ipa' ? <CheckCircle size={16} className="text-gray-600" /> : <Copy size={16} className="text-gray-600" />}
                </button>
              </div>
            </div>
            {instructions.paymentLink && (
              <a
                href={instructions.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                <ExternalLink size={16} />
                {t('manualPayment.payWithInstapay')}
              </a>
            )}
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {t('manualPayment.proof.title')}
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-1">
                {t('manualPayment.proof.transactionReference')}
              </label>
              <input
                type="text"
                value={externalRef}
                onChange={(e) => setExternalRef(e.target.value)}
                placeholder={t('manualPayment.proof.transactionReferencePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-1">
                {t('manualPayment.proof.uploadLabel')}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:border-teal-500 hover:text-teal-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                {proofFile ? proofFile.name : t('manualPayment.proof.uploadButton')}
              </button>
              {proofPreview && (
                <img src={proofPreview} alt="Proof preview" className="mt-2 max-h-32 rounded-lg border border-gray-200" />
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {t('manualPayment.proof.supportedFormats')}
              </p>
            </div>
          </div>

          {submitError && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {submitError}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSubmitProof}
              disabled={submitting || !proofFile || !externalRef.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('manualPayment.proof.submitting')}
                </>
              ) : (
                <>
                  <Upload size={18} />
                  {t('manualPayment.proof.submit')}
                </>
              )}
            </button>
            <button
              onClick={onCancel || handleBack}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:bg-gray-900 transition disabled:opacity-50"
            >
              {t('manualPayment.cancel')}
            </button>
          </div>
        </div>
      </div>
    );
  }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
      {creationError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {creationError}
        </div>
      )}

      {creating && !manualPayment && (
        <div className="flex items-center justify-center gap-2 py-6 text-gray-600 dark:text-gray-300">
          <Loader2 size={20} className="animate-spin" />
          {t('manualPayment.creating')}
        </div>
      )}

      {!creating && !manualPayment && !submitted && (
        <button
          onClick={handleCreate}
          className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {t('manualPayment.continue')}
        </button>
      )}

      {onCancel && (
        <button
          onClick={onCancel}
          disabled={creating || submitting}
          className="mt-3 w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:bg-gray-900 transition disabled:opacity-50"
        >
          {t('manualPayment.cancel')}
        </button>
      )}
    </div>
  );
};

export default ManualPaymentFlow;
