import axios from 'axios';
import prisma from '../lib/prisma.js';
import { formatMoneyDecimal, toMinorUnits } from '../utils/money.js';
import { normalizeCurrencyCode } from '../utils/currencyMetadata.js';
import { reconcilePayment } from './paymentReconciliationService.js';

const SANDBOX_BASE_URL = 'https://api-m.sandbox.paypal.com';
const FINAL_PROVIDER_STATUSES = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);
const KNOWN_PROVIDER_STATUSES = new Set([...FINAL_PROVIDER_STATUSES, 'PENDING']);
const ACTIVE_LOCAL_STATUSES = new Set(['pending', 'processing', 'review_required']);

export class RefundPolicyError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'RefundPolicyError';
    this.status = status;
    this.code = code;
  }
}

const assertSandboxMode = () => {
  if (String(process.env.PAYPAL_MODE || 'sandbox').trim().toLowerCase() === 'production') {
    throw new RefundPolicyError(503, 'LIVE_PAYPAL_REFUNDS_DISABLED', 'Live PayPal refunds are not enabled');
  }
};

const canonicalCurrency = (value) => {
  const currency = normalizeCurrencyCode(value);
  if (!currency || !/^[A-Z]{3}$/.test(currency)) {
    throw new RefundPolicyError(422, 'INVALID_PROVIDER_CURRENCY', 'Payment provider currency evidence is invalid');
  }
  return currency;
};

const canonicalProviderAmount = (value, currency) => {
  if (typeof value !== 'string') {
    throw new RefundPolicyError(422, 'INVALID_PROVIDER_AMOUNT', 'Payment provider amount evidence is invalid');
  }
  try {
    const canonical = formatMoneyDecimal(value, currency);
    if (canonical !== value || BigInt(toMinorUnits(value, currency)) <= 0n) throw new Error('non-canonical');
    return canonical;
  } catch {
    throw new RefundPolicyError(422, 'INVALID_PROVIDER_AMOUNT', 'Payment provider amount evidence is invalid');
  }
};

const canonicalBookAmount = (payment) => {
  try {
    const amount = formatMoneyDecimal(payment.amount, payment.currency);
    if (BigInt(toMinorUnits(amount, payment.currency)) <= 0n) throw new Error('non-positive');
    return amount;
  } catch {
    throw new RefundPolicyError(422, 'INVALID_BOOK_AMOUNT', 'Payment book amount evidence is invalid');
  }
};

