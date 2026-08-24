import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearPayPalFxCache,
  getPayPalFxCapability,
  PAYPAL_FX_CACHE_TTL_MS,
  resolvePayPalProviderEvidence,
} from './paypalFxService.js';

const NOW = Date.parse('2026-08-24T12:00:00.000Z');

const quote = (base, rate = '0.033', date = '2026-08-21') => ({
  base,
  quote: 'USD',
  rate,
  effectiveAt: new Date(`${date}T00:00:00.000Z`).toISOString(),
  source: 'Frankfurter',
  version: 'v2',
  fetchedAt: new Date(NOW).toISOString(),
});

test.beforeEach(() => clearPayPalFxCache());

test('USD, EUR, GBP, and JPY native PayPal currencies bypass FX', async () => {
  let calls = 0;
  const quoteProvider = async () => { calls += 1; throw new Error('native PayPal must not call FX'); };
  for (const [currency, amount] of [['USD', '8.99'], ['EUR', '8.99'], ['GBP', '7.99'], ['JPY', '1000']]) {
    const result = await resolvePayPalProviderEvidence({ sourceAmount: amount, sourceCurrency: currency, now: NOW, quoteProvider });
    assert.equal(result.providerAmount, amount);
    assert.equal(result.providerCurrency, currency);
    assert.equal(result.mode, 'DIRECT');
    assert.equal(result.fxEvidence, null);
  }
  assert.equal(calls, 0);
});

test('non-native EGP, NGN, and AED use validated USD fallback', async () => {
  const rates = { EGP: '0.033', NGN: '0.0007', AED: '0.272' };
  const result = {};
  for (const currency of Object.keys(rates)) {
    result[currency] = await resolvePayPalProviderEvidence({
      sourceAmount: currency === 'EGP' ? '60' : '100',
      sourceCurrency: currency,
      now: NOW,
      quoteProvider: async (source) => quote(source, rates[source]),
    });
  }
  assert.equal(result.EGP.providerAmount, '1.98');
  assert.equal(result.NGN.providerAmount, '0.07');
  assert.equal(result.AED.providerAmount, '27.20');
  assert.equal(result.EGP.providerCurrency, 'USD');
  assert.equal(result.NGN.fxEvidence.sourceCurrency, 'NGN');
});

test('three-decimal source amounts and zero-minor source currencies remain safe', async () => {
  const quoteProvider = async (source) => quote(source, source === 'KWD' ? '3.25' : '1.1');
  const kwd = await resolvePayPalProviderEvidence({ sourceAmount: '1.2345', sourceCurrency: 'KWD', now: NOW, quoteProvider });
  const bhd = await resolvePayPalProviderEvidence({ sourceAmount: '1.2345', sourceCurrency: 'BHD', now: NOW, quoteProvider });
  const vnd = await resolvePayPalProviderEvidence({ sourceAmount: '1000', sourceCurrency: 'VND', now: NOW, quoteProvider });
  assert.equal(kwd.fxEvidence.sourceAmount, '1.235');
  assert.equal(bhd.fxEvidence.sourceAmount, '1.235');
  assert.equal(vnd.fxEvidence.sourceAmount, '1000');
  assert.match(kwd.providerAmount, /^\d+\.\d{2}$/);
});

test('invalid, stale, and unavailable fallback quotes fail closed', async () => {
  const cases = [
    async () => { throw new Error('timeout'); },
    async (source) => quote(source, 'not-a-rate'),
    async (source) => quote(source, '0'),
    async (source) => quote(source, '-1'),
    async (source) => quote(source, '0.033', '2026-08-17'),
  ];
  for (const quoteProvider of cases) {
    await assert.rejects(
      resolvePayPalProviderEvidence({ sourceAmount: '60', sourceCurrency: 'EGP', now: NOW, quoteProvider }),
    );
  }
});

test('PayPal capability is unavailable when fallback FX is unavailable but native capability remains available', async () => {
  const unavailable = await getPayPalFxCapability({
    currency: 'EGP',
    configured: true,
    now: NOW,
    quoteProvider: async () => { throw new Error('provider unavailable'); },
  });
  const native = await getPayPalFxCapability({
    currency: 'EUR',
    configured: true,
    now: NOW,
    quoteProvider: async () => { throw new Error('native PayPal must not call FX'); },
  });
  assert.equal(unavailable.available, false);
  assert.equal(native.available, true);
  assert.equal(native.providerCurrency, 'EUR');
});

test('valid fallback evidence contains source and provider settlement metadata', async () => {
  const result = await resolvePayPalProviderEvidence({
    sourceAmount: '60',
    sourceCurrency: 'EGP',
    now: NOW,
    quoteProvider: async (source) => quote(source, '0.033'),
  });
  assert.deepEqual(result.fxEvidence, {
    sourceCurrency: 'EGP',
    sourceAmount: '60.00',
    settlementCurrency: 'USD',
    settlementAmount: '1.98',
    exchangeRate: '0.033',
    rateDirection: 'SOURCE_TO_USD',
    exchangeRateSource: 'Frankfurter',
    exchangeRateVersion: 'v2',
    exchangeRateTimestamp: '2026-08-21T00:00:00.000Z',
    exchangeRateFetchedAt: '2026-08-24T12:00:00.000Z',
    exchangeRateProvider: 'Frankfurter',
  });
});

test('fallback quote cache avoids duplicate requests and refreshes after expiry', async () => {
  let calls = 0;
  const quoteProvider = async (source) => {
    calls += 1;
    return quote(source, '0.033');
  };
  await resolvePayPalProviderEvidence({ sourceAmount: '60', sourceCurrency: 'EGP', now: NOW, quoteProvider });
  await resolvePayPalProviderEvidence({ sourceAmount: '61', sourceCurrency: 'EGP', now: NOW + 1000, quoteProvider });
  await resolvePayPalProviderEvidence({ sourceAmount: '62', sourceCurrency: 'EGP', now: NOW + PAYPAL_FX_CACHE_TTL_MS + 1, quoteProvider });
  assert.equal(calls, 2);
});
