// backend/src/config/manualPayments.js
// Narrow configuration for manual payment receiving values.
// All values are read from environment variables and are never hardcoded.

export const MANUAL_PROVIDERS = Object.freeze({
  VODAFONE_CASH: 'vodafone_cash',
  INSTAPAY: 'instapay',
});

export const MANUAL_REVIEW_STATES = Object.freeze({
  AWAITING_TRANSFER: 'awaiting_transfer',
  PROOF_SUBMITTED: 'proof_submitted',
  PENDING_VERIFICATION: 'pending_verification',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
});

const safeGetEnv = (key) => {
  const value = process.env[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

export const getManualPaymentConfig = () => {
  const vodafoneCashNumber = safeGetEnv('VODAFONE_CASH_NUMBER');
  const instapayPhone = safeGetEnv('INSTAPAY_PHONE');
  const instapayIpa = safeGetEnv('INSTAPAY_IPA');
  const instapayPaymentLink = safeGetEnv('INSTAPAY_PAYMENT_LINK');

  return {
    vodafoneCash: {
      number: vodafoneCashNumber,
      configured: Boolean(vodafoneCashNumber),
    },
    instapay: {
      phone: instapayPhone,
      ipa: instapayIpa,
      paymentLink: instapayPaymentLink,
      configured: Boolean(instapayPhone && instapayIpa && instapayPaymentLink),
    },
  };
};
