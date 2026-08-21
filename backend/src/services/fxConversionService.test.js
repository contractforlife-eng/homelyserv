import assert from 'node:assert/strict';
import test from 'node:test';
import {
  convertTryToUsd,
  FX_ERROR_CODES,
  FxConversionError,
} from './fxConversionService.js';
import { getTryUsdRateConfig } from '../config/fxRates.js';

const TEST_RATE = Object.freeze({
  baseCurrency: 'TRY',
  quoteCurrency: 'USD',
  rate: '0.025',
  rateDirection: 'TRY_TO_USD',
  rateVersion: 'TEST-TRY-USD-v1',
  effectiveAt: '2026-08-20T00:00:00.000Z',
  source: 'TEST_FIXTURE_ONLY',
});

const convert = (bookAmount, overrides = {}) => convertTryToUsd({
  bookAmount,
  config: { ...TEST_RATE, ...overrides },
  now: Date.parse('2026-08-21T00:00:00.000Z'),
});

test('repository configuration has no active production TRY/USD rate by default', () => {
  const config = getTryUsdRateConfig({});
  assert.equal(config.rate, null);
  assert.equal(config.rateVersion, null);
  assert.equal(config.effectiveAt, null);
  assert.equal(config.source, null);
  assert.equal(config.rateDirection, 'TRY_TO_USD');
});

test('converts all approved Turkey book amounts with deterministic USD rounding', () => {
  assert.equal(convert(69).providerAmount, '1.73');
  assert.equal(convert(169).providerAmount, '4.23');
  assert.equal(convert(1399).providerAmount, '34.98');
  assert.equal(convert(99).providerAmount, '2.48');
  assert.equal(convert(249).providerAmount, '6.23');
  assert.equal(convert(1999).providerAmount, '49.98');
});

test('returns an immutable TRY/USD evidence snapshot', () => {
  const result = convert(249);
  assert.deepEqual(result, {
    bookAmount: '249.00',
    bookCurrency: 'TRY',
    providerAmount: '6.23',
    providerCurrency: 'USD',
    exchangeRate: '0.025',
    rateDirection: 'TRY_TO_USD',
    exchangeRateSource: 'TEST_FIXTURE_ONLY',
    exchangeRateVersion: 'TEST-TRY-USD-v1',
    exchangeRateTimestamp: '2026-08-20T00:00:00.000Z',
  });
  assert.equal(Object.isFrozen(result), true);
});

test('uses decimal-safe half-up rounding at USD minor units', () => {
  assert.equal(convert('100.00', { rate: '0.02505' }).providerAmount, '2.51');
  assert.equal(convert('100.00', { rate: '0.02495' }).providerAmount, '2.50');
});

test('rejects invalid rate configuration', () => {
  const invalid = [
    { rate: undefined },
    { rate: '' },
    { rate: '0' },
    { rate: '-0.025' },
    { rate: 'NaN' },
    { rate: '0.02x' },
    { rateDirection: 'USD_TO_TRY' },
    { baseCurrency: 'USD' },
    { quoteCurrency: 'TRY' },
    { rateVersion: '' },
    { source: '' },
    { effectiveAt: 'not-a-date' },
    { effectiveAt: '2026-08-22T00:00:00.000Z' },
  ];
  for (const overrides of invalid) {
    assert.throws(() => convert(99, overrides), (error) => (
      error instanceof FxConversionError && error.code === FX_ERROR_CODES.INVALID_CONFIGURATION
    ));
  }
});

test('rejects malformed or non-positive book amounts', () => {
  for (const amount of [undefined, '', 'NaN', '-1', '0', Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => convert(amount), (error) => (
      error instanceof FxConversionError && error.code === FX_ERROR_CODES.INVALID_BOOK_AMOUNT
    ));
  }
});

test('supports configurable freshness validation and fails stale rates closed', () => {
  assert.equal(convert(99, { maxAgeSeconds: '90000' }).providerAmount, '2.48');
  assert.throws(() => convert(99, { maxAgeSeconds: '3600' }), (error) => (
    error instanceof FxConversionError && error.code === FX_ERROR_CODES.STALE_RATE
  ));
  assert.throws(() => convert(99, { maxAgeSeconds: '0' }), (error) => (
    error instanceof FxConversionError && error.code === FX_ERROR_CODES.INVALID_CONFIGURATION
  ));
});

test('fails closed when converted amount is below the existing USD minimum', () => {
  assert.throws(() => convert(69, { rate: '0.001' }), (error) => (
    error instanceof FxConversionError && error.code === FX_ERROR_CODES.RATE_TOO_LOW
  ));
});
