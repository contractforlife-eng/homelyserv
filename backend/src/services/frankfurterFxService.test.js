import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchFrankfurterQuote, validateFrankfurterQuote } from './frankfurterFxService.js';

const now = Date.parse('2026-08-24T12:00:00.000Z');

test('Frankfurter client validates HTTPS response and returns decimal evidence', async () => {
  let requestedUrl;
  const result = await fetchFrankfurterQuote('EUR', {
    now,
    fetchImpl: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        json: async () => ({ base: 'EUR', quote: 'USD', rate: 1.1, date: '2026-08-21' }),
      };
    },
  });
  assert.equal(requestedUrl, 'https://api.frankfurter.dev/v2/rate/EUR/USD');
  assert.equal(result.rate, '1.1');
  assert.equal(result.effectiveAt, '2026-08-21T00:00:00.000Z');
  assert.equal(result.source, 'Frankfurter');
  assert.equal(result.version, 'v2');
});

test('Frankfurter client rejects insecure endpoints and malformed HTTP responses', async () => {
  await assert.rejects(
    fetchFrankfurterQuote('EUR', { baseUrl: 'http://localhost', fetchImpl: async () => ({ ok: true, json: async () => ({}) }) }),
    (error) => error.code === 'INSECURE_PROVIDER_URL',
  );
  await assert.rejects(
    fetchFrankfurterQuote('EUR', { fetchImpl: async () => ({ ok: false, json: async () => ({}) }) }),
    (error) => error.code === 'PROVIDER_HTTP_ERROR',
  );
  await assert.rejects(
    fetchFrankfurterQuote('EUR', { fetchImpl: async () => ({ ok: true, json: async () => ({ base: 'GBP', quote: 'USD', rate: 1.1, date: '2026-08-21' }) }) }),
    (error) => error.code === 'INVALID_PROVIDER_QUOTE',
  );
});

test('Frankfurter timeout is converted to a safe provider error', async () => {
  await assert.rejects(
    fetchFrankfurterQuote('EUR', {
      timeoutMs: 1,
      fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      }),
    }),
    (error) => error.code === 'PROVIDER_TIMEOUT',
  );
});

test('scientific-notation provider rates normalize without money arithmetic', () => {
  const result = validateFrankfurterQuote({
    sourceCurrency: 'VND',
    now,
    quote: { base: 'VND', quote: 'USD', rate: 3.8e-5, effectiveAt: '2026-08-21' },
  });
  assert.equal(result.rate, '0.000038');
});
