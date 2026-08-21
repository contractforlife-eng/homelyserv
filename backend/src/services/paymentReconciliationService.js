import { isSupportedCurrency, normalizeCurrencyCode } from '../utils/currencyMetadata.js';
import { formatMoneyDecimal, getCurrencyMinorUnit, toMinorUnits } from '../utils/money.js';
import { reconcileSubscriptionRefund } from './subscriptionRefundReconciliationService.js';
import {
  isTurkeySubscriptionPayment,
  resolvePersistedTrySubscriptionEvidence,
  TRY_TO_USD_CONVERTED_MODE,
} from './trySubscriptionProviderEvidenceService.js';

export const RECONCILIATION_STATES = Object.freeze({
  MATCHED: 'MATCHED',
  MISMATCH: 'MISMATCH',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
});

export const REFUND_STATES = Object.freeze({
  NONE: 'NONE',
  PARTIAL: 'PARTIAL',
  FULL: 'FULL',
  PENDING: 'PENDING',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
});

const COMPLETED = 'completed';
const FULFILLED = 'fulfilled';
const knownPaymentStatuses = new Set(['pending', 'processing', 'completed', 'failed']);
const knownFulfillmentStatuses = new Set(['pending', 'processing', 'fulfilled', 'failed']);
const knownRefundStatuses = new Set(['pending', 'processing', 'completed', 'failed', 'review_required']);

const addReason = (reasons, code, severity, refundId = null) => {
  if (!reasons.some((reason) => reason.code === code && reason.refundId === refundId)) {
    reasons.push({ code, severity, ...(refundId ? { refundId } : {}) });
  }
};

const canonicalCurrency = (value) => {
  const currency = normalizeCurrencyCode(value);
  return currency && isSupportedCurrency(currency) ? currency : null;
};

const parseCanonicalDecimal = (value, currency, { requireString = true, positive = true } = {}) => {
  if (!currency || (requireString && typeof value !== 'string')) return null;
  try {
    const canonical = formatMoneyDecimal(value, currency);
    if (requireString && canonical !== value) return null;
    if (!requireString && (typeof value !== 'number' || !Number.isFinite(value) || Number(canonical) !== value)) {
      return null;
    }
    const minor = BigInt(toMinorUnits(value, currency));
    if (positive && minor <= 0n) return null;
    return { canonical, minor };
  } catch {
    return null;
  }
};

const fromMinorUnits = (minor, currency) => {
  const digits = getCurrencyMinorUnit(currency);
  const factor = 10n ** BigInt(digits);
  const whole = minor / factor;
  if (digits === 0) return String(whole);
  return `${whole}.${(minor % factor).toString().padStart(digits, '0')}`;
};

const getStoredMode = (payment, currency, providerCurrency) => {
  const method = String(payment?.paymentMethod || '').toLowerCase();
  const purpose = String(payment?.purpose || 'COMMISSION').toUpperCase();
  if (method === 'paymob' && currency === 'EGP' && providerCurrency === 'EGP') return 'DIRECT';
  if (method === 'paypal' && purpose === 'COMMISSION' && ['USD', 'EUR', 'GBP'].includes(currency) && providerCurrency === currency) {
    return 'DIRECT';
  }
  if (method === 'paypal' && currency === 'EGP' && providerCurrency === 'USD') {
    return purpose === 'SUBSCRIPTION' ? 'LEGACY_CONVERTED_SUBSCRIPTION' : 'LEGACY_CONVERTED_COMMISSION';
  }
  return 'UNKNOWN';
};

export const getDuplicateRefundEvidence = (payments = []) => {
  const providerIds = new Map();
  const idempotencyKeys = new Map();
  for (const payment of payments) {
    for (const refund of payment?.Refunds || []) {
      if (refund.providerRefundId) {
        providerIds.set(refund.providerRefundId, (providerIds.get(refund.providerRefundId) || 0) + 1);
      }
      if (refund.idempotencyKey) {
        idempotencyKeys.set(refund.idempotencyKey, (idempotencyKeys.get(refund.idempotencyKey) || 0) + 1);
      }
    }
  }
  return {
    providerRefundIds: new Set([...providerIds].filter(([, count]) => count > 1).map(([id]) => id)),
    idempotencyKeys: new Set([...idempotencyKeys].filter(([, count]) => count > 1).map(([key]) => key)),
  };
};

