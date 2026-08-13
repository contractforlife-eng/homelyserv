// backend/src/routes/payment.js
import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService.js';
import { ensureInitialWorkerEarning } from '../services/workerEarningService.js';
import { PREMIUM_DURATION_DAYS, PAYMENT_PURPOSES, getPremiumPriceForRole } from '../config/subscription.js';
import {
  PROVIDER_CAPABILITY_MODES,
  getAvailableProviders,
  getProviderCapability,
} from '../config/providerCapabilities.js';
import {
  formatMoneyDecimal,
  multiplyMoneyByRatio,
  roundMoney,
  toMinorUnits,
} from '../utils/money.js';

const router = express.Router();

const isObjectId = (value) => typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);

const authenticatedUserOwnsPayment = async (req, payment) => {
  const authenticatedUserId = req.userId == null ? '' : String(req.userId);
  if (!authenticatedUserId || !payment) return false;

  if (payment.purpose === PAYMENT_PURPOSES.SUBSCRIPTION) {
    return payment.userId != null && String(payment.userId) === authenticatedUserId;
  }

  // Commission authority follows the Hire rather than client-supplied
  // Payment identity fields. Legacy commission Payments without a Hire fall
  // back only to their server-recorded userId.
  if (String(req.userRole || '').toUpperCase() !== 'EMPLOYER') return false;
  if (payment.hireId) {
    const hire = await prisma.hire.findUnique({
      where: { id: String(payment.hireId) },
      select: { employerId: true },
    });
    return hire?.employerId != null && String(hire.employerId) === authenticatedUserId;
  }
  return payment.userId != null && String(payment.userId) === authenticatedUserId;
};

const rejectPaymentAccess = (res) => res.status(404).json({
  success: false,
  error: 'Payment not found',
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================
const generateId = () => {
  return 'TXN-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
};

const generateOrderId = () => {
  return 'ORD-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
};

// ============================================================
// ENVIRONMENT-AWARE CLIENT URL RESOLUTION
// ============================================================
// Resolves the frontend base URL for PayPal return/cancel redirects.
// - Production NEVER falls back to localhost, even if CLIENT_URL is misconfigured.
// - Development uses localhost by default.
const getClientUrl = () => {
  const envClientUrl = process.env.CLIENT_URL;

  // If explicitly configured and not localhost, use it (strip trailing slash)
  if (envClientUrl && !envClientUrl.includes('localhost')) {
    return envClientUrl.replace(/\/+$/, '');
  }

  // In production, never redirect to localhost
  if (process.env.NODE_ENV === 'production') {
    return 'https://homelyserv.com';
  }

  // Development default
  return 'http://localhost:5173';
};

// ============================================================
// PAYMOB INTEGRATION
// ============================================================

const getPaymobAuthToken = async () => {
  try {
    const response = await axios.post('https://accept.paymob.com/api/auth/tokens', {
      api_key: process.env.PAYMOB_API_KEY
    });

    if (response.data && response.data.token) {
      console.log('✅ Paymob auth token obtained');
      return response.data.token;
    } else {
      throw new Error('Failed to get Paymob token');
    }
  } catch (error) {
    console.error('❌ Paymob auth error:', error.response?.data || error.message);
    throw new Error('Paymob authentication failed');
  }
};

const createPaymobOrder = async (authToken, providerAmount, orderId, customerData) => {
  try {
    const response = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: toMinorUnits(providerAmount, 'EGP'),
      currency: 'EGP',
      merchant_order_id: orderId,
      items: [
        {
          name: customerData?.jobTitle || 'Service Payment',
          amount_cents: toMinorUnits(providerAmount, 'EGP'),
          description: customerData?.description || 'Payment for service',
          quantity: 1
        }
      ],
      shipping_data: {
        first_name: customerData?.firstName || 'Customer',
        last_name: customerData?.lastName || 'User',
        email: customerData?.email || 'customer@example.com',
        phone_number: customerData?.phone || '+201234567890'
      }
    });

    if (response.data && response.data.id) {
      console.log('✅ Paymob order created:', response.data.id);
      return response.data;
    } else {
      throw new Error('Failed to create Paymob order');
    }
  } catch (error) {
    console.error('❌ Paymob order error:', error.response?.data || error.message);
    throw new Error('Paymob order creation failed');
  }
};

const getPaymobPaymentKey = async (authToken, orderId, providerAmount, customerData) => {
  try {
    const integrationId = process.env.PAYMOB_INTEGRATION_ID;
    const response = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
      auth_token: authToken,
      amount_cents: toMinorUnits(providerAmount, 'EGP'),
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        first_name: customerData?.firstName || 'Customer',
        last_name: customerData?.lastName || 'User',
        email: customerData?.email || 'customer@example.com',
        phone_number: customerData?.phone || '+201234567890',
        apartment: 'NA',
        floor: 'NA',
        street: 'NA',
        building: 'NA',
        shipping_method: 'NA',
        postal_code: 'NA',
        city: customerData?.city || 'Cairo',
        country: customerData?.country || 'EG'
      },
      currency: 'EGP',
      integration_id: integrationId,
      lock_order_when_paid: true
    });

    if (response.data && response.data.token) {
      console.log('✅ Paymob payment key generated');
      return response.data.token;
    } else {
      throw new Error('Failed to get Paymob payment key');
    }
  } catch (error) {
    console.error('❌ Paymob payment key error:', error.response?.data || error.message);
    throw new Error('Paymob payment key generation failed');
  }
};

// ============================================================
// PAYPAL INTEGRATION
// ============================================================

const getPayPalAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
    ).toString('base64');

    const url = process.env.PAYPAL_MODE === 'production'
      ? 'https://api-m.paypal.com/v1/oauth2/token'
      : 'https://api-m.sandbox.paypal.com/v1/oauth2/token';

    const response = await axios.post(
      url,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        }
      }
    );

    if (response.data && response.data.access_token) {
      console.log('✅ PayPal access token obtained');
      return response.data.access_token;
    } else {
      throw new Error('Failed to get PayPal token');
    }
  } catch (error) {
    console.error('❌ PayPal auth error:', error.response?.data || error.message);
    throw new Error('PayPal authentication failed');
  }
};

const LEGACY_PAYPAL_EGP_TO_USD_NUMERATOR = 33;
const LEGACY_PAYPAL_EGP_TO_USD_DENOMINATOR = 1000;
const PAYPAL_PROVIDER_CURRENCY = 'USD';
const PAYMOB_PROVIDER_CURRENCY = 'EGP';

export const getExpectedPayPalCharge = (paymentAmount) => {
  const converted = multiplyMoneyByRatio(
    paymentAmount,
    LEGACY_PAYPAL_EGP_TO_USD_NUMERATOR,
    LEGACY_PAYPAL_EGP_TO_USD_DENOMINATOR,
    PAYPAL_PROVIDER_CURRENCY
  );
  return {
    amount: formatMoneyDecimal(Math.max(converted, 1), PAYPAL_PROVIDER_CURRENCY),
    currency: PAYPAL_PROVIDER_CURRENCY,
  };
};

