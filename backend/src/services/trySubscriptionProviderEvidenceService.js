import { convertTryToUsd, FxConversionError } from './fxConversionService.js';
import { resolveSubscriptionPriceBook } from '../config/subscriptionPriceBooks.js';

export const TRY_TO_USD_CONVERTED_MODE = 'TRY_TO_USD_CONVERTED';
export const TRY_SUBSCRIPTION_PLAN_DURATIONS = Object.freeze({
  weekly: 7,
  monthly: 30,
  annual: 365,
});

const requiredText = (value) => typeof value === 'string' && value.trim().length > 0;

const normalizeSnapshot = (snapshot = {}) => ({
  plan: typeof snapshot.plan === 'string' ? snapshot.plan.trim().toLowerCase() : '',
  purchaserRole: typeof snapshot.purchaserRole === 'string' ? snapshot.purchaserRole.trim().toUpperCase() : '',
  durationDays: snapshot.durationDays,
  market: typeof snapshot.market === 'string' ? snapshot.market.trim().toUpperCase() : '',
  countryCode: typeof snapshot.countryCode === 'string' ? snapshot.countryCode.trim().toUpperCase() : '',
  priceBookVersion: typeof snapshot.priceBookVersion === 'string' ? snapshot.priceBookVersion.trim() : '',
});

export const validateTrySubscriptionSnapshot = (snapshot) => {
  const normalized = normalizeSnapshot(snapshot);
  const expectedDuration = TRY_SUBSCRIPTION_PLAN_DURATIONS[normalized.plan];
  if (!expectedDuration || normalized.durationDays !== expectedDuration) {
    throw new FxConversionError('INVALID_TRY_SUBSCRIPTION_SNAPSHOT', 'Invalid TRY subscription plan duration');
  }
  if (!['EMPLOYER', 'WORKER'].includes(normalized.purchaserRole)) {
    throw new FxConversionError('INVALID_TRY_SUBSCRIPTION_SNAPSHOT', 'Invalid TRY subscription purchaser role');
  }
  if (normalized.market !== 'TURKEY' || normalized.countryCode !== 'TR') {
    throw new FxConversionError('INVALID_TRY_SUBSCRIPTION_SNAPSHOT', 'Invalid TRY subscription market identity');
  }
  if (!requiredText(normalized.priceBookVersion)) {
    throw new FxConversionError('INVALID_TRY_SUBSCRIPTION_SNAPSHOT', 'Missing TRY subscription price-book version');
  }
  return Object.freeze(normalized);
};

const fxConfigFromMetadata = (metadata = {}) => ({
  baseCurrency: 'TRY',
  quoteCurrency: 'USD',
  rate: metadata.exchangeRate,
  rateDirection: metadata.rateDirection || metadata.exchangeRateDirection,
  rateVersion: metadata.exchangeRateVersion,
  effectiveAt: metadata.exchangeRateTimestamp,
  source: metadata.exchangeRateSource,
});

export const resolveTrySubscriptionProviderEvidence = ({
  bookAmount,
  subscriptionSnapshot,
  fxConfig,
  now,
} = {}) => {
  const snapshot = validateTrySubscriptionSnapshot(subscriptionSnapshot);
  const conversion = convertTryToUsd({ bookAmount, config: fxConfig, now });
  return Object.freeze({
    mode: TRY_TO_USD_CONVERTED_MODE,
    providerAmount: conversion.providerAmount,
    providerCurrency: conversion.providerCurrency,
    fxMetadata: Object.freeze({
      exchangeRate: conversion.exchangeRate,
      rateDirection: conversion.rateDirection,
      exchangeRateSource: conversion.exchangeRateSource,
      exchangeRateVersion: conversion.exchangeRateVersion,
      exchangeRateTimestamp: conversion.exchangeRateTimestamp,
    }),
    subscriptionSnapshot: snapshot,
  });
};

/**
 * Server-authoritative entry point for a future Turkey purchase path. The
 * caller supplies only the authenticated user and stable plan; role, country,
 * book amount, duration, and price-book version come from the server resolver.
 */
export const resolveTrySubscriptionProviderEvidenceForUser = ({ user, plan, fxConfig, now } = {}) => {
  const resolved = resolveSubscriptionPriceBook({ user, plan });
  if (resolved.market !== 'TURKEY' || resolved.countryCode !== 'TR') {
    throw new FxConversionError('INVALID_TRY_SUBSCRIPTION_SNAPSHOT', 'TRY provider evidence requires an authenticated Turkey user');
  }
  return resolveTrySubscriptionProviderEvidence({
    bookAmount: resolved.amount,
    subscriptionSnapshot: {
      plan: resolved.plan,
      purchaserRole: resolved.role,
      durationDays: resolved.durationDays,
      market: resolved.market,
      countryCode: resolved.countryCode,
      priceBookVersion: resolved.priceBookVersion,
    },
    fxConfig,
    now,
  });
};

/**
 * Validate a persisted Turkey Payment without consulting current FX config.
 * The stored FX snapshot is the historical authority for reconciliation.
 */
export const resolvePersistedTrySubscriptionEvidence = (payment) => {
  if (!isTurkeySubscriptionPayment(payment)) {
    throw new FxConversionError('INVALID_TRY_SUBSCRIPTION_SNAPSHOT', 'Persisted payment is not a Turkey PayPal subscription');
  }
  const metadata = payment?.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)
    ? payment.metadata
    : {};
  const subscriptionSnapshot = validateTrySubscriptionSnapshot(metadata);
  const expected = resolveTrySubscriptionProviderEvidence({
    bookAmount: payment?.amount,
    subscriptionSnapshot,
    fxConfig: fxConfigFromMetadata(metadata),
    // Historical evidence is validated against its own effective timestamp;
    // current rate freshness must never invalidate an existing payment.
    now: Date.parse(metadata.exchangeRateTimestamp),
  });
  if (String(payment?.currency || '').trim().toUpperCase() !== 'TRY') {
    throw new FxConversionError('INVALID_TRY_SUBSCRIPTION_SNAPSHOT', 'TRY payment book currency is required');
  }
  if (String(payment?.providerCurrency || '').trim().toUpperCase() !== 'USD') {
    throw new FxConversionError('INVALID_TRY_SUBSCRIPTION_SNAPSHOT', 'USD provider currency is required');
  }
  if (typeof payment?.providerAmount !== 'string' || payment.providerAmount !== expected.providerAmount) {
    throw new FxConversionError('INVALID_TRY_SUBSCRIPTION_SNAPSHOT', 'Persisted TRY provider amount does not match the FX snapshot');
  }
  return expected;
};

export const isTurkeySubscriptionPayment = (payment) => (
  String(payment?.paymentMethod || '').trim().toLowerCase() === 'paypal'
  && String(payment?.purpose || '').trim().toUpperCase() === 'SUBSCRIPTION'
  && String(payment?.currency || '').trim().toUpperCase() === 'TRY'
  && String(payment?.providerCurrency || '').trim().toUpperCase() === 'USD'
);

export default {
  TRY_TO_USD_CONVERTED_MODE,
  TRY_SUBSCRIPTION_PLAN_DURATIONS,
  validateTrySubscriptionSnapshot,
  resolveTrySubscriptionProviderEvidence,
  resolveTrySubscriptionProviderEvidenceForUser,
  resolvePersistedTrySubscriptionEvidence,
  isTurkeySubscriptionPayment,
};
