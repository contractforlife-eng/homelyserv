import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  normalizeWhatsAppNumber,
  validateMarketplaceFields,
  serializeMarketplaceListing,
  resolveMarketplaceSellerSummaries
} from './marketplace.js';
import User from '../models/User.js';
import prisma from '../lib/prisma.js';
import { getPublicVerification } from '../services/profileVerificationService.js';
import { renderMarketplacePreviewHtml } from '../utils/marketplaceSocialPreview.js';

test('normalizeWhatsAppNumber accepts international formats and rejects invalid numbers', () => {
  assert.equal(normalizeWhatsAppNumber(null), null);
  assert.equal(normalizeWhatsAppNumber(undefined), null);
  assert.equal(normalizeWhatsAppNumber(''), null);
  assert.equal(normalizeWhatsAppNumber('   '), null);

  assert.equal(normalizeWhatsAppNumber('+20 100 123 4567'), '+201001234567');
  assert.equal(normalizeWhatsAppNumber('00201001234567'), '+201001234567');
  assert.equal(normalizeWhatsAppNumber('+1 (202) 555-0198'), '+12025550198');
  assert.equal(normalizeWhatsAppNumber('+966 50 123 4567'), '+966501234567');

  assert.equal(normalizeWhatsAppNumber('123'), false); // Too short (< 7 digits)
  assert.equal(normalizeWhatsAppNumber('12345678901234567'), false); // Too long (> 15 digits)
  assert.equal(normalizeWhatsAppNumber('invalid-phone-abc'), false); // Invalid chars
});

test('validateMarketplaceFields handles optional whatsapp, rejects invalid, and accepts valid', () => {
  const baseFields = {
    title: 'Solid Oak Dining Table',
    description: 'Good condition oak table with six chairs included.',
    price: '250',
    currency: 'USD',
    country: 'US',
    region: 'California',
    city: 'San Francisco',
    locationDescription: 'Mission District',
    phone: '+1 415 555 2671'
  };

  // Optional omitted / empty
  const res1 = validateMarketplaceFields({ ...baseFields });
  assert.equal(res1.code, undefined);
  assert.equal(res1.data.whatsapp, null);

  const res2 = validateMarketplaceFields({ ...baseFields, whatsapp: '' });
  assert.equal(res2.code, undefined);
  assert.equal(res2.data.whatsapp, null);

  // Invalid whatsapp
  const res3 = validateMarketplaceFields({ ...baseFields, whatsapp: 'not-a-number' });
  assert.equal(res3.code, 'INVALID_WHATSAPP');

  // Valid whatsapp normalized
  const res4 = validateMarketplaceFields({ ...baseFields, whatsapp: '+1 (415) 555-0199' });
  assert.equal(res4.code, undefined);
  assert.equal(res4.data.whatsapp, '+14155550199');
});

test('seller summary privacy and verification status (premium never implies verified)', async () => {
  const fakeSellerId = '507f1f77bcf86cd799439011';
  const fakeUnverifiedSellerId = '507f1f77bcf86cd799439012';

  const origFind = User.find;
  const origSubFindMany = prisma.subscription?.findMany;
  const origGrantFindMany = prisma.manualPremiumGrant?.findMany;

  try {
    User.find = () => ({
      select: () => ({
        lean: async () => [
          {
            _id: fakeSellerId,
            fullName: 'Jane Verified Seller',
            email: 'jane.private@example.com',
            role: 'WORKER',
            verifiedProfileStatus: 'VERIFIED',
            hashedPassword: 'secretpassword123'
          },
          {
            _id: fakeUnverifiedSellerId,
            fullName: 'John Unverified Seller',
            email: 'john.private@example.com',
            role: 'EMPLOYER',
            verifiedProfileStatus: 'NOT_VERIFIED'
          }
        ]
      })
    });

    // Mock prisma subscription so John has an active subscription, but Jane does not
    if (prisma.subscription) {
      prisma.subscription.findMany = async () => [{ userId: fakeUnverifiedSellerId }];
    }
    if (prisma.manualPremiumGrant) {
      prisma.manualPremiumGrant.findMany = async () => [];
    }

    const summaryMap = await resolveMarketplaceSellerSummaries([fakeSellerId, fakeUnverifiedSellerId]);

    const janeSummary = summaryMap.get(fakeSellerId);
    assert.equal(janeSummary.id, fakeSellerId);
    assert.equal(janeSummary.displayName, 'Jane Verified Seller');
    assert.equal(janeSummary.isVerified, true);
    assert.equal(janeSummary.verifiedProfileStatus, 'VERIFIED');
    assert.equal(janeSummary.isPremium, false);
    assert.equal(janeSummary.email, undefined); // Never leak private data
    assert.equal(janeSummary.hashedPassword, undefined);

    const johnSummary = summaryMap.get(fakeUnverifiedSellerId);
    assert.equal(johnSummary.id, fakeUnverifiedSellerId);
    assert.equal(johnSummary.displayName, 'John Unverified Seller');
    assert.equal(johnSummary.isVerified, false); // Premium DOES NOT imply verified!
    assert.equal(johnSummary.verifiedProfileStatus, 'NOT_VERIFIED');
    assert.equal(johnSummary.isPremium, true);
    assert.equal(johnSummary.email, undefined);
  } finally {
    User.find = origFind;
    if (origSubFindMany && prisma.subscription) prisma.subscription.findMany = origSubFindMany;
    if (origGrantFindMany && prisma.manualPremiumGrant) prisma.manualPremiumGrant.findMany = origGrantFindMany;
  }
});

test('serializeMarketplaceListing protects phone and whatsapp numbers from unauthenticated viewers and preview html', () => {
  const listing = {
    _id: '507f1f77bcf86cd799439099',
    ownerId: '507f1f77bcf86cd799439011',
    title: 'Vintage Leather Armchair',
    description: 'Comfortable armchair in good condition.',
    price: 90,
    currency: 'USD',
    phone: '+14155552671',
    whatsapp: '+14155550199',
    reports: [{ reason: 'spam' }],
    moderatedBy: 'admin1'
  };

  // Public / unauthenticated serialization (includePhone: false)
  const publicSerialized = serializeMarketplaceListing(listing, { includePhone: false });
  assert.equal(publicSerialized.phone, undefined);
  assert.equal(publicSerialized.whatsapp, undefined);
  assert.equal(publicSerialized.reports, undefined);
  assert.equal(publicSerialized.moderatedBy, undefined);

  // Authenticated serialization (includePhone: true)
  const authSerialized = serializeMarketplaceListing(listing, { includePhone: true });
  assert.equal(authSerialized.phone, '+14155552671');
  assert.equal(authSerialized.whatsapp, '+14155550199');

  // Preview HTML check
  const previewHtml = renderMarketplacePreviewHtml({ listing });
  assert.ok(!previewHtml.includes('+14155552671'), 'Social preview must not leak contact phone');
  assert.ok(!previewHtml.includes('+14155550199'), 'Social preview must not leak WhatsApp number');
});
