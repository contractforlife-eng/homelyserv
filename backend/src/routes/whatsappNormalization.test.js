import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWhatsAppNumber, validateMarketplaceFields } from './marketplace.js';

test('WhatsApp normalization with actual examples', () => {
  // 1. Egypt local 01012345678 with country EG -> +201012345678
  assert.equal(normalizeWhatsAppNumber('01012345678', 'EG'), '+201012345678');
  assert.equal(normalizeWhatsAppNumber('01112345678', 'EG'), '+201012345678'.replace('010', '011'));
  assert.equal(normalizeWhatsAppNumber('01212345678', 'EG'), '+201212345678');
  assert.equal(normalizeWhatsAppNumber('01512345678', 'EG'), '+201512345678');

  // 2. International +201012345678 remains unchanged
  assert.equal(normalizeWhatsAppNumber('+201012345678', 'EG'), '+201012345678');
  assert.equal(normalizeWhatsAppNumber('+201012345678', 'US'), '+201012345678');
  assert.equal(normalizeWhatsAppNumber('+12025550198', 'EG'), '+12025550198');

  // 3. International with 00 prefix (e.g. 00201012345678 -> +201012345678)
  assert.equal(normalizeWhatsAppNumber('00201012345678', 'EG'), '+201012345678');

  // 4. Saudi Arabia local 0501234567 with SA -> +966501234567
  assert.equal(normalizeWhatsAppNumber('0501234567', 'SA'), '+966501234567');

  // 5. United States local without country calling code:
  // Must NOT merely prepend + to a raw local number!
  assert.equal(normalizeWhatsAppNumber('01012345678', null), false);
  assert.equal(normalizeWhatsAppNumber('01012345678', ''), false);

  // 6. Validation in validateMarketplaceFields:
  // Accepts local number with country context
  const validLocal = validateMarketplaceFields({
    title: 'Samsung 4K Monitor',
    description: '32 inch 4K monitor in excellent working condition.',
    price: '300',
    currency: 'EGP',
    country: 'EG',
    region: 'Cairo',
    city: 'Nasr City',
    locationDescription: 'Near Abbas El Akkad',
    phone: '01012345678',
    whatsapp: '01012345678'
  });
  assert.equal(validLocal.code, undefined);
  assert.equal(validLocal.data.whatsapp, '+201012345678');

  // Rejects invalid whatsapp numbers
  const invalidWhatsApp = validateMarketplaceFields({
    title: 'Samsung 4K Monitor',
    description: '32 inch 4K monitor in excellent working condition.',
    price: '300',
    currency: 'EGP',
    country: 'EG',
    region: 'Cairo',
    city: 'Nasr City',
    locationDescription: 'Near Abbas El Akkad',
    phone: '01012345678',
    whatsapp: 'abc-not-number'
  });
  assert.equal(invalidWhatsApp.code, 'INVALID_WHATSAPP');
});