const getExpectedProviderCharge = (paymentMethod, paymentAmount, paymentCurrency, purpose) => {
  const capability = getProviderCapability({
    provider: paymentMethod,
    purpose,
    transactionCurrency: paymentCurrency,
  });
  if (!capability.enabled) throw new Error('Provider does not support this payment currency');
  if (paymentMethod === 'paypal') {
    if (capability.mode === PROVIDER_CAPABILITY_MODES.LEGACY_CONVERTED) {
      return getExpectedPayPalCharge(paymentAmount);
    }
    return {
      amount: formatMoneyDecimal(paymentAmount, paymentCurrency),
      currency: capability.providerCurrency,
    };
  }
  if (paymentMethod === 'paymob') {
    const currency = String(paymentCurrency || '').trim().toUpperCase();
    if (currency !== PAYMOB_PROVIDER_CURRENCY) {
      throw new Error('Paymob provider currency is not supported');
    }
    return {
      amount: formatMoneyDecimal(paymentAmount, PAYMOB_PROVIDER_CURRENCY),
      currency: PAYMOB_PROVIDER_CURRENCY,
    };
  }
  throw new Error('Unsupported payment method');
};

const isHistoricalPayPalEgpCommissionAttempt = (payment) => (
  payment?.paymentMethod === 'paypal' &&
  payment?.purpose === PAYMENT_PURPOSES.COMMISSION &&
  String(payment?.currency || '').trim().toUpperCase() === 'EGP' &&
  typeof payment?.paypalOrderId === 'string' &&
  payment.paypalOrderId.trim().length > 0
);

export const resolveExpectedProviderEvidence = (payment) => {
  const hasAmount = payment?.providerAmount != null;
  const hasCurrency = payment?.providerCurrency != null;
  if (hasAmount !== hasCurrency) throw new Error('Incomplete persisted provider evidence');

  if (hasAmount) {
    const currency = String(payment.providerCurrency).trim().toUpperCase();
    const capability = getProviderCapability({
      provider: payment.paymentMethod,
      purpose: payment.purpose,
      transactionCurrency: payment.currency,
    });
    // New PayPal EGP commission checkout is no longer supported, but an
    // already-created provider order must retain its verified completion path.
    // This exception validates immutable historical evidence only; creation
    // still fails capability enforcement before a Payment/provider call.
    const allowedCurrency = isHistoricalPayPalEgpCommissionAttempt(payment)
      ? PAYPAL_PROVIDER_CURRENCY
      : capability.enabled ? capability.providerCurrency : null;
    if (!allowedCurrency || currency !== allowedCurrency) {
      throw new Error('Persisted provider currency is incompatible with payment method');
    }
    const amount = formatMoneyDecimal(payment.providerAmount, currency);
    if (amount !== String(payment.providerAmount)) {
      throw new Error('Persisted provider amount is not canonical');
    }
    return { amount, currency, persisted: true };
  }

  const expected = isHistoricalPayPalEgpCommissionAttempt(payment)
    ? getExpectedPayPalCharge(payment.amount)
    : getExpectedProviderCharge(payment.paymentMethod, payment.amount, payment.currency, payment.purpose);
  return { ...expected, persisted: false };
};

const persistVerifiedLegacyProviderEvidence = async (payment, expected) => {
  if (expected.persisted) return;
  const updated = await prisma.payment.updateMany({
    where: { id: payment.id, providerAmount: null, providerCurrency: null },
    data: { providerAmount: expected.amount, providerCurrency: expected.currency },
  });
  if (updated.count === 0) {
    const current = await prisma.payment.findUnique({ where: { id: payment.id } });
    const currentExpected = resolveExpectedProviderEvidence(current);
    if (currentExpected.amount !== expected.amount || currentExpected.currency !== expected.currency) {
      throw new Error('Provider evidence changed during verification');
    }
  }
};

const assertPayPalMoney = (money, expected, label) => {
  if (
    money?.currency_code !== expected.currency ||
    String(money?.value ?? '') !== expected.amount
  ) {
    throw new Error(`${label} amount/currency mismatch`);
  }
};

export const verifyPayPalOrderEvidence = (payment, providerOrder, { requireCapture = false } = {}) => {
  if (!payment?.paypalOrderId || providerOrder?.id !== payment.paypalOrderId) {
    throw new Error('PayPal order identity mismatch');
  }

  const purchaseUnit = providerOrder.purchase_units?.find(
    (unit) => unit.reference_id === payment.orderId
  );
  if (!purchaseUnit) throw new Error('PayPal purchase-unit identity mismatch');

  const expected = resolveExpectedProviderEvidence(payment);
  assertPayPalMoney(purchaseUnit.amount, expected, 'PayPal order');

  if (!requireCapture) return { expected, captureId: null };
  if (providerOrder.status !== 'COMPLETED') throw new Error('PayPal order is not completed');

  const capture = purchaseUnit.payments?.captures?.find((item) => item.status === 'COMPLETED');
  if (!capture?.id) throw new Error('PayPal completed capture evidence is missing');
  assertPayPalMoney(capture.amount, expected, 'PayPal capture');
  return { expected, captureId: capture.id };
};

