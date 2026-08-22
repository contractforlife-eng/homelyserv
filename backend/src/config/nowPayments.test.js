import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNowPaymentsConfig,
  isNowPaymentsConfigured,
  isNowPaymentsCountryAllowed,
} from './nowPayments.js';
import { getProviderCapability } from './providerCapabilities.js';
import {
  createNowPaymentsPayment,
  NOWPAYMENTS_NOT_IMPLEMENTED,
} from '../services/nowPaymentsService.js';

const NOW_ENV_KEYS = [
  'NOWPAYMENTS_ENABLED',
  'NOWPAYMENTS_API_KEY',
  'NOWPAYMENTS_IPN_SECRET',
  'NOWPAYMENTS_API_BASE_URL',
  'NOWPAYMENTS_ALLOWED_COUNTRIES',
  'NOWPAYMENTS_DENIED_COUNTRIES',
];

const originalEnv = Object.fromEntries(NOW_ENV_KEYS.map((key) => [key, process.env[key]]));

const restoreNowPaymentsEnv = () => {
  for (const key of NOW_ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
};

const configureNowPayments = () => {
  process.env.NOWPAYMENTS_ENABLED = 'true';
  process.env.NOWPAYMENTS_API_KEY = 'server-api-key';
  process.env.NOWPAYMENTS_IPN_SECRET = 'server-ipn-secret';
  process.env.NOWPAYMENTS_API_BASE_URL = 'https://api.nowpayments.io/v1';
  process.env.NOWPAYMENTS_ALLOWED_COUNTRIES = 'US,FR,GB';
  delete process.env.NOWPAYMENTS_DENIED_COUNTRIES;
};

test.afterEach(restoreNowPaymentsEnv);

test('Egypt is denied even when NOWPayments is enabled and configured', () => {
  configureNowPayments();
  const capability = getProviderCapability({
    provider: 'nowpayments',
    purpose: 'SUBSCRIPTION',
    transactionCurrency: 'USD',
    countryCode: 'EG',
  });

  assert.equal(isNowPaymentsCountryAllowed('EG'), false);
  assert.equal(capability.enabled, false);
  assert.equal(capability.reason, 'COUNTRY_NOT_ALLOWED');
});

test('missing or invalid country fails closed', () => {
  configureNowPayments();
  for (const countryCode of [undefined, '', 'not-a-country']) {
    const capability = getProviderCapability({
      provider: 'nowpayments',
      purpose: 'COMMISSION',
      transactionCurrency: 'USD',
      countryCode,
    });
    assert.equal(capability.enabled, false);
    assert.equal(capability.reason, 'COUNTRY_NOT_ALLOWED');
  }
});

test('configured allowed non-Egypt country exposes capability without creating a payment', async () => {
  configureNowPayments();
  const capability = getProviderCapability({
    provider: 'nowpayments',
    purpose: 'COMMISSION',
    transactionCurrency: 'USD',
    countryCode: 'US',
  });

  assert.equal(capability.supported, true);
  assert.equal(capability.enabled, true);
  assert.equal(capability.reason, 'PAYMENT_CREATION_NOT_IMPLEMENTED');
  assert.equal(isNowPaymentsConfigured(getNowPaymentsConfig()), true);
  await assert.rejects(createNowPaymentsPayment({}), new RegExp(NOWPAYMENTS_NOT_IMPLEMENTED));
});

test('missing provider configuration fails closed for an allowed country', () => {
  process.env.NOWPAYMENTS_ENABLED = 'true';
  process.env.NOWPAYMENTS_ALLOWED_COUNTRIES = 'US';
  delete process.env.NOWPAYMENTS_API_KEY;
  delete process.env.NOWPAYMENTS_IPN_SECRET;
  delete process.env.NOWPAYMENTS_API_BASE_URL;

  const capability = getProviderCapability({
    provider: 'nowpayments',
    purpose: 'SUBSCRIPTION',
    transactionCurrency: 'USD',
    countryCode: 'US',
  });

  assert.equal(capability.enabled, false);
  assert.equal(capability.reason, 'CONFIGURATION_REQUIRED');
});

test('the service boundary never exposes secrets or calls NOWPayments in Phase 1', async () => {
  configureNowPayments();
  const { getNowPaymentsServiceConfig } = await import('../services/nowPaymentsService.js');
  const serviceConfig = getNowPaymentsServiceConfig();

  assert.equal(serviceConfig.provider, 'nowpayments');
  assert.equal(serviceConfig.enabled, true);
  assert.equal(Object.hasOwn(serviceConfig, 'apiKey'), false);
  assert.equal(Object.hasOwn(serviceConfig, 'ipnSecret'), false);
});
