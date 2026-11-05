import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import marketplaceRouter, {
  MARKETPLACE_ROLES,
  validateMarketplaceFields,
  isMarketplaceOwner,
  canModerateMarketplace,
  buildMarketplaceConversationId,
  serializeMarketplaceListing
} from './marketplace.js';
import chatRouter, { canAccessConversation } from './chat.js';
import MarketplaceListing from '../models/MarketplaceListing.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import prisma from '../lib/prisma.js';
import { detectMarketplaceImageType } from '../utils/marketplaceImageUpload.js';
import { renderMarketplacePreviewHtml } from '../utils/marketplaceSocialPreview.js';

const validFields = {
  title: 'Used dining table',
  description: 'Solid wood table in good condition.',
  price: '125.50',
  currency: 'USD',
  country: 'US',
  region: 'Virginia',
  city: 'Arlington',
  locationDescription: 'Near the central station',
  phone: '+1 202 555 0198'
};

test('all existing account roles can access marketplace policy', () => {
  assert.deepEqual(
    [...MARKETPLACE_ROLES].sort(),
    ['ADMIN', 'DOCTOR', 'EMPLOYER', 'STUDENT', 'SUPPORT', 'SUPPORT_HELPER', 'TEACHER', 'WORKER'].sort()
  );
});

test('listing field validation accepts global locations and rejects invalid money, phone and country', () => {
  const result = validateMarketplaceFields(validFields);
  assert.equal(result.data.country, 'US');
  assert.equal(result.data.price, 125.5);
  assert.equal(validateMarketplaceFields({ ...validFields, price: '-1' }).code, 'INVALID_PRICE');
  assert.equal(validateMarketplaceFields({ ...validFields, phone: 'abc' }).code, 'INVALID_PHONE');
  assert.equal(validateMarketplaceFields({ ...validFields, country: 'XX' }).code, 'INVALID_COUNTRY');
});

test('image content validation recognizes JPEG, PNG and WebP magic bytes and rejects spoofed content', () => {
  assert.equal(detectMarketplaceImageType(Buffer.from([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0])), 'image/jpeg');
  assert.equal(detectMarketplaceImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])), 'image/png');
  assert.equal(detectMarketplaceImageType(Buffer.from('RIFF0000WEBP')), 'image/webp');
  assert.equal(detectMarketplaceImageType(Buffer.from('<script>x</script>')), null);
});

test('ownership, moderation and stable chat reuse policies deny unauthorized mutations and self ambiguity', () => {
  const listing = { ownerId: 'seller' };
  assert.equal(isMarketplaceOwner(listing, 'seller'), true);
  assert.equal(isMarketplaceOwner(listing, 'other'), false);
  assert.equal(canModerateMarketplace('ADMIN'), true);
  assert.equal(canModerateMarketplace('SUPPORT'), true);
  assert.equal(canModerateMarketplace('WORKER'), false);
  assert.equal(
    buildMarketplaceConversationId('item123', 'buyer', 'seller'),
    buildMarketplaceConversationId('item123', 'seller', 'buyer')
  );
  assert.equal(
    buildMarketplaceConversationId('item123', 'buyer', 'seller'),
    'conv_market_item123_buyer_seller'
  );
});

test('public serialization and social metadata never leak phone, owner reports or chat data', () => {
  const listing = {
    _id: '507f1f77bcf86cd799439011',
    ownerId: 'seller',
    title: 'Bicycle',
    description: 'A safe used bicycle',
    phone: '+12025550198',
    status: 'ACTIVE',
    deletedAt: null,
    image: { url: 'https://images.example/bike.jpg' },
    reports: [{ reason: 'x' }],
    marketplaceListingTitle: 'private'
  };
  const publicItem = serializeMarketplaceListing(listing);
  assert.equal(publicItem.phone, undefined);
  assert.equal(publicItem.reports, undefined);
  const html = renderMarketplacePreviewHtml({ listing });
  assert.match(html, /og:type" content="product/);
  assert.match(html, /Bicycle/);
  assert.match(html, /bike\.jpg/);
  assert.doesNotMatch(html, /12025550198|seller|reports|chat/i);
});