export const reconcilePayment = (payment, duplicateEvidence = {}, context = {}) => {
  const reasons = [];
  const refunds = payment?.Refunds || [];
  const paymentCurrency = canonicalCurrency(payment?.currency);
  const providerCurrency = canonicalCurrency(payment?.providerCurrency);
  const paymentAmount = paymentCurrency
    ? parseCanonicalDecimal(payment?.amount, paymentCurrency, { requireString: false })
    : null;
  const providerAmount = providerCurrency && payment?.providerAmount != null
    ? parseCanonicalDecimal(payment.providerAmount, providerCurrency)
    : null;

  if (!paymentAmount) addReason(reasons, 'INVALID_PAYMENT_AMOUNT', 'MISMATCH');
  if (!paymentCurrency) addReason(reasons, 'INVALID_PAYMENT_CURRENCY', 'MISMATCH');
  if ((payment?.providerAmount == null) !== (payment?.providerCurrency == null)) {
    addReason(reasons, 'INCOMPLETE_PROVIDER_EVIDENCE', 'REVIEW_REQUIRED');
  } else if (payment?.providerAmount == null) {
    if (payment?.status === COMPLETED) addReason(reasons, 'MISSING_PROVIDER_EVIDENCE', 'REVIEW_REQUIRED');
  } else {
    if (!providerCurrency) addReason(reasons, 'INVALID_PROVIDER_CURRENCY', 'MISMATCH');
    if (!providerAmount) addReason(reasons, 'INVALID_PROVIDER_AMOUNT', 'MISMATCH');
  }

  let tryEvidence = null;
  let tryEvidenceError = null;
  if (isTurkeySubscriptionPayment(payment)) {
    try {
      tryEvidence = resolvePersistedTrySubscriptionEvidence(payment);
    } catch (error) {
      tryEvidenceError = error;
    }
  }
  const storedMode = tryEvidence ? TRY_TO_USD_CONVERTED_MODE : getStoredMode(payment, paymentCurrency, providerCurrency);
  if (isTurkeySubscriptionPayment(payment) && tryEvidenceError) {
    addReason(reasons, 'INVALID_TRY_SUBSCRIPTION_FX_SNAPSHOT', 'MISMATCH');
  }
  if (payment?.providerAmount != null && payment?.providerCurrency != null) {
    if (storedMode === TRY_TO_USD_CONVERTED_MODE) {
      if (providerCurrency !== 'USD') addReason(reasons, 'TRY_PROVIDER_CURRENCY_MISMATCH', 'MISMATCH');
      if (tryEvidence && providerAmount && providerAmount.canonical !== tryEvidence.providerAmount) {
        addReason(reasons, 'TRY_PROVIDER_AMOUNT_MISMATCH', 'MISMATCH');
      }
    } else if (storedMode === 'DIRECT') {
      if (providerCurrency !== paymentCurrency) addReason(reasons, 'DIRECT_PROVIDER_CURRENCY_MISMATCH', 'MISMATCH');
      if (paymentAmount && providerAmount && paymentAmount.minor !== providerAmount.minor) {
        addReason(reasons, 'DIRECT_PROVIDER_AMOUNT_MISMATCH', 'MISMATCH');
      }
    } else if (storedMode === 'UNKNOWN') {
      addReason(reasons, 'UNRECOGNIZED_STORED_PROVIDER_PAIR', 'MISMATCH');
    }
  }

  if (payment?.status === COMPLETED) {
    if (String(payment?.paymentMethod).toLowerCase() === 'paypal') {
      if (!payment.paypalOrderId) addReason(reasons, 'MISSING_PAYPAL_ORDER_ID', 'REVIEW_REQUIRED');
      if (!payment.captureId) addReason(reasons, 'MISSING_PAYPAL_CAPTURE_ID', 'REVIEW_REQUIRED');
    } else if (String(payment?.paymentMethod).toLowerCase() === 'paymob') {
      if (!payment.paymobOrderId) addReason(reasons, 'MISSING_PAYMOB_ORDER_ID', 'REVIEW_REQUIRED');
      if (!payment.paymobTransactionId) addReason(reasons, 'MISSING_PAYMOB_TRANSACTION_ID', 'REVIEW_REQUIRED');
    } else {
      addReason(reasons, 'UNKNOWN_PAYMENT_METHOD', 'REVIEW_REQUIRED');
    }
  }

  if (!knownPaymentStatuses.has(payment?.status)) addReason(reasons, 'UNKNOWN_PAYMENT_STATUS', 'REVIEW_REQUIRED');
  if (!knownFulfillmentStatuses.has(payment?.fulfillmentStatus)) addReason(reasons, 'UNKNOWN_FULFILLMENT_STATUS', 'REVIEW_REQUIRED');
  if (payment?.fulfillmentStatus === FULFILLED && payment?.status !== COMPLETED) {
    addReason(reasons, 'FULFILLED_WITHOUT_COMPLETED_PAYMENT', 'MISMATCH');
  } else if (payment?.status === COMPLETED && payment?.fulfillmentStatus !== FULFILLED) {
    addReason(reasons, 'COMPLETED_PAYMENT_FULFILLMENT_INCOMPLETE', 'REVIEW_REQUIRED');
  }

  let completedRefundMinor = 0n;
  let refundEvidenceIncomplete = false;
  let pendingRefund = false;
  for (const refund of refunds) {
    const refundId = refund.id == null ? null : String(refund.id);
    const refundCurrency = canonicalCurrency(refund.providerCurrency);
    const bookCurrency = canonicalCurrency(refund.bookCurrency);
    const requested = refundCurrency ? parseCanonicalDecimal(refund.requestedProviderAmount, refundCurrency) : null;
    const actual = refundCurrency && refund.providerAmount != null
      ? parseCanonicalDecimal(refund.providerAmount, refundCurrency)
      : null;
    const book = bookCurrency ? parseCanonicalDecimal(refund.bookAmount, bookCurrency) : null;

    if (!refundCurrency || !requested) addReason(reasons, 'INVALID_REFUND_REQUEST_EVIDENCE', 'MISMATCH', refundId);
    if (!bookCurrency || !book) addReason(reasons, 'INVALID_REFUND_BOOK_EVIDENCE', 'MISMATCH', refundId);
    if (providerCurrency && refundCurrency && refundCurrency !== providerCurrency) {
      addReason(reasons, 'REFUND_PROVIDER_CURRENCY_MISMATCH', 'MISMATCH', refundId);
    }
    if (paymentCurrency && bookCurrency && bookCurrency !== paymentCurrency) {
      addReason(reasons, 'REFUND_BOOK_CURRENCY_MISMATCH', 'MISMATCH', refundId);
    }
    if (storedMode === 'DIRECT' && book && requested && book.minor !== requested.minor) {
      addReason(reasons, 'DIRECT_REFUND_BOOK_PROVIDER_AMOUNT_MISMATCH', 'MISMATCH', refundId);
    }
    if (!knownRefundStatuses.has(refund.status)) {
      addReason(reasons, 'UNKNOWN_REFUND_STATUS', 'REVIEW_REQUIRED', refundId);
      refundEvidenceIncomplete = true;
    }
    if (['pending', 'processing'].includes(refund.status)) {
      addReason(reasons, 'REFUND_IN_PROGRESS', 'REVIEW_REQUIRED', refundId);
      pendingRefund = true;
    }
    if (refund.status === 'review_required') {
      addReason(reasons, 'REFUND_MARKED_REVIEW_REQUIRED', 'REVIEW_REQUIRED', refundId);
      refundEvidenceIncomplete = true;
    }
    if (refund.status === 'failed') {
      if (!refund.failedAt || refund.providerAmount != null) {
        addReason(reasons, 'FAILED_REFUND_EVIDENCE_INCOMPLETE', 'REVIEW_REQUIRED', refundId);
        refundEvidenceIncomplete = true;
      }
    }
    if (refund.status === COMPLETED) {
      if (!actual) {
        addReason(reasons, 'COMPLETED_REFUND_MISSING_PROVIDER_AMOUNT', 'REVIEW_REQUIRED', refundId);
        refundEvidenceIncomplete = true;
      } else {
        completedRefundMinor += actual.minor;
        if (requested && actual.minor !== requested.minor) {
          addReason(reasons, 'COMPLETED_REFUND_AMOUNT_MISMATCH', 'MISMATCH', refundId);
        }
      }
      if (!refund.providerRefundId) {
        addReason(reasons, 'COMPLETED_REFUND_MISSING_PROVIDER_ID', 'REVIEW_REQUIRED', refundId);
        refundEvidenceIncomplete = true;
      }
      if (!refund.completedAt) {
        addReason(reasons, 'COMPLETED_REFUND_MISSING_TIMESTAMP', 'REVIEW_REQUIRED', refundId);
        refundEvidenceIncomplete = true;
      }
    }
    if (refund.providerRefundId && duplicateEvidence.providerRefundIds?.has(refund.providerRefundId)) {
      addReason(reasons, 'DUPLICATE_PROVIDER_REFUND_ID', 'MISMATCH', refundId);
    }
    if (refund.idempotencyKey && duplicateEvidence.idempotencyKeys?.has(refund.idempotencyKey)) {
      addReason(reasons, 'DUPLICATE_REFUND_IDEMPOTENCY_KEY', 'MISMATCH', refundId);
    }
  }

  if (providerAmount && completedRefundMinor > providerAmount.minor) {
    addReason(reasons, 'CUMULATIVE_REFUNDS_EXCEED_PROVIDER_AMOUNT', 'MISMATCH');
  }

  const remainingMinor = providerAmount && completedRefundMinor <= providerAmount.minor
    ? providerAmount.minor - completedRefundMinor
    : null;
  const hasRefundMismatch = reasons.some((reason) => reason.severity === 'MISMATCH' && reason.code.includes('REFUND'));
  let refundState = REFUND_STATES.NONE;
  if (hasRefundMismatch || refundEvidenceIncomplete) refundState = REFUND_STATES.REVIEW_REQUIRED;
  else if (pendingRefund) refundState = REFUND_STATES.PENDING;
  else if (providerAmount && completedRefundMinor === providerAmount.minor && completedRefundMinor > 0n) refundState = REFUND_STATES.FULL;
  else if (completedRefundMinor > 0n) refundState = REFUND_STATES.PARTIAL;

  const subscriptionReconciliation = reconcileSubscriptionRefund(payment, context);
  const financialState = reasons.some((reason) => reason.severity === 'MISMATCH')
    ? RECONCILIATION_STATES.MISMATCH
    : reasons.length > 0
      ? RECONCILIATION_STATES.REVIEW_REQUIRED
      : RECONCILIATION_STATES.MATCHED;
  const state = financialState === RECONCILIATION_STATES.MISMATCH
    || subscriptionReconciliation?.state === RECONCILIATION_STATES.MISMATCH
    ? RECONCILIATION_STATES.MISMATCH
    : financialState === RECONCILIATION_STATES.REVIEW_REQUIRED
      || subscriptionReconciliation?.state === RECONCILIATION_STATES.REVIEW_REQUIRED
      ? RECONCILIATION_STATES.REVIEW_REQUIRED
      : RECONCILIATION_STATES.MATCHED;

  return {
    state,
    reasons,
    acquisition: {
      mode: storedMode,
      amount: paymentAmount?.canonical || null,
      currency: paymentCurrency,
      providerAmount: providerAmount?.canonical || null,
      providerCurrency,
      status: payment?.status || null,
      fulfillmentStatus: payment?.fulfillmentStatus || null,
    },
    refundSummary: {
      providerOriginalAmount: providerAmount?.canonical || null,
      providerCurrency,
      completedRefundAmount: providerCurrency ? fromMinorUnits(completedRefundMinor, providerCurrency) : null,
      remainingRefundableAmount: remainingMinor == null || !providerCurrency
        ? null
        : fromMinorUnits(remainingMinor, providerCurrency),
      refundState,
      refundCount: refunds.length,
    },
    subscriptionReconciliation,
  };
};

export default reconcilePayment;