const getAccessToken = async (http) => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    throw new RefundPolicyError(503, 'PAYPAL_SANDBOX_NOT_CONFIGURED', 'PayPal Sandbox credentials are not configured');
  }
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const response = await http.post(
    `${SANDBOX_BASE_URL}/v1/oauth2/token`,
    'grant_type=client_credentials',
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${auth}` } },
  );
  if (!response?.data?.access_token) throw new Error('PayPal Sandbox token response was incomplete');
  return response.data.access_token;
};

const safeMetadata = (refund, patch = {}) => ({
  ...(refund?.metadata && typeof refund.metadata === 'object' ? refund.metadata : {}),
  ...patch,
});

const responseDto = (refund, reconciliation = null) => ({
  refundId: refund.id,
  status: refund.status,
  bookAmount: refund.bookAmount,
  bookCurrency: refund.bookCurrency,
  providerAmount: refund.providerAmount,
  providerCurrency: refund.providerCurrency,
  providerRefundId: refund.providerRefundId,
  createdAt: refund.createdAt,
  completedAt: refund.completedAt,
  reconciliationState: reconciliation?.state || null,
});

const verifyProviderRefund = (data, expectedAmount, expectedCurrency) => {
  const status = String(data?.status || '').toUpperCase();
  if (!data?.id || !KNOWN_PROVIDER_STATUSES.has(status)) {
    throw new RefundPolicyError(502, 'INVALID_PAYPAL_REFUND_RESPONSE', 'PayPal refund evidence was incomplete');
  }
  const actualCurrency = normalizeCurrencyCode(data?.amount?.currency_code);
  let actualAmount = null;
  try {
    actualAmount = formatMoneyDecimal(data?.amount?.value, expectedCurrency);
  } catch {
    // Handled as an evidence mismatch below.
  }
  if (actualAmount !== expectedAmount || actualCurrency !== expectedCurrency) {
    throw new RefundPolicyError(409, 'PAYPAL_REFUND_EVIDENCE_MISMATCH', 'PayPal refund amount or currency did not match expected evidence');
  }
  return { id: String(data.id), status, amount: actualAmount, currency: actualCurrency };
};

const persistProviderResult = async (db, refund, data) => {
  const expectedAmount = refund.requestedProviderAmount;
  const expectedCurrency = refund.providerCurrency;
  let verified;
  try {
    verified = verifyProviderRefund(data, expectedAmount, expectedCurrency);
  } catch (error) {
    await db.paymentRefund.update({
      where: { id: refund.id },
      data: {
        status: 'review_required',
        metadata: safeMetadata(refund, {
          paypalRequestId: refund.idempotencyKey,
          evidenceMismatch: true,
          providerStatus: data?.status || null,
          providerCreateTime: data?.create_time || null,
          providerUpdateTime: data?.update_time || null,
        }),
      },
    });
    throw error;
  }

  const duplicate = await db.paymentRefund.findFirst({
    where: { providerRefundId: verified.id, id: { not: refund.id } },
    select: { id: true },
  });
  if (duplicate) {
    await db.paymentRefund.update({
      where: { id: refund.id },
      data: { status: 'review_required', metadata: safeMetadata(refund, { duplicateProviderRefundId: true }) },
    });
    throw new RefundPolicyError(409, 'DUPLICATE_PROVIDER_REFUND_ID', 'PayPal refund evidence conflicts with another refund');
  }

  const localStatus = verified.status === 'COMPLETED'
    ? 'completed'
    : verified.status === 'PENDING' ? 'processing' : 'failed';
  const now = new Date();
  return db.paymentRefund.update({
    where: { id: refund.id },
    data: {
      providerRefundId: verified.id,
      providerAmount: verified.amount,
      providerCurrency: verified.currency,
      status: localStatus,
      completedAt: verified.status === 'COMPLETED' ? now : null,
      failedAt: ['FAILED', 'CANCELLED'].includes(verified.status) ? now : null,
      metadata: safeMetadata(refund, {
        paypalRequestId: refund.idempotencyKey,
        providerStatus: verified.status,
        providerCreateTime: data?.create_time || null,
        providerUpdateTime: data?.update_time || null,
      }),
    },
  });
};

export const lookupPayPalRefund = async (refund, { http = axios, db = prisma } = {}) => {
  assertSandboxMode();
  if (!refund?.providerRefundId) throw new RefundPolicyError(422, 'MISSING_PROVIDER_REFUND_ID', 'Refund has no PayPal refund ID');
  const token = await getAccessToken(http);
  const response = await http.get(`${SANDBOX_BASE_URL}/v2/payments/refunds/${encodeURIComponent(refund.providerRefundId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return persistProviderResult(db, refund, response.data);
};

const loadPayment = (db, paymentId) => db.payment.findUnique({
  where: { id: paymentId },
  include: { Refunds: { orderBy: { createdAt: 'desc' } }, SubscriptionGrant: true },
});

const createOrReuseRefund = async (db, payment, reason, adminId) => {
  const existing = payment.Refunds.find((refund) => String(refund.type).toUpperCase() === 'FULL');
  if (existing) return existing;

  const idempotencyKey = `paypal-full-refund:${payment.id}`;
  try {
    return await db.paymentRefund.create({
      data: {
        paymentId: payment.id,
        type: 'FULL',
        bookAmount: canonicalBookAmount(payment),
        bookCurrency: canonicalCurrency(payment.currency),
        requestedProviderAmount: canonicalProviderAmount(payment.providerAmount, canonicalCurrency(payment.providerCurrency)),
        providerCurrency: canonicalCurrency(payment.providerCurrency),
        status: 'pending',
        reason,
        requestedBy: adminId,
        requestedByRole: 'ADMIN',
        idempotencyKey,
        metadata: { paypalRequestId: idempotencyKey, environment: 'sandbox' },
      },
    });
  } catch (error) {
    if (error?.code !== 'P2002') throw error;
    const raced = await db.paymentRefund.findUnique({ where: { idempotencyKey } });
    if (!raced) throw error;
    return raced;
  }
};

export const executeSandboxFullPayPalRefund = async ({ paymentId, reason, adminId }, { http = axios, db = prisma } = {}) => {
  // This must remain the first operation: production performs no DB write/read and no OAuth call.
  assertSandboxMode();
  if (!/^[0-9a-fA-F]{24}$/.test(String(paymentId || ''))) {
    throw new RefundPolicyError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');
  }
  const cleanReason = typeof reason === 'string' ? reason.trim() : '';
  if (!cleanReason || cleanReason.length > 500) {
    throw new RefundPolicyError(422, 'INVALID_REFUND_REASON', 'A refund reason between 1 and 500 characters is required');
  }

  const payment = await loadPayment(db, paymentId);
  if (!payment) throw new RefundPolicyError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');
  if (payment.status !== 'completed' || String(payment.paymentMethod).toLowerCase() !== 'paypal') {
    throw new RefundPolicyError(422, 'PAYMENT_NOT_REFUNDABLE', 'Payment is not eligible for a PayPal refund');
  }
  if (!payment.captureId) throw new RefundPolicyError(422, 'MISSING_CAPTURE_ID', 'Payment capture evidence is missing');
  canonicalProviderAmount(payment.providerAmount, canonicalCurrency(payment.providerCurrency));
  canonicalBookAmount(payment);

  // Eligibility concerns acquisition evidence. Existing pending/completed refund
  // rows are evaluated below; their expected REVIEW state must not prevent an
  // idempotent retry or retrieval of an already completed result.
  const acquisitionReconciliation = reconcilePayment({ ...payment, Refunds: [] });
  if (acquisitionReconciliation.state !== 'MATCHED') {
    throw new RefundPolicyError(409, 'PAYMENT_RECONCILIATION_BLOCKED', 'Payment evidence requires reconciliation review before refunding');
  }
  if (payment.Refunds.some((refund) => String(refund.type).toUpperCase() !== 'FULL')) {
    throw new RefundPolicyError(409, 'PARTIAL_REFUND_UNSUPPORTED', 'Partial PayPal refunds are not supported');
  }
  if (payment.Refunds.filter((refund) => String(refund.type).toUpperCase() === 'FULL').length > 1) {
    throw new RefundPolicyError(409, 'DUPLICATE_FULL_REFUND_RECORDS', 'Multiple full refund records require reconciliation review');
  }

  let refund = await createOrReuseRefund(db, payment, cleanReason, adminId);
  if (
    refund.bookAmount !== canonicalBookAmount(payment)
    || refund.bookCurrency !== canonicalCurrency(payment.currency)
    || refund.requestedProviderAmount !== canonicalProviderAmount(payment.providerAmount, canonicalCurrency(payment.providerCurrency))
    || refund.providerCurrency !== canonicalCurrency(payment.providerCurrency)
  ) {
    throw new RefundPolicyError(409, 'REFUND_EXPECTED_EVIDENCE_MISMATCH', 'Existing refund evidence does not match the Payment');
  }
  if (refund.providerAmount != null && refund.providerAmount !== refund.requestedProviderAmount) {
    throw new RefundPolicyError(409, 'REFUND_PROVIDER_EVIDENCE_MISMATCH', 'Existing provider refund evidence requires review');
  }
  if (refund.status === 'completed') {
    if (!refund.providerRefundId || !refund.providerAmount || !refund.completedAt) {
      throw new RefundPolicyError(409, 'COMPLETED_REFUND_EVIDENCE_INCOMPLETE', 'Completed refund evidence requires review');
    }
    return responseDto(refund, reconcilePayment({ ...payment, Refunds: [refund] }));
  }
  if (['failed'].includes(refund.status)) {
    throw new RefundPolicyError(409, 'REFUND_FAILED_REQUIRES_REVIEW', 'The existing refund failed and requires Admin review');
  }
  if (refund.providerRefundId) {
    refund = await lookupPayPalRefund(refund, { http, db });
    return responseDto(refund, reconcilePayment({ ...payment, Refunds: [refund] }));
  }
  if (!ACTIVE_LOCAL_STATUSES.has(refund.status)) {
    throw new RefundPolicyError(409, 'REFUND_STATE_REQUIRES_REVIEW', 'The existing refund state requires Admin review');
  }

  await db.paymentRefund.update({ where: { id: refund.id }, data: { status: 'processing' } });
  const token = await getAccessToken(http);
  try {
    const response = await http.post(
      `${SANDBOX_BASE_URL}/v2/payments/captures/${encodeURIComponent(payment.captureId)}/refund`,
      { amount: { value: refund.requestedProviderAmount, currency_code: refund.providerCurrency } },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': refund.idempotencyKey,
          Prefer: 'return=representation',
        },
      },
    );
    refund = await persistProviderResult(db, refund, response.data);
    return responseDto(refund, reconcilePayment({ ...payment, Refunds: [refund] }));
  } catch (error) {
    if (error instanceof RefundPolicyError) throw error;
    const status = error?.response?.status;
    const definiteRejection = Number.isInteger(status) && status >= 400 && status < 500 && status !== 409;
    await db.paymentRefund.update({
      where: { id: refund.id },
      data: {
        status: definiteRejection ? 'failed' : 'processing',
        failedAt: definiteRejection ? new Date() : null,
        metadata: safeMetadata(refund, {
          paypalRequestId: refund.idempotencyKey,
          outcomeUnknown: !definiteRejection,
          paypalHttpStatus: status || null,
          paypalDebugId: error?.response?.data?.debug_id || null,
        }),
      },
    });
    if (definiteRejection) throw new RefundPolicyError(502, 'PAYPAL_REFUND_REJECTED', 'PayPal rejected the refund request');
    throw new RefundPolicyError(503, 'PAYPAL_REFUND_OUTCOME_UNKNOWN', 'PayPal refund outcome is unknown; retry will reuse the same request ID');
  }
};

export const PAYPAL_REFUND_SANDBOX_BASE_URL = SANDBOX_BASE_URL;