const createPayPalOrder = async (accessToken, expectedCharge, orderId, customerData) => {
  try {
    const finalAmount = expectedCharge.amount;

    console.log(`💰 Creating PayPal provider charge: ${finalAmount} ${expectedCharge.currency}`);

    const baseUrl = process.env.PAYPAL_MODE === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const clientUrl = getClientUrl();
    const returnUrl = `${clientUrl}/payment-success`;
    const cancelUrl = `${clientUrl}/payment-cancel`;

    console.log(`🔗 Return URL: ${returnUrl}`);
    console.log(`🔗 Cancel URL: ${cancelUrl}`);

    const response = await axios.post(
      `${baseUrl}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: orderId,
            description: customerData?.description || `Payment for ${customerData?.jobTitle || 'service'}`,
            custom_id: customerData?.transactionId || orderId,
            amount: {
              currency_code: expectedCharge.currency,
              value: finalAmount
            }
          }
        ],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          brand_name: 'HomelyServ',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (response.data && response.data.id) {
      console.log('✅ PayPal order created:', response.data.id);
      return response.data;
    } else {
      throw new Error('Failed to create PayPal order');
    }
  } catch (error) {
    console.error('❌ PayPal order error:', error.response?.data || error.message);
    throw new Error('PayPal order creation failed: ' + (error.response?.data?.message || error.message));
  }
};

// ============================================================
// UPDATE HIRE AFTER PAYMENT - Single source of truth
// ============================================================
const updateHireAfterPayment = async (hireId, captureId) => {
  try {
    if (!hireId) {
      console.log('⚠️ No hireId provided, skipping hire update');
      return false;
    }

    console.log(`📝 Updating Hire ${hireId} after payment...`);
    console.log(`   Payment capture ID: ${captureId}`);

    // Find the Hire
    const hire = await prisma.hire.findUnique({
      where: { id: hireId }
    });

    if (!hire) {
      console.log(`⚠️ Hire not found: ${hireId}`);
      return false;
    }

    console.log(`📋 Found Hire: ${hire.id}`);
    console.log(`   Status before: ${hire.status}`);
    console.log(`   Payment status before: ${hire.paymentStatus}`);

    // Idempotency: a hire already marked 'completed' was fulfilled by an
    // earlier callback/capture. A retried fulfillment must NEVER re-run the
    // side effects (duplicate notifications / duplicate ledger entries).
    if (hire.paymentStatus === 'completed') {
      console.log(`⏳ Hire ${hire.id} already fulfilled (paymentStatus='completed') — skipping (idempotent)`);
      return true;
    }

    // Update the hire with payment completion
    const updatedHire = await prisma.hire.update({
      where: { id: hireId },
      data: {
        paymentStatus: 'completed',
        paymentReference: captureId || ('CAPTURED_' + Date.now()),
        status: 'active'
      }
    });

    console.log(`✅ Hire updated successfully`);
    console.log(`   Hire ID: ${updatedHire.id}`);
    console.log(`   Status after: ${updatedHire.status}`);
    console.log(`   Payment status after: ${updatedHire.paymentStatus}`);
    console.log(`   Payment reference: ${updatedHire.paymentReference}`);

    // Worker Earnings Ledger — Phase 1.
    // Create one PENDING contractual ledger record for this hire if none
    // exists (idempotent). PENDING means "contractual monthly amount for an
    // active hire" — it never implies the worker was paid.
    try {
      const earning = await ensureInitialWorkerEarning(hire);
      if (earning) {
        console.log(`✅ Worker earning ledger entry ensured for hire ${hire.id}: ${earning.id}`);
      }
    } catch (earningError) {
      // Ledger failures must never break the payment/hire completion flow.
      console.error(`⚠️ Could not ensure worker earning for hire ${hire.id}:`, earningError.message);
    }

    // Update the Offer to mark payment as confirmed and verified
    if (hire.offerId) {
      const updatedOffer = await prisma.offer.update({
        where: { id: hire.offerId },
        data: {
          paymentConfirmed: true,
          paymentVerified: true
        }
      });

      console.log(`✅ Offer ${hire.offerId} updated: paymentConfirmed=true, paymentVerified=true`);
    }

    // Notify both parties that the payment completed.
    // NotificationService never throws, so payment processing is unaffected.
    if (hire.employerId) {
      await createNotification(String(hire.employerId), {
        type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
        title: 'Payment Successful',
        message: `Your payment of ${updatedHire.totalDue ?? ''} ${updatedHire.compensationCurrency || 'EGP'} was completed successfully. Reference: ${updatedHire.paymentReference || captureId || 'N/A'}`,
        entityType: 'PAYMENT',
        entityId: String(hire.id),
        link: '/employer-payments',
      });
    }

    try {
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { id: String(hire.workerId) },
        select: { userId: true }
      });
      if (workerProfile?.userId) {
        await createNotification(String(workerProfile.userId), {
          type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
          title: 'Payment Confirmed',
          message: 'The employer completed the payment for your hire. The hire is now active.',
          entityType: 'HIRE',
          entityId: String(hire.id),
          link: '/my-hires',
        });
      }
    } catch (workerLookupError) {
      console.error('⚠️ Could not resolve worker for payment notification:', workerLookupError.message);
    }

    return true;

  } catch (error) {
    console.error('❌ Error updating hire after payment:', error);
    return false;
  }
};

// ============================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================

const ensureSubscription = async (userId, amount) => {
  if (!userId) {
    throw new Error('Cannot activate subscription: userId is required');
  }

  const now = new Date();
  const durationMs = PREMIUM_DURATION_DAYS * 24 * 60 * 60 * 1000;

  const existing = await prisma.subscription.findFirst({
    where: {
      userId: String(userId),
      status: 'active',
      endDate: { gte: now }
    },
    orderBy: { endDate: 'desc' }
  });

  if (existing) {
    // RENEWAL: extend from the CURRENT expiry, never from "now". One claimed
    // payment transaction extends the subscription EXACTLY once (it reaches
    // this code only after an atomic fulfillment claim), so a user who renews
    // early keeps the full value of their remaining days.
    const extendedEndDate = new Date(new Date(existing.endDate).getTime() + durationMs);

    const updated = await prisma.subscription.update({
      where: { id: existing.id },
      data: { endDate: extendedEndDate, amount: Number(amount) }
    });

    await createNotification(String(userId), {
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Premium Subscription Renewed',
      message: `Your premium subscription has been extended until ${updated.endDate.toLocaleDateString()}.`,
      entityType: 'SUBSCRIPTION',
      entityId: String(updated.id),
      icon: '👑',
      link: '/subscription',
    });

    return updated;
  }

  // First activation (or restart after expiry): counted from today.
  const startDate = now;
  const endDate = new Date(startDate.getTime() + durationMs);

  const created = await prisma.subscription.create({
    data: {
      userId: String(userId),
      plan: 'premium',
      amount: Number(amount),
      status: 'active',
      startDate,
      endDate
    }
  });

  await createNotification(String(userId), {
    type: NOTIFICATION_TYPES.SYSTEM,
    title: 'Premium Subscription Activated',
    message: `Your premium subscription is now active until ${created.endDate.toLocaleDateString()}. Enjoy unlimited access!`,
    entityType: 'SUBSCRIPTION',
    entityId: String(created.id),
    icon: '👑',
    link: '/subscription',
  });

  return created;
};

// ============================================================
// PAYMENT COMPLETION — route side effects by explicit PURPOSE
// ============================================================
// DESIGN (retry-safe fulfillment, no reliance on status alone):
//   status='completed'  means "money captured".                       ❌ NOT a guarantee
//   fulfillmentStatus   means "entitlement granted".                  ✅ the real truth
//
// Lifecycle: pending -> (claimed) processing -> fulfilled | failed
//   - A completed-but-failed/pending fulfillment IS retried safely by the
//     next callback/capture (it re-claims, never re-runs in parallel).
//   - Duplicate callbacks cannot double-grant: only one concurrent claim wins
//     the atomic updateMany; the loser sees fulfillmentStatus already
//     processing/fulfilled and returns without side effects.
//   - Side-effect failure leaves fulfillmentStatus='failed' so retry re-attempts.
//
// PURPOSE routing (explicit discriminator — never inferred from amount):
//   SUBSCRIPTION -> activate/extend Premium ONLY (no hire behavior)
//   COMMISSION   -> update the associated Hire ONLY (never grants Premium)
const FULFILLMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  FULFILLED: 'fulfilled',
  FAILED: 'failed'
};

const FULFILLMENT_STALE_MS = 10 * 60 * 1000; // reclaim a stuck 'processing' claim after 10 min
const MAX_FULFILLMENT_ATTEMPTS = 5;          // eventually disables endless retry loops

/**
 * Atomically claim the exclusive right to run fulfillment for one Payment.
 * Also marks the payment 'completed' (money captured) exactly once.
 * Returns { granted:true } for the single winner; everything else returns a
 * reason ('fulfilled' | 'in-flight' | 'exhausted' | 'unknown') so callers can
 * acknowledge duplicates without running side effects.
 */
const claimFulfillment = async (paymentId, captureRef) => {
  const now = new Date();

  // 1) Record that money was captured — safe to do independently of fulfillment.
  await prisma.payment.updateMany({
    where: {
      id: paymentId,
      NOT: { status: 'completed' }
    },
    data: {
      status: 'completed',
      completedAt: now,
      captureId: captureRef || null
    }
  });

  // 2) Try to claim the fulfillment slot.
  const claimed = await prisma.payment.updateMany({
    where: {
      id: paymentId,
      fulfillmentStatus: { in: [FULFILLMENT_STATUS.PENDING, FULFILLMENT_STATUS.FAILED] },
      fulfillmentAttempts: { lt: MAX_FULFILLMENT_ATTEMPTS }
    },
    data: {
      fulfillmentStatus: FULFILLMENT_STATUS.PROCESSING,
      fulfillmentAttempts: { increment: 1 },
      fulfillmentError: null,
      fulfillmentStartedAt: now
    }
  });
  if (claimed.count > 0) {
    return { granted: true };
  }

  // 3) Not claimable by the query above — decide why.
  const current = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      fulfillmentStatus: true,
      fulfillmentStartedAt: true,
      fulfillmentAttempts: true
    }
  });

  if (current?.fulfillmentStatus === FULFILLMENT_STATUS.FULFILLED) {
    return { granted: false, reason: 'fulfilled' };
  }
  if (current?.fulfillmentAttempts >= MAX_FULFILLMENT_ATTEMPTS) {
    return { granted: false, reason: 'exhausted' };
  }

  // A 'processing' claim that never finished is stale — reclaim it.
  if (current?.fulfillmentStatus === FULFILLMENT_STATUS.PROCESSING) {
    const startedAt = current.fulfillmentStartedAt ? new Date(current.fulfillmentStartedAt).getTime() : 0;
    if (startedAt && (now.getTime() - startedAt) > FULFILLMENT_STALE_MS) {
      const reclaimed = await prisma.payment.updateMany({
        where: {
          id: paymentId,
          fulfillmentStatus: FULFILLMENT_STATUS.PROCESSING,
          fulfillmentAttempts: { lt: MAX_FULFILLMENT_ATTEMPTS },
          fulfillmentStartedAt: { lte: new Date(now.getTime() - FULFILLMENT_STALE_MS) }
        },
        data: {
          fulfillmentAttempts: { increment: 1 },
          fulfillmentStartedAt: now
        }
      });
      if (reclaimed.count > 0) {
        return { granted: true };
      }
    }
    return { granted: false, reason: 'in-flight' };
  }

  return { granted: false, reason: current?.fulfillmentStatus || 'unknown' };
};

const completePaymentTransaction = async (payment, captureRef) => {
  if (!payment) return { fulfilled: false, error: 'No payment' };

  const claim = await claimFulfillment(payment.id, captureRef);
  if (!claim.granted) {
    console.log(`⚠️ Payment ${payment.transactionId} fulfillment not granted: ${claim.reason} — duplicate/retry handled idempotently`);
    return { fulfilled: claim.reason === 'fulfilled', error: null };
  }

  try {
    if (payment.purpose === PAYMENT_PURPOSES.SUBSCRIPTION) {
      console.log(`👑 SUBSCRIPTION payment ${payment.transactionId} completed — activating Premium ONLY`);
      await ensureSubscription(payment.userId, payment.amount);
    } else {
      // COMMISSION (default for hire-linked payments) — never grants Premium.
      console.log(`💳 COMMISSION payment ${payment.transactionId} completed — hire update only, NO premium granted`);
      if (!payment.hireId) {
        throw new Error('COMMISSION payment completed without hireId — nothing to fulfill');
      }
      const hireOk = await updateHireAfterPayment(payment.hireId, captureRef);
      if (!hireOk) {
        throw new Error('updateHireAfterPayment did not complete successfully');
      }
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        fulfillmentStatus: FULFILLMENT_STATUS.FULFILLED,
        fulfillmentError: null,
        fulfillmentCompletedAt: new Date()
      }
    });
    console.log(`✅ Payment ${payment.transactionId} fulfilled (${payment.purpose})`);
    return { fulfilled: true, error: null };

  } catch (error) {
    // Side-effect failure: keep `status='completed'` but record failure so a
    // retried callback/capture reclaims and re-attempts fulfillment.
    console.error(`❌ Fulfillment failed for payment ${payment.transactionId}:`, error.message);
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        fulfillmentStatus: FULFILLMENT_STATUS.FAILED,
        fulfillmentError: error.message || String(error)
      }
    });
    return { fulfilled: false, error: error.message || String(error) };
  }
};

// ============================================================
// ROUTES
// ============================================================

router.get('/providers', authenticate, async (req, res) => {
  try {
    const purpose = typeof req.query.purpose === 'string'
      ? req.query.purpose.trim().toUpperCase()
      : '';
    if (purpose !== PAYMENT_PURPOSES.COMMISSION) {
      return res.status(400).json({ success: false, error: 'Unsupported capability purpose' });
    }
    if (!req.query.hireId) {
      return res.status(400).json({ success: false, error: 'hireId is required' });
    }

    const hire = await prisma.hire.findUnique({
      where: { id: String(req.query.hireId) },
      select: { employerId: true, compensationCurrency: true },
    });
    if (!hire) return res.status(404).json({ success: false, error: 'Hire not found' });
    if (!req.userId || String(hire.employerId) !== String(req.userId)) {
      return res.status(403).json({ success: false, error: 'You are not authorized for this hire' });
    }

    const currency = hire.compensationCurrency
      ? String(hire.compensationCurrency).trim().toUpperCase()
      : 'EGP';
    const providers = getAvailableProviders({ purpose, transactionCurrency: currency })
      .map(({ provider, mode, providerCurrency }) => ({ provider, mode, providerCurrency }));
    return res.json({ success: true, purpose, currency, providers });
  } catch (error) {
    console.error('Provider capability lookup failed:', error.message);
    return res.status(500).json({ success: false, error: 'Unable to load payment providers' });
  }
});

/**
 * Create Payment Intent
 * POST /api/payments/create-payment-intent
 */
router.post('/create-payment-intent', authenticate, async (req, res) => {
  try {
    const {
      paymentMethod,
      userEmail,
      workerName,
      workerId,
      jobTitle,
      employerId,
      employerName,
      hireId,
      phone,
      offerId,
      purpose: requestedPurpose
    } = req.body;

    // Amount is NEVER taken from the client as authority. It is re-derived
    // server-side below (SUBSCRIPTION -> role pricing, COMMISSION -> hire
    // total), so it starts undefined and is assigned before any use.
    let amount;

    // ============================================================
    // EXPLICIT PAYMENT PURPOSE — explicit discriminator, never inferred
    // from the amount. Defaults to COMMISSION so all existing hire/
    // commission flows behave identically unless they opt into SUBSCRIPTION.
    // ============================================================
    const purpose = requestedPurpose === PAYMENT_PURPOSES.SUBSCRIPTION
      ? PAYMENT_PURPOSES.SUBSCRIPTION
      : PAYMENT_PURPOSES.COMMISSION;
    const selectedPaymentMethod = paymentMethod || 'paymob';
    if (!['paymob', 'paypal'].includes(selectedPaymentMethod)) {
      return res.status(400).json({ success: false, error: 'Unsupported payment method' });
    }
    let transactionCurrency = 'EGP';

    if (purpose === PAYMENT_PURPOSES.SUBSCRIPTION) {
      // SERVER-SIDE PRICE AUTHORITY: never trust the client-supplied amount
      // for a subscription. Price is derived from the authenticated user's
      // role (verified against the DB when possible).
      let role = req.userRole;
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: String(req.userId) },
          select: { role: true }
        });
        if (dbUser?.role) role = dbUser.role;
      } catch (roleErr) {
        console.warn('⚠️ Could not resolve role for subscription pricing:', roleErr.message);
      }

      amount = getPremiumPriceForRole(role);

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount'
        });
      }
    } else {
      // COMMISSION: hire context is required.
      if (!hireId) {
        return res.status(400).json({
          success: false,
          error: 'hireId is required for commission payments'
        });
      }

      // Commission amount + ownership are SERVER-AUTHORITATIVE from the Hire
      // record (the 15% commission is derived at hire creation and stored on
      // the hire). The client-supplied amount is ignored — it can neither
      // inflate nor deflate what actually gets charged.
      const commissionHire = await prisma.hire.findUnique({
        where: { id: String(hireId) },
        select: { id: true, totalDue: true, employerId: true, compensationCurrency: true }
      });
      if (!commissionHire) {
        return res.status(400).json({
          success: false,
          error: 'Hire not found for commission payment'
        });
      }

      // Only the authenticated employer who owns the Hire may charge for it.
      if (!req.userId || String(commissionHire.employerId) !== String(req.userId)) {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to pay for this hire'
        });
      }

      transactionCurrency = commissionHire.compensationCurrency
        ? String(commissionHire.compensationCurrency).trim().toUpperCase()
        : 'EGP';
      const capability = getProviderCapability({
        provider: selectedPaymentMethod,
        purpose,
        transactionCurrency,
      });
      if (!capability.enabled) {
        return res.status(422).json({
          success: false,
          error: 'Commission payment is not currently available for this provider and currency'
        });
      }

      // COMMISSION AMOUNT AUTHORITY: charge exactly the hire's server-derived
      // total; the client amount is ignored.
      amount = Number(commissionHire.totalDue);

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount'
        });
      }
    }

    amount = roundMoney(amount, transactionCurrency);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid canonical payment amount' });
    }

    const providerEvidence = getExpectedProviderCharge(
      selectedPaymentMethod,
      amount,
      transactionCurrency,
      purpose
    );

    console.log('📤 Creating payment intent:', {
      amount,
      purpose,
          paymentMethod: selectedPaymentMethod,
      userEmail,
      jobTitle,
      hireId,
      offerId
    });

    const orderId = generateOrderId();
    const transactionId = generateId();

    const customerData = {
      firstName: employerName?.split(' ')[0] || 'Employer',
      lastName: employerName?.split(' ').slice(1).join(' ') || 'User',
      email: userEmail || 'employer@example.com',
      phone: phone || '+201234567890',
      userId: req.userId,
      workerId,
      workerName,
      jobTitle,
      employerId,
      employerName,
      hireId,
      offerId,
      transactionId,
      description: `Payment for ${jobTitle || 'service'} - ${workerName || 'worker'}`
    };

    let payment;

    if (purpose === PAYMENT_PURPOSES.COMMISSION) {
      // Reuse a pending payment for the same hire across retries.
      let existingPayment = await prisma.payment.findFirst({
        where: {
          hireId: String(hireId),
          paymentMethod: selectedPaymentMethod,
          currency: transactionCurrency,
          purpose: PAYMENT_PURPOSES.COMMISSION,
          status: {
            in: ['pending', 'processing']
          }
        }
      });

      if (existingPayment?.providerAmount != null || existingPayment?.providerCurrency != null) {
        const existingEvidence = resolveExpectedProviderEvidence(existingPayment);
        if (
          existingEvidence.amount !== providerEvidence.amount ||
          existingEvidence.currency !== providerEvidence.currency
        ) {
          // Preserve immutable evidence on the old attempt. A changed expected
          // charge gets a fresh Payment rather than relabeling provider facts.
          existingPayment = null;
        }
      }

      if (existingPayment) {
        console.log('⚠️ Payment already exists for hire:', hireId, 'Updating:', existingPayment.id);

        payment = await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            orderId: orderId,
            transactionId: transactionId,
            amount: Number(amount),
            currency: transactionCurrency,
            paymentMethod: selectedPaymentMethod,
            ...(existingPayment.providerAmount == null && existingPayment.providerCurrency == null
              ? {
                  providerAmount: providerEvidence.amount,
                  providerCurrency: providerEvidence.currency,
                }
              : {}),
            purpose: PAYMENT_PURPOSES.COMMISSION,
            userEmail: userEmail || existingPayment.userEmail,
            workerId: workerId || existingPayment.workerId,
            workerName: workerName || existingPayment.workerName,
            jobTitle: jobTitle || existingPayment.jobTitle,
            employerId: employerId || existingPayment.employerId,
            employerName: employerName || existingPayment.employerName,
            hireId: hireId,
            offerId: offerId || existingPayment.offerId,
            phone: phone || existingPayment.phone,
            metadata: {
              ...existingPayment.metadata,
              createdFrom: 'payment-intent',
              source: 'frontend',
              originalAmount: amount,
              originalCurrency: transactionCurrency,
              updatedAt: new Date().toISOString()
            }
          }
        });

        console.log('✅ Payment record updated:', transactionId);
      } else {
        payment = await prisma.payment.create({
          data: {
            orderId,
            transactionId,
            amount: Number(amount),
            currency: transactionCurrency,
            paymentMethod: selectedPaymentMethod,
            providerAmount: providerEvidence.amount,
            providerCurrency: providerEvidence.currency,
            purpose: PAYMENT_PURPOSES.COMMISSION,
            status: 'pending',
            userEmail: userEmail || 'employer@example.com',
            userId: req.userId || null,
            workerId: workerId || null,
            workerName: workerName || 'Worker',
            jobTitle: jobTitle || null,
            employerId: employerId || null,
            employerName: employerName || null,
            hireId: hireId,
            offerId: offerId || null,
            phone: phone || null,
            metadata: {
              createdFrom: 'payment-intent',
              source: 'frontend',
              originalAmount: amount,
              originalCurrency: transactionCurrency
            }
          }
        });
        console.log('✅ Payment record created:', transactionId);
      }
    } else {
      // SUBSCRIPTION: no hire context — a fresh Payment row per attempt. The
      // completion flow (webhook / capture) grants Premium via purpose.
      payment = await prisma.payment.create({
        data: {
          orderId,
          transactionId,
          amount: Number(amount),
          currency: transactionCurrency,
          paymentMethod: selectedPaymentMethod,
          providerAmount: providerEvidence.amount,
          providerCurrency: providerEvidence.currency,
          purpose: PAYMENT_PURPOSES.SUBSCRIPTION,
          status: 'pending',
          userEmail: userEmail || 'employer@example.com',
          userId: req.userId || null,
          workerId: workerId || null,
          workerName: workerName || null,
          jobTitle: jobTitle || null,
          employerId: employerId || null,
          employerName: employerName || null,
          hireId: null,
          offerId: offerId || null,
          phone: phone || null,
          metadata: {
            createdFrom: 'payment-intent',
            source: 'frontend',
            originalAmount: amount,
            originalCurrency: transactionCurrency
          }
        }
      });
      console.log('✅ SUBSCRIPTION payment record created:', transactionId);
    }

    let result;

    if (selectedPaymentMethod === 'paymob') {
      try {
        const authToken = await getPaymobAuthToken();
        const paymobOrder = await createPaymobOrder(authToken, payment.providerAmount, orderId, customerData);
        const paymobOrderId = paymobOrder.id;
        const paymentKey = await getPaymobPaymentKey(authToken, paymobOrderId, payment.providerAmount, customerData);

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            paymobOrderId: String(paymobOrderId),
            status: 'processing'
          }
        });

        const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

        result = {
          success: true,
          orderId,
          transactionId,
          paymentId: transactionId,
          iframeUrl: iframeUrl,
          status: 'processing',
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: 'paymob'
        };

        console.log('✅ Paymob payment created with iframe');

      } catch (error) {
        console.error('❌ Paymob integration error:', error);
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            metadata: { ...(payment.metadata || {}), error: error.message }
          }
        });

        return res.status(500).json({
          success: false,
          error: error.message || 'Paymob payment failed'
        });
      }

    } else if (selectedPaymentMethod === 'paypal') {
      try {
        const accessToken = await getPayPalAccessToken();
        const paypalOrder = await createPayPalOrder(
          accessToken,
          { amount: payment.providerAmount, currency: payment.providerCurrency },
          orderId,
          customerData
        );
        const paypalOrderId = paypalOrder.id;

        const approvalLink = paypalOrder.links.find(link => link.rel === 'approve');
        const approvalUrl = approvalLink?.href;

        if (!approvalUrl) {
          throw new Error('No approval URL found in PayPal response');
        }

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            paypalOrderId,
            approvalUrl,
            status: 'processing'
          }
        });

        console.log(`✅ PayPal order created with approval URL: ${approvalUrl}`);

        result = {
          success: true,
          orderId,
          transactionId,
          paymentId: transactionId,
          approvalUrl: approvalUrl,
          paypalOrderId: paypalOrderId,
          status: 'processing',
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: 'paypal'
        };

      } catch (error) {
        console.error('❌ PayPal integration error:', error);
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            metadata: { ...(payment.metadata || {}), error: error.message }
          }
        });

        return res.status(500).json({
          success: false,
          error: error.message || 'PayPal payment failed'
        });
      }

    }

    res.json(result);

  } catch (error) {
    console.error('❌ Payment intent error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment intent'
    });
  }
});

/**
 * Get PayPal Approval URL
 * GET /api/payments/paypal-approval/:orderId
 */
router.get('/paypal-approval/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { paypalOrderId: orderId }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    if (!(await authenticatedUserOwnsPayment(req, payment))) {
      return rejectPaymentAccess(res);
    }

    if (!payment.approvalUrl) {
      return res.status(400).json({
        success: false,
        error: 'No approval URL found for this payment'
      });
    }

    res.json({
      success: true,
      approvalUrl: payment.approvalUrl,
      orderId: payment.orderId,
      transactionId: payment.transactionId
    });

  } catch (error) {
    console.error('❌ Get approval URL error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get approval URL'
    });
  }
});

/**
 * Capture PayPal Order
 * POST /api/payments/capture-paypal/:orderId
 */
router.post('/capture-paypal/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`🔍 Capturing PayPal order: ${orderId}`);

    // Find by paypalOrderId
    let payment = await prisma.payment.findFirst({
      where: { paypalOrderId: orderId }
    });

    // If not found, try by orderId
    if (!payment) {
      payment = await prisma.payment.findFirst({
        where: { orderId: orderId }
      });
    }

    // Ownership is established before status disclosure, PayPal lookup, or
    // any canonical fulfillment attempt.
    if (!(await authenticatedUserOwnsPayment(req, payment))) {
      return rejectPaymentAccess(res);
    }

    console.log(`✅ Found payment for order: ${orderId}, status: ${payment.status}`);

    // Only short-circuit when both capture and canonical fulfillment finished.
    if (payment.status === 'completed' && payment.fulfillmentStatus === FULFILLMENT_STATUS.FULFILLED) {
      console.log(`✅ Payment already completed: ${orderId}`);
      console.log("RETURN SUCCESS PATH A");
      return res.json({
        success: true,
        message: 'Payment already completed',
        transaction: {
          id: payment.transactionId,
          orderId: payment.orderId,
          amount: payment.amount,
          status: 'completed',
          paymentMethod: 'paypal'
        }
      });
    }

    // Completed-but-unfulfilled payments must re-verify with PayPal below and
    // retry through the same idempotent fulfillment path.
    if (
      payment.status === 'pending' ||
      payment.status === 'processing' ||
      (payment.status === 'completed' && payment.fulfillmentStatus !== FULFILLMENT_STATUS.FULFILLED)
    ) {
      // Get PayPal access token
      let accessToken;
      try {
        accessToken = await getPayPalAccessToken();
        console.log('✅ PayPal access token obtained');
      } catch (tokenError) {
        console.error('❌ Failed to get PayPal access token:', tokenError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to authenticate with PayPal. Please try again.'
        });
      }

      const baseUrl = process.env.PAYPAL_MODE === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

      try {
        // First, check the order status
        const orderCheck = await axios.get(
          `${baseUrl}/v2/checkout/orders/${payment.paypalOrderId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        console.log(`📊 Order ${orderId} status: ${orderCheck.data?.status}`);

        // If order is already completed, update and return
        if (orderCheck.data?.status === 'COMPLETED') {
          const { captureId, expected } = verifyPayPalOrderEvidence(payment, orderCheck.data, { requireCapture: true });
          await persistVerifiedLegacyProviderEvidence(payment, expected);

          // Atomic, idempotent completion — side effects routed by PURPOSE
          // (SUBSCRIPTION grants Premium; COMMISSION updates the hire).
          await completePaymentTransaction(payment, captureId);

          console.log("RETURN SUCCESS PATH A");
          return res.json({
            success: true,
            message: 'Payment already completed',
            transaction: {
              id: payment.transactionId,
              orderId: payment.orderId,
              amount: payment.amount,
              status: 'completed',
              paymentMethod: 'paypal'
            }
          });
        }

        // If order is APPROVED, capture it
        if (orderCheck.data?.status === 'APPROVED') {
          verifyPayPalOrderEvidence(payment, orderCheck.data);
          console.log(`🔄 Order ${orderId} is APPROVED, attempting to capture...`);

          const captureResponse = await axios.post(
            `${baseUrl}/v2/checkout/orders/${payment.paypalOrderId}/capture`,
            {},
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              }
            }
          );

          console.log(`📥 PayPal capture response status: ${captureResponse.data?.status}`);

          if (captureResponse.data && captureResponse.data.status === 'COMPLETED') {
            const { captureId, expected } = verifyPayPalOrderEvidence(payment, captureResponse.data, { requireCapture: true });
            await persistVerifiedLegacyProviderEvidence(payment, expected);

            await completePaymentTransaction(payment, captureId);

            console.log(`✅ PayPal order captured successfully: ${orderId}`);

            console.log("RETURN SUCCESS PATH B");
            return res.json({
              success: true,
              message: 'Payment captured successfully',
              transaction: {
                id: payment.transactionId,
                orderId: payment.orderId,
                amount: payment.amount,
                status: 'completed',
                paymentMethod: 'paypal',
                paypalOrderId: orderId,
                captureId: captureId
              }
            });
          } else {
            // If capture didn't complete, return the status
            return res.json({
              success: false,
              error: `Order status: ${captureResponse.data?.status || 'unknown'}`,
              status: captureResponse.data?.status || 'unknown'
            });
          }
        }

        // If order is CREATED or PENDING_APPROVAL, user hasn't approved yet
        if (orderCheck.data?.status === 'CREATED' || orderCheck.data?.status === 'PAYER_ACTION_REQUIRED') {
          return res.json({
            success: false,
            error: 'Order not approved by user yet. Please complete the PayPal approval process.',
            status: 'PENDING_APPROVAL',
            approvalUrl: payment.approvalUrl
          });
        }

        // Any other status
        return res.json({
          success: false,
          error: `Order status: ${orderCheck.data?.status || 'unknown'}`,
          status: orderCheck.data?.status || 'unknown'
        });

      } catch (captureError) {
        console.error('❌ PayPal capture API error:', captureError.response?.data || captureError.message);

        const errorData = captureError.response?.data;

        // Handle specific error cases
        if (errorData?.details) {
          const details = errorData.details;

          // Check for ORDER_ALREADY_CAPTURED
          const alreadyCaptured = details.some(d => d.issue === 'ORDER_ALREADY_CAPTURED');
          if (alreadyCaptured) {
            const verifiedOrder = await axios.get(
              `${baseUrl}/v2/checkout/orders/${payment.paypalOrderId}`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            const { captureId, expected } = verifyPayPalOrderEvidence(
              payment,
              verifiedOrder.data,
              { requireCapture: true }
            );
            await persistVerifiedLegacyProviderEvidence(payment, expected);
            await completePaymentTransaction(payment, captureId);

            console.log("RETURN SUCCESS PATH A");
            return res.json({
              success: true,
              message: 'Payment was already captured',
              transaction: {
                id: payment.transactionId,
                orderId: payment.orderId,
                amount: payment.amount,
                status: 'completed',
                paymentMethod: 'paypal'
              }
            });
          }

          // Check for ORDER_NOT_APPROVED
          const notApproved = details.some(d => d.issue === 'ORDER_NOT_APPROVED');
          if (notApproved) {
            return res.json({
              success: false,
              error: 'Order not approved by user yet.',
              status: 'PENDING_APPROVAL',
              approvalUrl: payment.approvalUrl
            });
          }

          // Compliance failures never fabricate capture evidence. Sandbox
          // tests must complete a real provider capture.
          const complianceViolation = details.some(d => d.issue === 'COMPLIANCE_VIOLATION');
          if (complianceViolation) {
            console.log('⚠️ COMPLIANCE_VIOLATION detected');
            return res.json({
              success: false,
              error: 'Payment cannot be processed due to compliance restrictions. Please use a different payment method.',
              status: 'COMPLIANCE_VIOLATION',
              useAlternative: true
            });
          }
        }

        // Generic error
        const errorMessage = errorData?.message ||
                            errorData?.error_description ||
                            captureError.message ||
                            'PayPal capture failed';

        return res.status(500).json({
          success: false,
          error: errorMessage,
          details: errorData || null
        });
      }
    }

    // If payment status is failed or any other status
    return res.status(400).json({
      success: false,
      error: `Payment cannot be captured. Current status: ${payment.status}`
    });

  } catch (error) {
    console.error('❌ PayPal capture error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to capture PayPal payment'
    });
  }
});

