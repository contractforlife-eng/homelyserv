import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {
  createLanguageDetectRouter,
  resolveLanguageForCountry,
} from './languageDetect.js';

const withServer = async (options, run) => {
  const app = express();
  app.use('/api', createLanguageDetectRouter(options));
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
};

// Simulates a public client IP with a controllable GeoIP result.
const countryServer = (run) => {
  const state = { country: 'EG', ip: '41.33.10.20' };
  return withServer({
    resolveIp: () => state.ip,
    lookup: () => ({ country: state.country }),
  }, (base) => run(base, state));
};

const detect = async (base, query = '', headers = {}) => {
  const res = await fetch(`${base}/api/language-detect${query}`, { headers });
  assert.equal(res.status, 200);
  return res.json();
};

test('approved country → language mapping through the public endpoint', async () => countryServer(async (base, state) => {
  const cases = [
    // Required cases
    ['EG', 'ar'], ['SA', 'ar'], ['FR', 'fr'], ['RU', 'ru'], ['BY', 'ru'],
    ['KZ', 'ru'], ['UA', 'en'], ['DE', 'de'], ['TR', 'tr'],
    ['US', 'en'], ['JP', 'en'], ['XX', 'en'],
    // Additional approved coverage
    ['AE', 'ar'], ['MA', 'ar'], ['MR', 'ar'], ['SO', 'ar'],
    ['AM', 'ru'], ['TJ', 'ru'], ['MC', 'fr'], ['AT', 'de'], ['LI', 'de'],
    ['MD', 'en'], // deliberately not Russian
  ];
  for (const [country, language] of cases) {
    state.country = country;
    const body = await detect(base);
    assert.equal(body.success, true, country);
    assert.equal(body.country, country, country);
    assert.equal(body.language, language, `${country} → ${language}`);
  }
}));

test('Switzerland uses browser language only inside {de, fr} and defaults to German', async () => countryServer(async (base, state) => {
  state.country = 'CH';
  assert.equal((await detect(base, '?browser=de-CH')).language, 'de');
  assert.equal((await detect(base, '?browser=fr-CH')).language, 'fr');
  assert.equal((await detect(base, '?browser=en-US')).language, 'de');
  assert.equal((await detect(base, '?browser=it-IT')).language, 'de');
  assert.equal((await detect(base)).language, 'de'); // no browser hint → default
}));

test('Canada tie-break: French browser → fr, English browser → en, other → fr', async () => countryServer(async (base, state) => {
  state.country = 'CA';
  assert.equal((await detect(base, '?browser=fr-CA')).language, 'fr');
  assert.equal((await detect(base, '?browser=en-CA')).language, 'en');
  assert.equal((await detect(base, '?browser=de-DE')).language, 'fr');
}));

test('Belgium: fr/fr → fr, de/de → de, nl and any other browser → en; Luxembourg unchanged', async () => countryServer(async (base, state) => {
  state.country = 'BE';
  assert.equal((await detect(base, '?browser=fr-BE')).language, 'fr');
  assert.equal((await detect(base, '?browser=fr')).language, 'fr');
  assert.equal((await detect(base, '?browser=de-DE')).language, 'de');
  assert.equal((await detect(base, '?browser=de')).language, 'de');
  assert.equal((await detect(base, '?browser=nl-NL')).language, 'en');
  assert.equal((await detect(base, '?browser=nl')).language, 'en');
  assert.equal((await detect(base, '?browser=en-US')).language, 'en');
  assert.equal((await detect(base, '?browser=ja-JP')).language, 'en');
  state.country = 'LU';
  assert.equal((await detect(base, '?browser=fr-LU')).language, 'fr');
  assert.equal((await detect(base, '?browser=de-DE')).language, 'de');
  assert.equal((await detect(base, '?browser=en-US')).language, 'fr');
}));

test('GeoIP miss returns success with null country and null language', async () => withServer({
  resolveIp: () => '41.33.10.20',
  lookup: () => null,
}, async (base) => {
  const body = await detect(base);
  assert.deepEqual(body, { success: true, country: null, language: null });
}));

test('a GeoIP lookup error is a normal miss, never a 500', async () => withServer({
  resolveIp: () => '41.33.10.20',
  lookup: () => { throw new Error('database unavailable'); },
}, async (base) => {
  const body = await detect(base);
  assert.deepEqual(body, { success: true, country: null, language: null });
}));

test('private or unresolvable IPs short-circuit to null without a lookup', async () => {
  let called = false;
  await withServer({
    resolveIp: () => '127.0.0.1',
    lookup: () => { called = true; return { country: 'EG' }; },
  }, async (base) => {
    assert.deepEqual(await detect(base), { success: true, country: null, language: null });
  });
  assert.equal(called, false);
});

test('response contains only success, country and language (IP never exposed)', async () => countryServer(async (base, state) => {
  state.country = 'EG';
  const body = await detect(base);
  assert.deepEqual(Object.keys(body).sort(), ['country', 'language', 'success']);
}));

test('resolveLanguageForCountry unit contract: unknown country → en, no country → null', () => {
  assert.equal(resolveLanguageForCountry('ZZ', 'fr-FR'), 'en');
  assert.equal(resolveLanguageForCountry('UA', 'ru-RU'), 'en'); // never Russian
  assert.equal(resolveLanguageForCountry(null, 'fr-FR'), null);
  assert.equal(resolveLanguageForCountry(undefined), null);
  assert.equal(resolveLanguageForCountry('eg'), 'ar'); // lowercase normalized
});

test('Accept-Language header is used when no browser query is provided', async () => countryServer(async (base, state) => {
  state.country = 'CH';
  const body = await detect(base, '', { 'accept-language': 'fr-CH,fr;q=0.9' });
  assert.equal(body.language, 'fr');
}));
