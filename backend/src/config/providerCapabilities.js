import { PAYMENT_PURPOSES } from './subscription.js';
import { isSupportedCurrency, normalizeCurrencyCode } from '../utils/currencyMetadata.js';

export const PROVIDERS = Object.freeze({
  PAYMOB: 'paymob',
  PAYPAL: 'paypal',
});

export const PROVIDER_CAPABILITY_MODES = Object.freeze({
  DIRECT: 'DIRECT',
  LEGACY_CONVERTED: 'LEGACY_CONVERTED',
  UNSUPPORTED: 'UNSUPPORTED',
});

export const PROVIDER_VERIFICATION_STATUSES = Object.freeze({
  CURRENTLY_IMPLEMENTED: 'CURRENTLY_IMPLEMENTED',
  EXTERNAL_VERIFICATION_REQUIRED: 'EXTERNAL_VERIFICATION_REQUIRED',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
});

const knownProviders = new Set(Object.values(PROVIDERS));
const knownPurposes = new Set(Object.values(PAYMENT_PURPOSES));

const hasValue = (value) => typeof value === 'string' && value.trim().length > 0;

const getConfigurationContext = (provider) => {
  if (provider === PROVIDERS.PAYMOB) {
    const required = {
      apiKey: hasValue(process.env.PAYMOB_API_KEY),
      integrationId: hasValue(process.env.PAYMOB_INTEGRATION_ID),
      iframeId: hasValue(process.env.PAYMOB_IFRAME_ID),
      hmacSecret: hasValue(process.env.PAYMOB_HMAC_SECRET),
    };
    return {
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      configured: Object.values(required).every(Boolean),
      required,
    };
  }

  const required = {
    clientId: hasValue(process.env.PAYPAL_CLIENT_ID),
    secret: hasValue(process.env.PAYPAL_SECRET),
  };
  return {
    environment: process.env.PAYPAL_MODE === 'production' ? 'production' : 'sandbox',
    configured: Object.values(required).every(Boolean),
    required,
  };
};

const unsupportedCapability = ({ provider, purpose, transactionCurrency, reason, configuration }) => ({
  provider,
  purpose,
  transactionCurrency,
  providerCurrency: null,
  supported: false,
  enabled: false,
  mode: PROVIDER_CAPABILITY_MODES.UNSUPPORTED,
  verificationStatus: PROVIDER_VERIFICATION_STATUSES.NOT_IMPLEMENTED,
  externalAccountVerificationRequired: reason === 'NOT_IMPLEMENTED',
  reason,
  configuration,
});

/**
 * Describe HomelyServ's current provider capability. `supported` means the
 * payment path is implemented by this codebase. `enabled` additionally
 * requires the current process to have the non-secret configuration shape
 * needed by that path. Neither flag claims global provider/account support.
 */
export const getProviderCapability = ({ provider, purpose, transactionCurrency } = {}) => {
  const normalizedProvider = typeof provider === 'string' ? provider.trim().toLowerCase() : null;
  const normalizedPurpose = typeof purpose === 'string' ? purpose.trim().toUpperCase() : null;
  const normalizedCurrency = normalizeCurrencyCode(transactionCurrency);

  if (!normalizedProvider || !knownProviders.has(normalizedProvider)) {
    return unsupportedCapability({
      provider: normalizedProvider,
      purpose: normalizedPurpose,
      transactionCurrency: normalizedCurrency,
      reason: 'UNKNOWN_PROVIDER',
      configuration: null,
    });
  }

  const configuration = getConfigurationContext(normalizedProvider);
  if (!normalizedPurpose || !knownPurposes.has(normalizedPurpose)) {
    return unsupportedCapability({
      provider: normalizedProvider,
      purpose: normalizedPurpose,
      transactionCurrency: normalizedCurrency,
      reason: 'UNKNOWN_PURPOSE',
      configuration,
    });
  }
  if (!normalizedCurrency || !isSupportedCurrency(normalizedCurrency)) {
    return unsupportedCapability({
      provider: normalizedProvider,
      purpose: normalizedPurpose,
      transactionCurrency: normalizedCurrency,
      reason: 'UNSUPPORTED_CURRENCY',
      configuration,
    });
  }

  const isPaymob = normalizedProvider === PROVIDERS.PAYMOB;
  const isPaymobEgp = isPaymob && normalizedCurrency === 'EGP';
  const isLegacyPayPalEgp = (
    normalizedProvider === PROVIDERS.PAYPAL &&
    normalizedCurrency === 'EGP'
  );
  const isLivePayPalDirectCommission = (
    normalizedProvider === PROVIDERS.PAYPAL &&
    normalizedPurpose === PAYMENT_PURPOSES.COMMISSION &&
    configuration.environment === 'production' &&
    ['USD', 'EUR', 'GBP'].includes(normalizedCurrency)
  );
  const isLivePayPalDirectSubscription = (
    normalizedProvider === PROVIDERS.PAYPAL &&
    normalizedPurpose === PAYMENT_PURPOSES.SUBSCRIPTION &&
    configuration.environment === 'production' &&
    ['USD', 'EUR', 'GBP'].includes(normalizedCurrency)
  );

  if (!isPaymobEgp && !isLegacyPayPalEgp && !isLivePayPalDirectCommission && !isLivePayPalDirectSubscription) {
    return unsupportedCapability({
      provider: normalizedProvider,
      purpose: normalizedPurpose,
      transactionCurrency: normalizedCurrency,
      reason: 'NOT_IMPLEMENTED',
      configuration,
    });
  }

  return {
    provider: normalizedProvider,
    purpose: normalizedPurpose,
    transactionCurrency: normalizedCurrency,
    providerCurrency: isPaymobEgp ? 'EGP' : isLegacyPayPalEgp ? 'USD' : normalizedCurrency,
    supported: true,
    enabled: configuration.configured,
    mode: isLegacyPayPalEgp
      ? PROVIDER_CAPABILITY_MODES.LEGACY_CONVERTED
      : PROVIDER_CAPABILITY_MODES.DIRECT,
    verificationStatus: PROVIDER_VERIFICATION_STATUSES.CURRENTLY_IMPLEMENTED,
    externalAccountVerificationRequired: false,
    reason: configuration.configured ? null : 'CONFIGURATION_REQUIRED',
    configuration,
  };
};

export const canProviderProcess = (query) => getProviderCapability(query).enabled;

export const getAvailableProviders = ({ purpose, transactionCurrency } = {}) => (
  Object.values(PROVIDERS)
    .map((provider) => getProviderCapability({ provider, purpose, transactionCurrency }))
    .filter((capability) => capability.enabled)
);

export default {
  PROVIDERS,
  PROVIDER_CAPABILITY_MODES,
  PROVIDER_VERIFICATION_STATUSES,
  getProviderCapability,
  canProviderProcess,
  getAvailableProviders,
};
