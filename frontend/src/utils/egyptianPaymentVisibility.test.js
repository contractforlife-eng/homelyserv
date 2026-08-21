import test from 'node:test';
import assert from 'node:assert/strict';
import { canShowEgyptianManualPaymentMethods } from './egyptianPaymentVisibility.js';

test('Egypt country codes retain manual payment presentation', () => {
  assert.equal(canShowEgyptianManualPaymentMethods({ countryCode: 'EG' }), true);
  assert.equal(canShowEgyptianManualPaymentMethods({ countryCode: 'eg' }), true);
  assert.equal(canShowEgyptianManualPaymentMethods({ countryCode: ' EG ' }), true);
});

test('explicit non-Egypt country codes hide Egypt-only manual methods', () => {
  for (const countryCode of ['US', 'GB', 'DE', 'FR']) {
    assert.equal(canShowEgyptianManualPaymentMethods({ countryCode }), false, countryCode);
  }
});

test('missing country preserves legacy presentation behavior', () => {
  assert.equal(canShowEgyptianManualPaymentMethods({}), true);
  assert.equal(canShowEgyptianManualPaymentMethods(null), true);
});