/**
 * Get Payment Status
 * GET /api/payments/status/:paymentId
 */
router.get('/status/:paymentId', authenticate, async (req, res) => {
  try {
    const { paymentId } = req.params;
    console.log(`🔍 Checking payment status: ${paymentId}`);

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { transactionId: paymentId },
          { orderId: paymentId },
          { paypalOrderId: paymentId }
        ]
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Do not query PayPal or expose payment metadata until ownership is
    // proven from the authenticated account and canonical payment context.
    if (!(await authenticatedUserOwnsPayment(req, payment))) {
      return rejectPaymentAccess(res);
    }

    // Verify PayPal server-to-server whenever capture or fulfillment is not
    // complete; internal Payment.status alone is not provider proof.
    if (
      payment.paymentMethod === 'paypal' &&
      payment.paypalOrderId &&
      (payment.status !== 'completed' || payment.fulfillmentStatus !== FULFILLMENT_STATUS.FULFILLED)
    ) {
      try {
        const accessToken = await getPayPalAccessToken();
        const baseUrl = process.env.PAYPAL_MODE === 'production'
          ? 'https://api-m.paypal.com'
          : 'https://api-m.sandbox.paypal.com';

        const orderCheck = await axios.get(
          `${baseUrl}/v2/checkout/orders/${payment.paypalOrderId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (orderCheck.data?.status === 'COMPLETED') {
          const { captureId, expected } = verifyPayPalOrderEvidence(
            payment,
            orderCheck.data,
            { requireCapture: true }
          );
          await persistVerifiedLegacyProviderEvidence(payment, expected);
          await completePaymentTransaction(payment, captureId);

          const refreshedPayment = await prisma.payment.findUnique({
            where: { id: payment.id }
          });
          if (refreshedPayment) {
            Object.assign(payment, refreshedPayment);
          }
        }
      } catch (error) {
        console.log('⚠️ Could not check PayPal status:', error.message);
      }
    }

    res.json({
      success: true,
      payment: {
        id: payment.transactionId,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        purpose: payment.purpose,
        paymentMethod: payment.paymentMethod,
        userEmail: payment.userEmail,
        workerName: payment.workerName,
        jobTitle: payment.jobTitle,
        employerName: payment.employerName,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        completedAt: payment.completedAt,
        approvalUrl: payment.approvalUrl
      }
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get payment status'
    });
  }
});

/**
 * @deprecated Manual payment completion is obsolete. Payments are now captured
 * and verified automatically via the PayPal capture endpoint
 * (POST /api/payments/capture-paypal/:orderId) and Paymob, which already mark
 * the payment completed and call updateHireAfterPayment(). There is NO manual
 * "Mark as Paid" UI anymore.
 *
 * This route remains mounted temporarily for compatibility and monitoring, but
 * all legacy completion requests are rejected without reading or writing any
 * financial state. Provider-verified canonical fulfillment is the only path.
 *
 * POST /api/payments/complete-payment
 */
router.post('/complete-payment', (_req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Deprecated payment completion endpoint is no longer supported.'
  });
});

/**
 * Get Current User Subscription Status (READ-ONLY)
 * GET /api/payments/subscription-status
 * Returns the real subscription from MongoDB (single source of truth).
 * The frontend uses this to REFLECT premium state after payment — it never
 * creates a subscription here.
 */
router.get('/subscription-status', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: String(userId),
        status: 'active',
        endDate: { gte: new Date() }
      },
      orderBy: { endDate: 'desc' }
    });

    res.json({
      success: true,
      isPremium: !!subscription,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate
          }
        : null
    });

  } catch (error) {
    console.error('❌ Subscription status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get subscription status'
    });
  }
});

/**
 * Get User Payments
 * GET /api/payments/user/:userId
 */
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const authenticatedUserId = req.userId == null ? '' : String(req.userId);
    if (!authenticatedUserId || String(req.params.userId) !== authenticatedUserId) {
      return rejectPaymentAccess(res);
    }
    const userId = authenticatedUserId;
    console.log(`📂 Getting payments for user: ${userId}`);

    const ownedHireIds = isObjectId(userId) && String(req.userRole || '').toUpperCase() === 'EMPLOYER'
      ? (await prisma.hire.findMany({
          where: { employerId: userId },
          select: { id: true },
        })).map((hire) => hire.id)
      : [];
    const ownershipFilters = [];
    if (isObjectId(userId)) ownershipFilters.push({ userId });
    if (ownedHireIds.length > 0) ownershipFilters.push({ hireId: { in: ownedHireIds } });

    const payments = ownershipFilters.length === 0
      ? []
      : await prisma.payment.findMany({
          where: { OR: ownershipFilters },
          orderBy: { createdAt: 'desc' }
        });

    res.json({
      success: true,
      count: payments.length,
      payments: payments.map(p => ({
        id: p.transactionId,
        orderId: p.orderId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        workerName: p.workerName,
        jobTitle: p.jobTitle,
        employerName: p.employerName,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        completedAt: p.completedAt
      }))
    });

  } catch (error) {
    console.error('❌ Get user payments error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user payments'
    });
  }
});

/**
 * Verify Payment
 * POST /api/payments/verify
 */
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { transactionId, orderId } = req.body;

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { transactionId },
          { orderId },
          { paypalOrderId: orderId }
        ]
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    if (!(await authenticatedUserOwnsPayment(req, payment))) {
      return rejectPaymentAccess(res);
    }

    res.json({
      success: true,
      verified: payment.status === 'completed',
      payment: {
        id: payment.transactionId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod
      }
    });

  } catch (error) {
    console.error('❌ Verify payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify payment'
    });
  }
});

// ============================================================
// PAYMOB WEBHOOK HMAC — Transaction Processed Callback (official spec)
// ============================================================
// Paymob does NOT sign the raw body and does NOT use a signature header.
// The server-to-server callback POSTs `{ type: "TRANSACTION", obj }` and
// delivers the signature as the `hmac` QUERY PARAMETER. The digest is
// HMAC-SHA512 (lowercase hex) over a FIXED, ORDERED concatenation of exactly
// these 20 obj fields with NO separator (booleans as lowercase true/false):
//   amount_cents, created_at, currency, error_occured, has_parent_transaction,
//   id, integration_id, is_3d_secure, is_auth, is_capture, is_refunded,
//   is_standalone_payment, is_voided, order.id, owner, pending,
//   source_data.pan, source_data.sub_type, source_data.type, success
const PAYMOB_HMAC_FIELD_ORDER = [
  ['amount_cents'],
  ['created_at'],
  ['currency'],
  ['error_occured'],
  ['has_parent_transaction'],
  ['id'],
  ['integration_id'],
  ['is_3d_secure'],
  ['is_auth'],
  ['is_capture'],
  ['is_refunded'],
  ['is_standalone_payment'],
  ['is_voided'],
  ['order', 'id'],
  ['owner'],
  ['pending'],
  ['source_data', 'pan'],
  ['source_data', 'sub_type'],
  ['source_data', 'type'],
  ['success']
];

const resolvePaymobField = (obj, path) => {
  return path.reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
};

const paymobHmacStringify = (value) => {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null || value === undefined) return '';
  return String(value);
};

const verifyPaymobTransactionHmac = (obj, receivedHmac, secret) => {
  if (!obj || typeof obj !== 'object' || !receivedHmac || !secret) return false;
  try {
    const concatenated = PAYMOB_HMAC_FIELD_ORDER
      .map((path) => paymobHmacStringify(resolvePaymobField(obj, path)))
      .join('');
    const expected = crypto.createHmac('sha512', secret).update(concatenated).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(String(receivedHmac), 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (error) {
    console.error('❌ Paymob HMAC computation error:', error.message);
    return false;
  }
};

export const verifyPaymobPaymentEvidence = (payment, obj) => {
  const providerOrderId = obj?.order?.id == null ? '' : String(obj.order.id);
  const merchantOrderId = obj?.order?.merchant_order_id == null
    ? ''
    : String(obj.order.merchant_order_id);

  if (!payment.paymobOrderId || providerOrderId !== String(payment.paymobOrderId)) {
    throw new Error('Paymob provider order identity mismatch');
  }
  if (merchantOrderId && merchantOrderId !== String(payment.orderId)) {
    throw new Error('Paymob merchant order identity mismatch');
  }

  const expected = resolveExpectedProviderEvidence(payment);
  const expectedAmountMinor = toMinorUnits(expected.amount, expected.currency);
  if (!Number.isSafeInteger(Number(obj.amount_cents)) || Number(obj.amount_cents) !== expectedAmountMinor) {
    throw new Error('Paymob amount mismatch');
  }

  const callbackCurrency = typeof obj.currency === 'string' ? obj.currency.trim().toUpperCase() : '';
  if (!callbackCurrency || callbackCurrency !== expected.currency) {
    throw new Error('Paymob currency mismatch');
  }
  return expected;
};

/**
 * Webhook Handler
 * POST /api/payments/webhook
 *
 * SECURITY (Transaction Processed Callback, official spec):
 *  - body shape `{ type: "TRANSACTION", obj: {...} }`; hmac is a QUERY PARAM.
 *  - Verification: 20-field ordered concatenation, HMAC-SHA512,
 *    crypto.timingSafeEqual comparison.
 *  - PRODUCTION: an unverified success webhook is ALWAYS rejected (401, no
 *    state change) — even if PAYMOB_HMAC_SECRET is missing.
 *  - DEVELOPMENT: explicit bypass ONLY when NODE_ENV !== 'production' AND
 *    PAYMOB_DEV_UNVERIFIED_WEBHOOK === 'true'.
 *
 * IDEMPOTENCY: completion goes through completePaymentTransaction's atomic
 * fulfillment claim — duplicate/re-delivered callbacks never grant a
 * subscription twice or update a hire twice.
 */
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body || {};
    const obj = body.obj;
    const isPaymobTransactionCallback = obj && typeof obj === 'object' && !Array.isArray(obj);

    // Paymob sends hmac as a query parameter; a few legacy fixtures also carry
    // it at the top of the body. Headers are never a trusted source.
    const receivedHmac = String(req.query.hmac || body.hmac || '').trim();
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET;

    let hmacVerified = false;
    if (isPaymobTransactionCallback && hmacSecret) {
      hmacVerified = verifyPaymobTransactionHmac(obj, receivedHmac, hmacSecret);
    }

    if (!hmacVerified) {
      // Controlled development-only bypass — NEVER available in production.
      const devBypass = process.env.NODE_ENV !== 'production' && process.env.PAYMOB_DEV_UNVERIFIED_WEBHOOK === 'true';
      if (!devBypass) {
        console.error('❌ Webhook rejected: unverified Paymob signature (no state was changed)');
        return res.status(401).json({ success: false, error: 'Invalid HMAC signature' });
      }
      console.warn(`⚠️ DEV BYPASS enabled: processing unverified callback (NODE_ENV=${process.env.NODE_ENV}) — NEVER enabled in production`);
    }

    // Identifiers from the standard callback, else legacy flat-body fields.
    const transactionId = isPaymobTransactionCallback && obj.id != null
      ? String(obj.id)
      : (body.transactionId || '');
    const paymobOrderId = isPaymobTransactionCallback && obj.order?.id != null
      ? String(obj.order.id)
      : '';
    const merchantOrderId = isPaymobTransactionCallback && obj.order?.merchant_order_id != null
      ? String(obj.order.merchant_order_id)
      : (body.merchant_order_id || '');
    const bodyOrderId = body.orderId || '';
    const flatStatus = body.status || '';

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { paymobOrderId },
          { orderId: merchantOrderId },
          { orderId: bodyOrderId },
          { paymobTransactionId: transactionId },
          { transactionId },
          { paypalOrderId: bodyOrderId }
        ]
      }
    });

    if (!payment) {
      console.log('⚠️ Payment not found for webhook');
      return res.json({ success: true, message: 'Webhook processed (payment not found)' });
    }

    const success = isPaymobTransactionCallback
      ? obj.success === true && obj.pending === false
      : ['success', 'completed', 'COMPLETED'].includes(flatStatus);
    const failed = isPaymobTransactionCallback
      ? obj.success === false
      : ['failed', 'FAILED', 'declined', 'DECLINED'].includes(flatStatus);

    if (success) {
      try {
        if (!isPaymobTransactionCallback) throw new Error('Paymob transaction evidence is missing');
        const expected = verifyPaymobPaymentEvidence(payment, obj);
        await persistVerifiedLegacyProviderEvidence(payment, expected);
      } catch (verificationError) {
        console.error(`❌ Paymob reconciliation rejected for Payment ${payment.id}:`, verificationError.message);
        return res.status(409).json({ success: false, error: verificationError.message });
      }

      // Fulfillment is claimed atomically and keyed to fulfillmentStatus
      // (never merely status='completed'), so re-delivered callbacks cannot
      // double-grant Premium or double-update a hire.
      const captureRef = 'PAYMOB_' + (transactionId || Date.now());
      await completePaymentTransaction(payment, captureRef);

      if (transactionId) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { paymobTransactionId: transactionId }
        });
      }
      console.log(`✅ Payment ${payment.transactionId} completed via webhook`);
    } else if (failed) {
      // A later decline must NEVER leapfrog an already-completed payment.
      await prisma.payment.updateMany({
        where: { id: payment.id, NOT: { status: 'completed' } },
        data: { status: 'failed' }
      });
      console.log(`❌ Payment ${payment.transactionId} failed via webhook`);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process webhook'
    });
  }
});

export default router;
