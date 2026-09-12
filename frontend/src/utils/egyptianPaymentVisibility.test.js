import test from 'node:test';
import assert from 'node:assert/strict';
import { canShowEgyptianManualPaymentMethods } from './egyptianPaymentVisibility.js';

test('manual payment methods are visible to all users regardless of countryCode or nationality', () => {
  assert.equal(canShowEgyptianManualPaymentMethods({ countryCode: 'EG' }), true);
  assert.equal(canShowEgyptianManualPaymentMethods({ countryCode: 'eg' }), true);
  assert.equal(canShowEgyptianManualPaymentMethods({ countryCode: ' EG ' }), true);
  for (const countryCode of ['US', 'GB', 'DE', 'FR', 'AE', 'SA']) {
    assert.equal(canShowEgyptianManualPaymentMethods({ countryCode }), true, countryCode);
  }
  assert.equal(canShowEgyptianManualPaymentMethods({}), true);
  assert.equal(canShowEgyptianManualPaymentMethods(null), true);
});
