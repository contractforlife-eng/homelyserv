import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getProviderCapability,
  PROVIDER_CAPABILITY_MODES,
} from './providerCapabilities.js';

const originalEnv = {
  paypalClientId: process.env.PAYPAL_CLIENT_ID,
  paypalSecret: process.env.PAYPAL_SECRET,
};

const withPayPalConfigured = () => {
  process.env.PAYPAL_CLIENT_ID = 'test-client-id';
  process.env.PAYPAL_SECRET = 'test-secret';
};

test.afterEach(() => {
  if (originalEnv.paypalClientId === undefined) delete process.env.PAYPAL_CLIENT_ID;
  else process.env.PAYPAL_CLIENT_ID = originalEnv.paypalClientId;
  if (originalEnv.paypalSecret === undefined) delete process.env.PAYPAL_SECRET;
  else process.env.PAYPAL_SECRET = originalEnv.paypalSecret;
});

test('configured PayPal supports EGP commission through the existing USD conversion mode', () => {
  withPayPalConfigured();
  const capability = getProviderCapability({
    provider: 'paypal',
    purpose: 'COMMISSION',
    transactionCurrency: 'EGP',
  });

  assert.equal(capability.enabled, true);
  assert.equal(capability.providerCurrency, 'USD');
  assert.equal(capability.mode, PROVIDER_CAPABILITY_MODES.LEGACY_CONVERTED);
});

test('configured PayPal keeps EGP subscription capability unchanged', () => {
  withPayPalConfigured();
  const capability = getProviderCapability({
    provider: 'paypal',
    purpose: 'SUBSCRIPTION',
    transactionCurrency: 'EGP',
  });

  assert.equal(capability.enabled, true);
  assert.equal(capability.providerCurrency, 'USD');
  assert.equal(capability.mode, PROVIDER_CAPABILITY_MODES.LEGACY_CONVERTED);
});

test('unconfigured PayPal remains unavailable instead of advertising a guaranteed-broken checkout', () => {
  delete process.env.PAYPAL_CLIENT_ID;
  delete process.env.PAYPAL_SECRET;
  const capability = getProviderCapability({
    provider: 'paypal',
    purpose: 'COMMISSION',
    transactionCurrency: 'EGP',
  });

  assert.equal(capability.supported, true);
  assert.equal(capability.enabled, false);
  assert.equal(capability.reason, 'CONFIGURATION_REQUIRED');
});
