import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBankTransferUsdSettlement, getBankTransferFxCapability, BankTransferFxError, BANK_TRANSFER_FX_ERROR_CODES } from './bankTransferFxService.js';

const config = (overrides = {}) => ({
  EGP: { baseCurrency: 'EGP', quoteCurrency: 'USD', rate: '0.033', rateDirection: 'EGP_TO_USD', source: 'TEST', version: 'v1', effectiveAt: '2026-08-20T00:00:00.000Z', maxAgeSeconds: '90000' },
  EUR: { baseCurrency: 'EUR', quoteCurrency: 'USD', rate: '1.10', rateDirection: 'EUR_TO_USD', source: 'TEST', version: 'v1', effectiveAt: '2026-08-20T00:00:00.000Z', maxAgeSeconds: '90000' },
  GBP: { baseCurrency: 'GBP', quoteCurrency: 'USD', rate: '1.28', rateDirection: 'GBP_TO_USD', source: 'TEST', version: 'v1', effectiveAt: '2026-08-20T00:00:00.000Z', maxAgeSeconds: '90000' },
  TRY: { baseCurrency: 'TRY', quoteCurrency: 'USD', rate: '0.025', rateDirection: 'TRY_TO_USD', source: 'TEST', version: 'v1', effectiveAt: '2026-08-20T00:00:00.000Z', maxAgeSeconds: '90000' },
  ...overrides,
});
const now = Date.parse('2026-08-21T00:00:00.000Z');

test('converts supported canonical currencies to USD with decimal rounding', () => {
  assert.equal(resolveBankTransferUsdSettlement({ canonicalAmount: 300, canonicalCurrency: 'EGP', config: config(), now }).settlementAmount, '9.90');
  assert.equal(resolveBankTransferUsdSettlement({ canonicalAmount: 12.99, canonicalCurrency: 'EUR', config: config(), now }).settlementAmount, '14.29');
  assert.equal(resolveBankTransferUsdSettlement({ canonicalAmount: 4.99, canonicalCurrency: 'GBP', config: config(), now }).settlementAmount, '6.39');
  assert.equal(resolveBankTransferUsdSettlement({ canonicalAmount: 249, canonicalCurrency: 'TRY', config: config(), now }).settlementAmount, '6.23');
});

test('USD uses identity conversion without FX configuration', () => {
  const result = resolveBankTransferUsdSettlement({ canonicalAmount: 14.99, canonicalCurrency: 'USD', config: {}, now });
  assert.equal(result.settlementAmount, '14.99');
  assert.equal(result.exchangeRateSource, 'IDENTITY');
});

test('missing, stale, invalid, and unsupported FX fail closed', () => {
  assert.throws(() => resolveBankTransferUsdSettlement({ canonicalAmount: 300, canonicalCurrency: 'EGP', config: {}, now }), (error) => error.code === BANK_TRANSFER_FX_ERROR_CODES.INVALID_CONFIGURATION);
  assert.throws(() => resolveBankTransferUsdSettlement({ canonicalAmount: 300, canonicalCurrency: 'EGP', config: config({ EGP: { ...config().EGP, effectiveAt: '2020-01-01T00:00:00.000Z', maxAgeSeconds: '10' } }), now }), (error) => error.code === BANK_TRANSFER_FX_ERROR_CODES.STALE_RATE);
  assert.throws(() => resolveBankTransferUsdSettlement({ canonicalAmount: 300, canonicalCurrency: 'EGP', config: config({ EGP: { ...config().EGP, rate: '0' } }), now }), (error) => error instanceof BankTransferFxError);
  assert.throws(() => resolveBankTransferUsdSettlement({ canonicalAmount: 300, canonicalCurrency: 'CAD', config: config(), now }), (error) => error.code === BANK_TRANSFER_FX_ERROR_CODES.UNSUPPORTED_CURRENCY);
});

test('FX capability discovery is safe and currency-specific', () => {
  assert.equal(getBankTransferFxCapability({ canonicalCurrency: 'USD', config: {}, now }).available, true);
  assert.equal(getBankTransferFxCapability({ canonicalCurrency: 'EUR', config: config(), now }).available, true);
  assert.equal(getBankTransferFxCapability({ canonicalCurrency: 'EUR', config: {}, now }).available, false);
  assert.equal(getBankTransferFxCapability({ canonicalCurrency: 'EUR', config: config({ EUR: { ...config().EUR, rate: '0' } }), now }).available, false);
  for (const currency of ['GBP', 'TRY', 'EGP']) {
    assert.equal(getBankTransferFxCapability({ canonicalCurrency: currency, config: config(), now }).available, true);
  }
});
