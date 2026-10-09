import test from 'node:test';
import assert from 'node:assert/strict';
import { getCoursePaymentMethods } from './coursePaymentMethods.js';

test('advertises PayPal and manual methods for EGP courses when backend returns paypal provider', () => {
  const methods = getCoursePaymentMethods({
    currency: 'EGP',
    backendProviders: [{ provider: 'paypal', mode: 'DIRECT', providerCurrency: 'USD' }],
  });
  const ids = methods.map((m) => m.id);
  assert.deepEqual(ids, ['paypal', 'vodafone_cash', 'instapay']);
});

test('hides manual methods for non-EGP currencies (e.g. USD)', () => {
  const methods = getCoursePaymentMethods({
    currency: 'USD',
    backendProviders: [{ provider: 'paypal', mode: 'DIRECT', providerCurrency: 'USD' }],
  });
  const ids = methods.map((m) => m.id);
  assert.deepEqual(ids, ['paypal']);
});

test('hides PayPal if backend does not advertise paypal capability', () => {
  const methods = getCoursePaymentMethods({
    currency: 'EGP',
    backendProviders: [],
  });
  const ids = methods.map((m) => m.id);
  assert.deepEqual(ids, ['vodafone_cash', 'instapay']);
});

test('returns empty list if currency is non-EGP and backend has no available providers', () => {
  const methods = getCoursePaymentMethods({
    currency: 'EUR',
    backendProviders: [],
  });
  assert.deepEqual(methods, []);
});

test('handles raw string array for backendProviders', () => {
  const methods = getCoursePaymentMethods({
    currency: 'USD',
    backendProviders: ['paypal'],
  });
  assert.deepEqual(methods.map((m) => m.id), ['paypal']);
});
