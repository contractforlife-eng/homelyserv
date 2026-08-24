import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BANK_TRANSFER_FX_CACHE_TTL_MS,
  BANK_TRANSFER_FX_ERROR_CODES,
  clearBankTransferFxCache,
  getBankTransferFxCapability,
  resolveBankTransferUsdSettlement,
  BankTransferFxError,
} from './bankTransferFxService.js';
import { resolveSubscriptionPriceBook } from '../config/subscriptionPriceBooks.js';

const NOW = Date.parse('2026-08-24T12:00:00.000Z');
const quote = (currency, rate, effectiveAt = '2026-08-21') => ({
  base: currency,
  quote: 'USD',
  rate,
  effectiveAt,
  fetchedAt: new Date(NOW).toISOString(),
  source: 'Frankfurter',
  version: 'v2',
});

const provider = (rates, calls = []) => async (currency) => {
  calls.push(currency);
  const rate = rates[currency];
  if (!rate) throw new BankTransferFxError('PROVIDER_UNAVAILABLE', 'mock unavailable');
  return quote(currency, rate);
};

test.beforeEach(() => clearBankTransferFxCache());

test('USD uses local identity without calling Frankfurter', async () => {
  let calls = 0;
  const result = await resolveBankTransferUsdSettlement({
    canonicalAmount: '14.99',
    canonicalCurrency: 'USD',
    now: NOW,
    quoteProvider: async () => { calls += 1; return quote('USD', '1'); },
  });
  assert.equal(result.settlementAmount, '14.99');
  assert.equal(result.exchangeRate, '1');
  assert.equal(result.rateDirection, 'SOURCE_TO_USD');
  assert.equal(result.exchangeRateSource, 'identity');
  assert.equal(calls, 0);
});

test('generic canonical currencies convert through Frankfurter', async () => {
  const calls = [];
  const rates = {
    EGP: '0.033', EUR: '1.10', GBP: '1.28', TRY: '0.025', RUB: '0.011',
    AED: '0.272', SAR: '0.267', JPY: '0.0068', NGN: '0.0007', KES: '0.0075',
  };
  assert.equal((await resolveBankTransferUsdSettlement({ canonicalAmount: '300', canonicalCurrency: 'EGP', now: NOW, quoteProvider: provider(rates, calls) })).settlementAmount, '9.90');
  assert.equal((await resolveBankTransferUsdSettlement({ canonicalAmount: '12.99', canonicalCurrency: 'EUR', now: NOW, quoteProvider: provider(rates, calls) })).settlementAmount, '14.29');
  assert.equal((await resolveBankTransferUsdSettlement({ canonicalAmount: '4.99', canonicalCurrency: 'GBP', now: NOW, quoteProvider: provider(rates, calls) })).settlementAmount, '6.39');
  assert.equal((await resolveBankTransferUsdSettlement({ canonicalAmount: '249', canonicalCurrency: 'TRY', now: NOW, quoteProvider: provider(rates, calls) })).settlementAmount, '6.23');
  assert.equal((await resolveBankTransferUsdSettlement({ canonicalAmount: '100', canonicalCurrency: 'RUB', now: NOW, quoteProvider: provider(rates, calls) })).settlementAmount, '1.10');
  assert.equal((await resolveBankTransferUsdSettlement({ canonicalAmount: '100', canonicalCurrency: 'AED', now: NOW, quoteProvider: provider(rates, calls) })).settlementAmount, '27.20');
  assert.equal((await resolveBankTransferUsdSettlement({ canonicalAmount: '1000', canonicalCurrency: 'JPY', now: NOW, quoteProvider: provider(rates, calls) })).canonicalAmount, '1000');
  assert.equal((await resolveBankTransferUsdSettlement({ canonicalAmount: '1000', canonicalCurrency: 'NGN', now: NOW, quoteProvider: provider(rates, calls) })).settlementAmount, '0.70');
  assert.equal((await resolveBankTransferUsdSettlement({ canonicalAmount: '1000', canonicalCurrency: 'KES', now: NOW, quoteProvider: provider(rates, calls) })).settlementAmount, '7.50');
  assert.ok(calls.includes('RUB') && calls.includes('AED') && calls.includes('JPY'));
});

test('three-decimal source currencies normalize safely', async () => {
  const rates = { KWD: '3.25', BHD: '2.65' };
  const kwd = await resolveBankTransferUsdSettlement({ canonicalAmount: '1.2345', canonicalCurrency: 'KWD', now: NOW, quoteProvider: provider(rates) });
  const bhd = await resolveBankTransferUsdSettlement({ canonicalAmount: '1.2345', canonicalCurrency: 'BHD', now: NOW, quoteProvider: provider(rates) });
  assert.equal(kwd.canonicalAmount, '1.235');
  assert.equal(bhd.canonicalAmount, '1.235');
});

test('noncanonical currency fails closed', async () => {
  await assert.rejects(
    resolveBankTransferUsdSettlement({ canonicalAmount: '10', canonicalCurrency: 'ZZZ', now: NOW, quoteProvider: provider({}) }),
    (error) => error.code === BANK_TRANSFER_FX_ERROR_CODES.UNSUPPORTED_CURRENCY,
  );
});

