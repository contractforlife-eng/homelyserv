import test from 'node:test';
import assert from 'node:assert/strict';
import translations from './marketplaceTranslations.js';

test('marketplace UI and validation keys exist in all six supported languages', () => {
  const locales = ['en', 'ar', 'fr', 'ru', 'tr', 'de'];
  const uiKeys = Object.keys(translations.en).filter((key) => key !== 'validation');
  const validationKeys = Object.keys(translations.en.validation);

  for (const locale of locales) {
    assert.ok(translations[locale], `missing ${locale} marketplace translations`);
    for (const key of uiKeys) assert.ok(String(translations[locale][key] || '').trim(), `missing ${locale}.${key}`);
    for (const key of validationKeys) assert.ok(String(translations[locale].validation?.[key] || '').trim(), `missing ${locale}.validation.${key}`);
  }
});
