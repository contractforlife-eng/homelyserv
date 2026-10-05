import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LANGUAGE_SOURCE_KEY,
  COUNTRY_CACHE_KEY,
  applyAutomaticLanguage,
  handleCountryResponse,
  resolveLanguageForCountry,
  readCountryCache,
  writeCountryCache,
  startCountryLanguageDetection,
} from './countryLanguage.js';

// Mirrors i18n/index.js LANGUAGE_STORAGE_KEY (single value key app-wide).
const LANGUAGE_STORAGE_KEY = 'homelyserv_language';

const createStorage = (initial = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
  };
};

// Stand-in for the shared i18next instance — records changeLanguage calls.
const createFakeI18n = () => {
  const calls = [];
  return { calls, changeLanguage: (language) => { calls.push(language); } };
};

const deps = (storage, instance) => ({ storage, i18n: instance });

// ------------------------------------------------------------
// 1. RACE PROTECTION — the core invariant of the design.
// ------------------------------------------------------------
test('an in-flight country response cannot overwrite a manual language selection', () => {
  const storage = createStorage({
    [LANGUAGE_STORAGE_KEY]: 'fr',        // user just picked French manually
    [LANGUAGE_SOURCE_KEY]: 'manual',     // written by changeLanguageGlobal()
  });
  const instance = createFakeI18n();
  // The Egypt country request (language "ar") resolves afterwards.
  const applied = handleCountryResponse(
    { success: true, country: 'EG', language: 'ar' },
    deps(storage, instance)
  );
  assert.equal(applied, false);
  assert.equal(storage.getItem(LANGUAGE_STORAGE_KEY), 'fr');
  assert.equal(storage.getItem(LANGUAGE_SOURCE_KEY), 'manual');
  assert.deepEqual(instance.calls, [], 'i18n must not switch after manual choice');
  // Geography cache still refreshes (it is country data, not a preference).
  assert.equal(JSON.parse(storage.getItem(COUNTRY_CACHE_KEY)).country, 'EG');
});

test('a fresh country cache never overrides a manual language at startup', () => {
  const storage = createStorage({
    [LANGUAGE_STORAGE_KEY]: 'fr',
    [LANGUAGE_SOURCE_KEY]: 'manual',
  });
  writeCountryCache('EG', storage, Date.now);
  const instance = createFakeI18n();
  startCountryLanguageDetection({
    storage, i18n: instance, browserLanguage: 'en-US',
    detectCountry: () => {},
  });
  assert.equal(storage.getItem(LANGUAGE_STORAGE_KEY), 'fr');
  assert.deepEqual(instance.calls, []);
});

// ------------------------------------------------------------
// 2. LEGACY STORAGE — existing homelyserv_language without src = AUTO.
// ------------------------------------------------------------
test('legacy value without src is treated as auto and revalidated by country', () => {
  const storage = createStorage({ [LANGUAGE_STORAGE_KEY]: 'en' }); // old detector cache
  const instance = createFakeI18n();
  const applied = handleCountryResponse(
    { success: true, country: 'EG', language: 'ar' },
    deps(storage, instance)
  );
  assert.equal(applied, true);
  assert.equal(storage.getItem(LANGUAGE_STORAGE_KEY), 'ar');
  assert.equal(storage.getItem(LANGUAGE_SOURCE_KEY), 'auto');
  assert.deepEqual(instance.calls, ['ar']);
});

test('auto language follows the country until the user selects manually', () => {
  const storage = createStorage({
    [LANGUAGE_STORAGE_KEY]: 'ar',   // previous visit: Egypt
    [LANGUAGE_SOURCE_KEY]: 'auto',
  });
  const instance = createFakeI18n();
  // Later visit from Germany → auto result updates to German.
  handleCountryResponse({ success: true, country: 'DE', language: 'de' }, deps(storage, instance));
  assert.equal(storage.getItem(LANGUAGE_STORAGE_KEY), 'de');
  assert.equal(storage.getItem(LANGUAGE_SOURCE_KEY), 'auto');
  // User explicitly selects French (what changeLanguageGlobal writes)…
  storage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
  storage.setItem(LANGUAGE_SOURCE_KEY, 'manual');
  // …then a new country response must never take French away.
  const applied = handleCountryResponse({ success: true, country: 'EG', language: 'ar' }, deps(storage, instance));
  assert.equal(applied, false);
  assert.equal(storage.getItem(LANGUAGE_STORAGE_KEY), 'fr');
  assert.equal(storage.getItem(LANGUAGE_SOURCE_KEY), 'manual');
});