test('provider timeout, HTTP failure, malformed, zero, and negative rates fail closed', async () => {
  for (const error of [
    new BankTransferFxError('PROVIDER_TIMEOUT', 'timeout'),
    new BankTransferFxError('PROVIDER_HTTP_ERROR', 'http'),
  ]) {
    await assert.rejects(
      resolveBankTransferUsdSettlement({ canonicalAmount: '10', canonicalCurrency: 'EUR', now: NOW, quoteProvider: async () => { throw error; } }),
      (received) => received.code === error.code,
    );
  }
  for (const rate of ['not-a-rate', '0', '-1']) {
    await assert.rejects(
      resolveBankTransferUsdSettlement({ canonicalAmount: '10', canonicalCurrency: 'EUR', now: NOW, quoteProvider: async () => quote('EUR', rate) }),
      (error) => error.code === 'INVALID_PROVIDER_QUOTE',
    );
  }
});

test('stale rates fail while a Friday rate remains valid on Monday', async () => {
  await assert.rejects(
    resolveBankTransferUsdSettlement({ canonicalAmount: '10', canonicalCurrency: 'EUR', now: NOW, quoteProvider: async () => quote('EUR', '1.1', '2026-08-17') }),
    (error) => error.code === 'STALE_PROVIDER_QUOTE',
  );
  const result = await resolveBankTransferUsdSettlement({
    canonicalAmount: '10',
    canonicalCurrency: 'EUR',
    now: NOW,
    quoteProvider: async () => quote('EUR', '1.1', '2026-08-21'),
  });
  assert.equal(result.exchangeRateTimestamp, '2026-08-21T00:00:00.000Z');
});

test('validated quotes are cached and refreshed after TTL', async () => {
  let calls = 0;
  const quoteProvider = async () => { calls += 1; return quote('EUR', '1.1'); };
  await resolveBankTransferUsdSettlement({ canonicalAmount: '10', canonicalCurrency: 'EUR', now: NOW, quoteProvider });
  await resolveBankTransferUsdSettlement({ canonicalAmount: '11', canonicalCurrency: 'EUR', now: NOW + 1000, quoteProvider });
  assert.equal(calls, 1);
  await resolveBankTransferUsdSettlement({ canonicalAmount: '12', canonicalCurrency: 'EUR', now: NOW + BANK_TRANSFER_FX_CACHE_TTL_MS + 1, quoteProvider });
  assert.equal(calls, 2);
});

test('capability is available only with a valid quote', async () => {
  assert.equal((await getBankTransferFxCapability({ canonicalCurrency: 'USD', now: NOW, quoteProvider: async () => { throw new Error('must not call'); } })).available, true);
  assert.equal((await getBankTransferFxCapability({ canonicalCurrency: 'EUR', now: NOW, quoteProvider: async () => quote('EUR', '1.1') })).available, true);
  clearBankTransferFxCache();
  assert.equal((await getBankTransferFxCapability({ canonicalCurrency: 'EUR', now: NOW, quoteProvider: async () => quote('EUR', '0') })).available, false);
  clearBankTransferFxCache();
  assert.equal((await getBankTransferFxCapability({ canonicalCurrency: 'EUR', now: NOW, quoteProvider: async () => { throw new Error('unavailable'); } })).available, false);
});

test('FX evidence contains auditable provider metadata and preserves formula semantics', async () => {
  const result = await resolveBankTransferUsdSettlement({ canonicalAmount: '60', canonicalCurrency: 'EGP', now: NOW, quoteProvider: async () => quote('EGP', '0.033') });
  assert.deepEqual({
    sourceCurrency: result.canonicalCurrency,
    settlementCurrency: result.settlementCurrency,
    sourceAmount: result.canonicalAmount,
    exchangeRate: result.exchangeRate,
    rateDirection: result.rateDirection,
    source: result.exchangeRateSource,
    effectiveAt: result.exchangeRateTimestamp,
    fetchedAt: result.exchangeRateFetchedAt,
    settlementAmount: result.settlementAmount,
  }, {
    sourceCurrency: 'EGP',
    settlementCurrency: 'USD',
    sourceAmount: '60.00',
    exchangeRate: '0.033',
    rateDirection: 'SOURCE_TO_USD',
    source: 'Frankfurter',
    effectiveAt: '2026-08-21T00:00:00.000Z',
    fetchedAt: new Date(NOW).toISOString(),
    settlementAmount: '1.98',
  });
});

test('Premium pricebook source amount and currency remain unchanged before USD settlement', async () => {
  const pricebook = resolveSubscriptionPriceBook({
    user: { role: 'WORKER', countryCode: 'DE' },
    plan: 'monthly',
  });
  const settlement = await resolveBankTransferUsdSettlement({
    canonicalAmount: pricebook.amount,
    canonicalCurrency: pricebook.currency,
    now: NOW,
    quoteProvider: async () => quote('EUR', '1.10'),
  });

  assert.equal(pricebook.amount, 8.99);
  assert.equal(pricebook.currency, 'EUR');
  assert.equal(settlement.canonicalAmount, '8.99');
  assert.equal(settlement.canonicalCurrency, 'EUR');
  assert.equal(settlement.settlementCurrency, 'USD');
  assert.equal(settlement.settlementAmount, '9.89');
});

test('Commission Hire totalDue and compensationCurrency remain unchanged before USD settlement', async () => {
  const hire = { totalDue: '60', compensationCurrency: 'EGP' };
  const settlement = await resolveBankTransferUsdSettlement({
    canonicalAmount: hire.totalDue,
    canonicalCurrency: hire.compensationCurrency,
    now: NOW,
    quoteProvider: async () => quote('EGP', '0.033'),
  });

  assert.equal(hire.totalDue, '60');
  assert.equal(hire.compensationCurrency, 'EGP');
  assert.equal(settlement.canonicalAmount, '60.00');
  assert.equal(settlement.canonicalCurrency, 'EGP');
  assert.equal(settlement.settlementCurrency, 'USD');
  assert.equal(settlement.settlementAmount, '1.98');
});