test('hidden and deleted listings render unavailable public metadata', () => {
  for (const listing of [{ title: 'Hidden', status: 'HIDDEN' }, { title: 'Deleted', status: 'ACTIVE', deletedAt: new Date() }]) {
    const html = renderMarketplacePreviewHtml({ listing });
    assert.match(html, /Listing unavailable/);
    assert.doesNotMatch(html, new RegExp(listing.title));
  }
});

test('moderation transitions preserve prior active/sold state and forbid resurrecting removed listings', async () => {
  const secret = 'marketplace-moderation-test-secret-32-chars';
  process.env.JWT_SECRET = secret;
  const token = (userId, role) => jwt.sign({ userId, role, tokenVersion: 0 }, secret);

  const listingDoc = {
    _id: '507f1f77bcf86cd799439012',
    ownerId: 'seller1',
    status: 'ACTIVE',
    preHiddenStatus: null,
    deletedAt: null,
    save: async function () { return this; }
  };

  const origFindById = MarketplaceListing.findById;
  MarketplaceListing.findById = async (id) => (String(id) === String(listingDoc._id) ? listingDoc : null);

  const app = express();
  app.use(express.json());
  app.use('/api/marketplace', marketplaceRouter);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api/marketplace`;

  try {
    const adminHeaders = {
      authorization: `Bearer ${token('admin1', 'ADMIN')}`,
      'content-type': 'application/json'
    };

    // 1. ACTIVE -> HIDE preserves preHiddenStatus = 'ACTIVE', becomes HIDDEN
    listingDoc.status = 'ACTIVE';
    listingDoc.preHiddenStatus = null;
    let res = await fetch(`${base}/admin/${listingDoc._id}/moderate`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ action: 'HIDE' })
    });
    assert.equal(res.status, 200);
    assert.equal(listingDoc.status, 'HIDDEN');
    assert.equal(listingDoc.preHiddenStatus, 'ACTIVE');

    // 2. RESTORE from HIDDEN returns status to 'ACTIVE'
    res = await fetch(`${base}/admin/${listingDoc._id}/moderate`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ action: 'RESTORE' })
    });
    assert.equal(res.status, 200);
    assert.equal(listingDoc.status, 'ACTIVE');
    assert.equal(listingDoc.preHiddenStatus, null);

    // 3. SOLD -> HIDE preserves preHiddenStatus = 'SOLD', becomes HIDDEN
    listingDoc.status = 'SOLD';
    listingDoc.preHiddenStatus = null;
    res = await fetch(`${base}/admin/${listingDoc._id}/moderate`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ action: 'HIDE' })
    });
    assert.equal(res.status, 200);
    assert.equal(listingDoc.status, 'HIDDEN');
    assert.equal(listingDoc.preHiddenStatus, 'SOLD');

    // 4. RESTORE from HIDDEN returns status to 'SOLD' (does NOT make a sold item active)
    res = await fetch(`${base}/admin/${listingDoc._id}/moderate`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ action: 'RESTORE' })
    });
    assert.equal(res.status, 200);
    assert.equal(listingDoc.status, 'SOLD');
    assert.equal(listingDoc.preHiddenStatus, null);

    // 5. REMOVE action marks deletedAt and status = 'HIDDEN'
    res = await fetch(`${base}/admin/${listingDoc._id}/moderate`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ action: 'REMOVE' })
    });
    assert.equal(res.status, 200);
    assert.ok(listingDoc.deletedAt);

    // 6. Attempting HIDE or RESTORE on removed listing returns 400 LISTING_REMOVED
    res = await fetch(`${base}/admin/${listingDoc._id}/moderate`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ action: 'RESTORE' })
    });
    assert.equal(res.status, 400);
    const bodyRestore = await res.json();
    assert.equal(bodyRestore.code, 'LISTING_REMOVED');

    res = await fetch(`${base}/admin/${listingDoc._id}/moderate`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ action: 'HIDE' })
    });
    assert.equal(res.status, 400);
    const bodyHide = await res.json();
    assert.equal(bodyHide.code, 'LISTING_REMOVED');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    MarketplaceListing.findById = origFindById;
  }
});

test('marketplace conversation isolation and permissions', async () => {
  const secret = 'marketplace-isolation-test-secret-32-chars';
  process.env.JWT_SECRET = secret;
  const token = (userId, role) => jwt.sign({ userId, role, tokenVersion: 0 }, secret);

  const listing = {
    _id: '507f1f77bcf86cd799439099',
    ownerId: '507f1f77bcf86cd799439002',
    title: 'Vintage Clock',
    status: 'ACTIVE',
    deletedAt: null
  };

  const marketplaceConvId = buildMarketplaceConversationId(listing._id, '507f1f77bcf86cd799439001', '507f1f77bcf86cd799439002');
  const ordinaryConvId = 'conv_507f1f77bcf86cd799439001_507f1f77bcf86cd799439002';

  const conversationsDb = new Map();
  conversationsDb.set(marketplaceConvId, {
    conversationId: marketplaceConvId,
    type: 'PRIVATE',
    participantIds: ['507f1f77bcf86cd799439001', '507f1f77bcf86cd799439002'],
    marketplaceListingId: String(listing._id),
    marketplaceListingTitle: listing.title,
    save: async () => ({})
  });
  conversationsDb.set(ordinaryConvId, {
    conversationId: ordinaryConvId,
    type: 'PRIVATE',
    participantIds: ['507f1f77bcf86cd799439001', '507f1f77bcf86cd799439002'],
    marketplaceListingId: null,
    save: async () => ({})
  });

  const origUserFindById = User.findById;
  User.findById = () => ({
    select: async () => ({ tokenVersion: 0, isSuspended: false })
  });
  const origConvUpdateOne = Conversation.updateOne;
  const origConvFindOneAndUpdate = Conversation.findOneAndUpdate;
  Conversation.updateOne = async () => ({ acknowledged: true });
  Conversation.findOneAndUpdate = async () => ({ acknowledged: true });
  const origConvFindOne = Conversation.findOne;
  const origListingFindOne = MarketplaceListing.findOne;
  const origListingFindById = MarketplaceListing.findById;
  const origMsgCreate = Message.create;
  const origPrismaUser = prisma.user.findUnique;
  const origUserBlock = prisma.userBlock;
  const origNotificationCreate = prisma.notification?.create;

  prisma.userBlock = {
    findUnique: async () => null,
    deleteMany: async () => {},
    upsert: async () => ({})
  };
  if (prisma.notification) {
    prisma.notification.create = async () => ({});
  }

  Conversation.findOne = async (q) => {
    const conv = conversationsDb.get(q.conversationId);
    if (!conv) return null;
    if (q.participantIds?.$all) {
      const required = q.participantIds.$all.map(String);
      const hasAll = required.every((id) => conv.participantIds.includes(id));
      if (!hasAll) return null;
    }
    if (q.marketplaceListingId?.$ne !== undefined && !conv.marketplaceListingId) {
      return null;
    }
    return conv;
  };
  MarketplaceListing.findOne = async (q) => {
    if (String(q._id) === String(listing._id)) return listing;
    return null;
  };
  MarketplaceListing.findById = async (id) => (String(id) === String(listing._id) ? listing : null);

  const messagesSaved = [];
  Message.create = async (doc) => {
    const saved = { _id: 'msg_' + (messagesSaved.length + 1), createdAt: new Date(), ...doc };
    messagesSaved.push(saved);
    return saved;
  };

  prisma.user.findUnique = async ({ where }) => {
    if (where.id === '507f1f77bcf86cd799439002') return { id: '507f1f77bcf86cd799439002', role: 'WORKER', fullName: 'Seller Worker' };
    if (where.id === '507f1f77bcf86cd799439001') return { id: '507f1f77bcf86cd799439001', role: 'STUDENT', fullName: 'Buyer Student' };
    if (where.id === '507f1f77bcf86cd799439003') return { id: '507f1f77bcf86cd799439003', role: 'WORKER', fullName: 'Stranger Worker' };
    return null;
  };

  const chatApp = express();
  chatApp.use(express.json());
  chatApp.use('/api/chat', chatRouter);
  const chatServer = chatApp.listen(0);
  const chatBase = `http://127.0.0.1:${chatServer.address().port}/api/chat`;

  try {
    const buyerHeaders = {
      authorization: `Bearer ${token('507f1f77bcf86cd799439001', 'STUDENT')}`,
      'content-type': 'application/json'
    };
    const sellerHeaders = {
      authorization: `Bearer ${token('507f1f77bcf86cd799439002', 'WORKER')}`,
      'content-type': 'application/json'
    };
    const strangerHeaders = {
      authorization: `Bearer ${token('507f1f77bcf86cd799439003', 'WORKER')}`,
      'content-type': 'application/json'
    };

    // 1. Buyer sends message to seller via marketplace conversation
    const buyerSendRes = await fetch(`${chatBase}/send`, {
      method: 'POST',
      headers: buyerHeaders,
      body: JSON.stringify({
        recipientId: '507f1f77bcf86cd799439002',
        text: 'Hello, is this clock still available?',
        conversationId: marketplaceConvId
      })
    });
    assert.equal(buyerSendRes.status, 201);
    const buyerMsg = await buyerSendRes.json();
    assert.equal(buyerMsg.conversationId, marketplaceConvId);
    assert.equal(buyerMsg.text, 'Hello, is this clock still available?');

    // 2. Seller replies in the same marketplace conversation
    const sellerSendRes = await fetch(`${chatBase}/send`, {
      method: 'POST',
      headers: sellerHeaders,
      body: JSON.stringify({
        recipientId: '507f1f77bcf86cd799439001',
        text: 'Yes it is!',
        conversationId: marketplaceConvId
      })
    });
    assert.equal(sellerSendRes.status, 201);
    const sellerMsg = await sellerSendRes.json();
    assert.equal(sellerMsg.conversationId, marketplaceConvId);

    // 3. Ordinary private conversation between 507f1f77bcf86cd799439001 (EMPLOYER) and 507f1f77bcf86cd799439002 (WORKER)
    // is NOT unlocked by the marketplace conversation. Attempting to send to ordinary conversation
    // fails with 403 paid chat relationship required (unless employer paid worker).
    const ordinarySendRes = await fetch(`${chatBase}/send`, {
      method: 'POST',
      headers: buyerHeaders,
      body: JSON.stringify({
        recipientId: '507f1f77bcf86cd799439002',
        text: 'Hey can I hire you directly outside marketplace?'
      })
    });
    assert.equal(ordinarySendRes.status, 403);

    // 4. Stranger cannot read or mark read in the marketplace conversation
    assert.equal(await canAccessConversation(marketplaceConvId, '507f1f77bcf86cd799439003', 'WORKER'), false);
    assert.equal(await canAccessConversation(marketplaceConvId, '507f1f77bcf86cd799439001', 'STUDENT'), true);
    assert.equal(await canAccessConversation(marketplaceConvId, '507f1f77bcf86cd799439002', 'WORKER'), true);

    const strangerReadRes = await fetch(`${chatBase}/mark-read`, {
      method: 'POST',
      headers: strangerHeaders,
      body: JSON.stringify({ conversationId: marketplaceConvId })
    });
    assert.equal(strangerReadRes.status, 403);

    // 5. Stranger cannot send messages into the marketplace conversation
    const strangerSendRes = await fetch(`${chatBase}/send`, {
      method: 'POST',
      headers: strangerHeaders,
      body: JSON.stringify({
        recipientId: '507f1f77bcf86cd799439002',
        text: 'I am barging into this chat',
        conversationId: marketplaceConvId
      })
    });
    assert.equal(strangerSendRes.status, 403);

    // Regression test 1: Authorized sender/recipient submitting another pair's ordinary conversationId
    const anotherPairConvId = 'conv_507f1f77bcf86cd799439002_507f1f77bcf86cd799439003';
    const hijackedOrdinaryRes = await fetch(`${chatBase}/send`, {
      method: 'POST',
      headers: sellerHeaders,
      body: JSON.stringify({
        recipientId: '507f1f77bcf86cd799439001',
        text: "Attempting to route into another pair's conversation",
        conversationId: anotherPairConvId
      })
    });
    assert.equal(hijackedOrdinaryRes.status, 403);

    // Regression test 2: An arbitrary non-marketplace conversationId
    const arbitraryConvId = 'conv_arbitrary_forged_thread_12345';
    const arbitrarySendRes = await fetch(`${chatBase}/send`, {
      method: 'POST',
      headers: sellerHeaders,
      body: JSON.stringify({
        recipientId: '507f1f77bcf86cd799439001',
        text: 'Attempting arbitrary conversationId',
        conversationId: arbitraryConvId
      })
    });
    assert.equal(arbitrarySendRes.status, 403);

    // Regression test 3: Hidden/deleted marketplace listing, even where ordinary chat is permitted
    const hiddenListing = {
      _id: '507f1f77bcf86cd799439088',
      ownerId: '507f1f77bcf86cd799439002',
      title: 'Hidden Antique Lamp',
      status: 'HIDDEN',
      deletedAt: null
    };
    const hiddenMarketplaceConvId = buildMarketplaceConversationId(hiddenListing._id, '507f1f77bcf86cd799439001', '507f1f77bcf86cd799439002');
    conversationsDb.set(hiddenMarketplaceConvId, {
      conversationId: hiddenMarketplaceConvId,
      type: 'PRIVATE',
      participantIds: ['507f1f77bcf86cd799439001', '507f1f77bcf86cd799439002'],
      marketplaceListingId: String(hiddenListing._id),
      marketplaceListingTitle: hiddenListing.title,
      save: async () => ({})
    });
    const hiddenListingSendRes = await fetch(`${chatBase}/send`, {
      method: 'POST',
      headers: sellerHeaders,
      body: JSON.stringify({
        recipientId: '507f1f77bcf86cd799439001',
        text: 'Trying to message on hidden listing',
        conversationId: hiddenMarketplaceConvId
      })
    });
    assert.equal(hiddenListingSendRes.status, 403);

    // Regression test 4: Valid ordinary and marketplace messages still succeed
    // 4a. Valid marketplace message: buyer -> seller on active listing
    const validMarketplaceRes = await fetch(`${chatBase}/send`, {
      method: 'POST',
      headers: buyerHeaders,
      body: JSON.stringify({
        recipientId: '507f1f77bcf86cd799439002',
        text: 'Still interested in the clock!',
        conversationId: marketplaceConvId
      })
    });
    assert.equal(validMarketplaceRes.status, 201);
    const validMarketplaceMsg = await validMarketplaceRes.json();
    assert.equal(validMarketplaceMsg.conversationId, marketplaceConvId);

    // 4b. Valid ordinary message: seller (WORKER) -> buyer (STUDENT)
    const validOrdinaryExplicitRes = await fetch(`${chatBase}/send`, {
      method: 'POST',
      headers: sellerHeaders,
      body: JSON.stringify({
        recipientId: '507f1f77bcf86cd799439001',
        text: 'Direct message with explicit canonical ID',
        conversationId: ordinaryConvId
      })
    });
    assert.equal(validOrdinaryExplicitRes.status, 201);
    const validOrdinaryExplicitMsg = await validOrdinaryExplicitRes.json();
    assert.equal(validOrdinaryExplicitMsg.conversationId, ordinaryConvId);

    const validOrdinaryImplicitRes = await fetch(`${chatBase}/send`, {
      method: 'POST',
      headers: sellerHeaders,
      body: JSON.stringify({
        recipientId: '507f1f77bcf86cd799439001',
        text: 'Direct message with implicit canonical ID'
      })
    });
    assert.equal(validOrdinaryImplicitRes.status, 201);
    const validOrdinaryImplicitMsg = await validOrdinaryImplicitRes.json();
    assert.equal(validOrdinaryImplicitMsg.conversationId, ordinaryConvId);
  } finally {
    await new Promise((resolve) => chatServer.close(resolve));
    User.findById = origUserFindById;
    Conversation.updateOne = origConvUpdateOne;
    Conversation.findOneAndUpdate = origConvFindOneAndUpdate;
    Conversation.findOne = origConvFindOne;
    MarketplaceListing.findOne = origListingFindOne;
    MarketplaceListing.findById = origListingFindById;
    Message.create = origMsgCreate;
    prisma.user.findUnique = origPrismaUser;
    prisma.userBlock = origUserBlock;
    if (prisma.notification && origNotificationCreate) {
      prisma.notification.create = origNotificationCreate;
    }
  }
});