// ------------------------------------------------------------
// 3. COUNTRY → LANGUAGE MAPPING parity (required cases).
// ------------------------------------------------------------
test('country mapping parity: required cases and multilingual rules', () => {
  const cases = [
    ['EG', 'en-US', 'ar'], ['SA', 'en-US', 'ar'], ['FR', 'en-US', 'fr'],
    ['RU', 'en-US', 'ru'], ['BY', 'en-US', 'ru'], ['KZ', 'en-US', 'ru'],
    ['UA', 'ru-RU', 'en'], ['DE', 'en-US', 'de'], ['TR', 'en-US', 'tr'],
    ['US', 'en-US', 'en'], ['JP', 'ja-JP', 'en'], ['XX', 'en-US', 'en'],
    ['CH', 'de-CH', 'de'], ['CH', 'fr-CH', 'fr'],
    ['CH', 'en-US', 'de'], ['CH', 'it-IT', 'de'],
    ['CA', 'fr-CA', 'fr'], ['CA', 'en-CA', 'en'], ['CA', 'de-DE', 'fr'],
    ['BE', 'fr-FR', 'fr'], ['BE', 'nl-NL', 'en'], ['BE', 'en-US', 'en'],
    ['LU', 'de-DE', 'de'], ['LU', 'en-US', 'fr'],
    [null, 'en-US', null],
  ];
  for (const [country, browser, expected] of cases) {
    assert.equal(resolveLanguageForCountry(country, browser), expected, `${country}/${browser}`);
  }
});

test('Belgium: fr → fr, de → de, and unsupported browsers (nl, en, other) → en', () => {
  const cases = [
    ['fr-FR', 'fr'], ['fr', 'fr'],
    ['de-DE', 'de'], ['de', 'de'],
    ['nl-NL', 'en'], ['nl', 'en'],
    ['en-US', 'en'],
    ['ja-JP', 'en'], ['xx', 'en'], ['it', 'en'],
    ['', 'en'], [null, 'en'],
  ];
  for (const [browser, expected] of cases) {
    assert.equal(
      resolveLanguageForCountry('BE', browser), expected,
      `BE/${browser === '' ? '(empty)' : browser}`
    );
  }
});

// ------------------------------------------------------------
// 4. COUNTRY CACHE — 7-day TTL, country code only, never an IP.
// ------------------------------------------------------------
test('country cache is fresh for 7 days, expired afterwards, stores country only', () => {
  const storage = createStorage();
  const day = 24 * 60 * 60 * 1000;
  let now = 1_000_000_000;
  writeCountryCache('EG', storage, () => now);
  const stored = JSON.parse(storage.getItem(COUNTRY_CACHE_KEY));
  assert.deepEqual(Object.keys(stored).sort(), ['at', 'country']); // no IP, ever
  assert.equal(readCountryCache(storage, () => now).country, 'EG');
  now += 6 * day;
  assert.equal(readCountryCache(storage, () => now).country, 'EG');
  now += 2 * day; // 8 days total → expired → backend refetch path
  assert.equal(readCountryCache(storage, () => now), null);
  // Corrupt cache entries are ignored, never thrown.
  storage.setItem(COUNTRY_CACHE_KEY, 'not-json');
  assert.equal(readCountryCache(storage, () => now), null);
});

// ------------------------------------------------------------
// 5. STARTUP — cached country applies instantly, refresh runs in
//    background, and startup never throws.
// ------------------------------------------------------------
test('startup applies a fresh cached country instantly, then refreshes in background', () => {
  const storage = createStorage();
  writeCountryCache('EG', storage, Date.now);
  const instance = createFakeI18n();
  let refreshed = false;
  startCountryLanguageDetection({
    storage, i18n: instance, browserLanguage: 'en-US',
    detectCountry: () => { refreshed = true; },
  });
  assert.deepEqual(instance.calls, ['ar']);
  assert.equal(storage.getItem(LANGUAGE_STORAGE_KEY), 'ar');
  assert.equal(storage.getItem(LANGUAGE_SOURCE_KEY), 'auto');
  assert.equal(refreshed, true, 'background refresh must run');
});

test('startup without a cache only runs detection and never throws on failure', () => {
  const storage = createStorage();
  const instance = createFakeI18n();
  assert.doesNotThrow(() => startCountryLanguageDetection({
    storage, i18n: instance,
    detectCountry: () => { throw new Error('offline'); },
  }));
  assert.deepEqual(instance.calls, []);
  assert.equal(storage.getItem(LANGUAGE_SOURCE_KEY), null);
});

// ------------------------------------------------------------
// 6. FALLBACK — failed/absent detection keeps the browser language;
//    unsupported results are never applied.
// ------------------------------------------------------------
test('failed or null detection leaves the existing language untouched', () => {
  const storage = createStorage({ [LANGUAGE_STORAGE_KEY]: 'en' });
  const instance = createFakeI18n();
  for (const data of [null, undefined, { success: false }, { success: true, country: null, language: null }]) {
    assert.equal(handleCountryResponse(data, deps(storage, instance)), false);
  }
  assert.equal(storage.getItem(LANGUAGE_STORAGE_KEY), 'en');
  assert.equal(storage.getItem(LANGUAGE_SOURCE_KEY), null);
  assert.deepEqual(instance.calls, []);
});

test('unsupported or empty automatic results are never applied', () => {
  const storage = createStorage();
  const instance = createFakeI18n();
  for (const bad of [null, undefined, '', 'xx', 'ja']) {
    assert.equal(applyAutomaticLanguage(bad, deps(storage, instance)), false, String(bad));
  }
  assert.equal(storage.getItem(LANGUAGE_STORAGE_KEY), null);
  assert.deepEqual(instance.calls, []);
});