test('authenticated listing contact/chat and server ownership/moderation routes enforce boundaries', async () => {
  const secret = 'marketplace-route-test-secret-with-32-characters';
  process.env.JWT_SECRET = secret;
  const listing = {
    _id: '507f1f77bcf86cd799439011',
    ownerId: 'seller',
    title: 'Bicycle',
    description: 'A safe used bicycle',
    phone: '+12025550198',
    status: 'ACTIVE',
    deletedAt: null,
    image: { publicId: 'market/bike', url: 'https://images.example/bike.jpg' },
    reports: [],
    save: async function () { return this; },
    toObject() { return { ...this, save: undefined, toObject: undefined }; }
  };
  const originals = {
    findOne: MarketplaceListing.findOne,
    findOneAndUpdate: MarketplaceListing.findOneAndUpdate,
    findById: MarketplaceListing.findById,
    conversation: Conversation.findOneAndUpdate
  };
  MarketplaceListing.findOne = async (query) => {
    if (query.ownerId && String(query.ownerId) !== listing.ownerId) return null;
    if (query.deletedAt === null && listing.deletedAt) return null;
    if (query.status?.$ne === 'HIDDEN' && listing.status === 'HIDDEN') return null;
    if (query.status === 'ACTIVE' && listing.status !== 'ACTIVE') return null;
    return listing;
  };
  MarketplaceListing.findOneAndUpdate = async (query, update) => {
    if (String(query.ownerId) !== listing.ownerId) return null;
    listing.status = update.status;
    return listing;
  };
  MarketplaceListing.findById = async () => listing;
  Conversation.findOneAndUpdate = async (_query, update) => ({ ...update.$setOnInsert, ...update.$set });
  const token = (userId, role) => jwt.sign({ userId, role, tokenVersion: 0 }, secret);
  const app = express();
  app.use(express.json());
  app.use('/api/marketplace', marketplaceRouter);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api/marketplace`;
  try {
    const publicResponse = await fetch(`${base}/${listing._id}`);
    assert.equal(publicResponse.status, 401);
    assert.doesNotMatch(await publicResponse.text(), /12025550198/);

    const buyerHeaders = { authorization: `Bearer ${token('buyer', 'WORKER')}`, 'content-type': 'application/json' };

    const missingImage = new FormData();
    Object.entries(validFields).forEach(([key, value]) => missingImage.append(key, value));
    const missingImageResponse = await fetch(base, {
      method: 'POST',
      headers: { authorization: `Bearer ${token('buyer', 'WORKER')}` },
      body: missingImage
    });
    assert.equal(missingImageResponse.status, 400);
    assert.equal((await missingImageResponse.json()).code, 'IMAGE_REQUIRED');

    const twoImages = new FormData();
    Object.entries(validFields).forEach(([key, value]) => twoImages.append(key, value));
    const png = new Blob([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])], { type: 'image/png' });
    twoImages.append('image', png, 'one.png');
    twoImages.append('image', png, 'two.png');
    const twoImagesResponse = await fetch(base, {
      method: 'POST',
      headers: { authorization: `Bearer ${token('buyer', 'WORKER')}` },
      body: twoImages
    });
    assert.equal(twoImagesResponse.status, 400);
    assert.equal((await twoImagesResponse.json()).code, 'EXACTLY_ONE_IMAGE');

    const spoofedImage = new FormData();
    Object.entries(validFields).forEach(([key, value]) => spoofedImage.append(key, value));
    spoofedImage.append('image', new Blob([Buffer.from('<html>not an image</html>')], { type: 'image/png' }), 'fake.png');
    const spoofedResponse = await fetch(base, {
      method: 'POST',
      headers: { authorization: `Bearer ${token('buyer', 'WORKER')}` },
      body: spoofedImage
    });
    assert.equal(spoofedResponse.status, 400);
    assert.equal((await spoofedResponse.json()).code, 'INVALID_IMAGE_CONTENT');

    const detailResponse = await fetch(`${base}/${listing._id}`, { headers: buyerHeaders });
    assert.equal(detailResponse.status, 200);
    assert.equal((await detailResponse.json()).listing.phone, listing.phone);

    const chatResponse = await fetch(`${base}/${listing._id}/chat`, { method: 'POST', headers: buyerHeaders, body: '{}' });
    const chatBody = await chatResponse.json();
    assert.equal(chatResponse.status, 200);
    assert.equal(chatBody.sellerId, 'seller');
    assert.equal(chatBody.conversationId, `conv_market_${listing._id}_buyer_seller`);

    const selfResponse = await fetch(`${base}/${listing._id}/chat`, {
      method: 'POST',
      headers: { ...buyerHeaders, authorization: `Bearer ${token('seller', 'WORKER')}` },
      body: '{}'
    });
    assert.equal(selfResponse.status, 400);

    const deniedStatus = await fetch(`${base}/${listing._id}/status`, {
      method: 'PATCH',
      headers: buyerHeaders,
      body: JSON.stringify({ status: 'SOLD' })
    });
    assert.equal(deniedStatus.status, 404);
    const deniedEdit = await fetch(`${base}/${listing._id}`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${token('buyer', 'WORKER')}` },
      body: new FormData()
    });
    assert.equal(deniedEdit.status, 404);
    const deniedDelete = await fetch(`${base}/${listing._id}`, { method: 'DELETE', headers: buyerHeaders });
    assert.equal(deniedDelete.status, 404);

    const ownerStatus = await fetch(`${base}/${listing._id}/status`, {
      method: 'PATCH',
      headers: { ...buyerHeaders, authorization: `Bearer ${token('seller', 'WORKER')}` },
      body: JSON.stringify({ status: 'SOLD' })
    });
    assert.equal(ownerStatus.status, 200);
    assert.equal((await ownerStatus.json()).listing.status, 'SOLD');
    listing.status = 'ACTIVE';

    const deniedModeration = await fetch(`${base}/admin/${listing._id}/moderate`, {
      method: 'PATCH',
      headers: buyerHeaders,
      body: JSON.stringify({ action: 'HIDE' })
    });
    assert.equal(deniedModeration.status, 403);
    const adminModeration = await fetch(`${base}/admin/${listing._id}/moderate`, {
      method: 'PATCH',
      headers: { ...buyerHeaders, authorization: `Bearer ${token('admin', 'ADMIN')}` },
      body: JSON.stringify({ action: 'HIDE' })
    });
    assert.equal(adminModeration.status, 200);
    const hiddenDetail = await fetch(`${base}/${listing._id}`, { headers: buyerHeaders });
    assert.equal(hiddenDetail.status, 404);
    const hiddenChat = await fetch(`${base}/${listing._id}/chat`, { method: 'POST', headers: buyerHeaders, body: '{}' });
    assert.equal(hiddenChat.status, 404);
    listing.deletedAt = new Date();
    const deletedDetail = await fetch(`${base}/${listing._id}`, { headers: buyerHeaders });
    assert.equal(deletedDetail.status, 404);

    // Storage unconfigured failure returns 503 IMAGE_STORAGE_UNAVAILABLE
    const validPng = new Blob([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])], { type: 'image/png' });
    const storageFailForm = new FormData();
    Object.entries(validFields).forEach(([key, value]) => storageFailForm.append(key, value));
    storageFailForm.append('image', validPng, 'valid.png');
    const storageFailResponse = await fetch(base, {
      method: 'POST',
      headers: { authorization: `Bearer ${token('buyer', 'WORKER')}` },
      body: storageFailForm
    });
    assert.equal(storageFailResponse.status, 503);
    assert.equal((await storageFailResponse.json()).code, 'IMAGE_STORAGE_UNAVAILABLE');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    MarketplaceListing.findOne = originals.findOne;
    MarketplaceListing.findOneAndUpdate = originals.findOneAndUpdate;
    MarketplaceListing.findById = originals.findById;
    Conversation.findOneAndUpdate = originals.conversation;
  }
});
