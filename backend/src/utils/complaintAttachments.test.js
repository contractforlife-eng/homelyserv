import test from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET = 'complaint-attachment-test-secret-value-2026';
process.env.CLOUDINARY_CLOUD_NAME = 'homelyserv';
const { authorizeComplaintAttachments, createComplaintAttachmentReceipt, getAuthorizedComplaintAttachmentUrls, GRANT_TTL_MS, isTrustedComplaintAttachmentUrl, persistComplaintAttachmentGrant, validateComplaintAttachments } = await import('./complaintAttachments.js');
const { default: ComplaintAttachmentGrant } = await import('../models/ComplaintAttachmentGrant.js');

const url = 'https://res.cloudinary.com/homelyserv/image/upload/v123/homelyserv/complaints/example.jpg';
const publicId = 'homelyserv/complaints/example';

test('accepts a trusted upload receipt for its owner', async () => {
  const receipt = createComplaintAttachmentReceipt({ url, publicId, userId: 'owner', now: 1000 });
  assert.deepEqual(await validateComplaintAttachments([{ url, publicId, receipt }], 'owner', { now: 2000 }), [url]);
});

test('preserves text-only complaint and reply submissions', async () => {
  assert.deepEqual(await validateComplaintAttachments(undefined, 'owner'), []);
  assert.deepEqual(await validateComplaintAttachments([], 'owner'), []);
});

test('rejects tampered, expired, cross-user, substituted, and unsafe receipt attachments', async () => {
  for (const value of ['//res.cloudinary.com/homelyserv/image/upload/homelyserv/complaints/a.jpg', 'http://res.cloudinary.com/homelyserv/image/upload/homelyserv/complaints/a.jpg', 'https://user@res.cloudinary.com/homelyserv/image/upload/homelyserv/complaints/a.jpg', 'https://res.cloudinary.com:444/homelyserv/image/upload/homelyserv/complaints/a.jpg', 'https://res.cloudinary.com/other/image/upload/homelyserv/complaints/a.jpg', 'https://www.homelyserv.com/_capacitor_http_interceptor_/x']) assert.equal(isTrustedComplaintAttachmentUrl(value), false);
  const receipt = createComplaintAttachmentReceipt({ url, publicId, userId: 'owner', now: 1000 });
  await assert.rejects(() => validateComplaintAttachments([{ url, publicId, receipt }], 'other', { now: 2000 }), /mismatched/);
  await assert.rejects(() => validateComplaintAttachments([{ url, publicId, receipt }], 'owner', { now: 30 * 60 * 1000 + 1001 }), /Expired/);
  await assert.rejects(() => validateComplaintAttachments([{ url, publicId, receipt: `${receipt.slice(0, -1)}x` }], 'owner', { now: 2000, grantModel: { findOne: () => { throw new Error('must not fall back'); } } }), /Invalid/);
  await assert.rejects(() => validateComplaintAttachments([{ url: url.replace('example.jpg', 'other.jpg'), publicId, receipt }], 'owner', { now: 2000 }), /mismatched/);
});

test('legacy URL grants allow bounded same-user retries and reject invalid provenance', async () => {
  let lookupCount = 0;
  const grantModel = {
    findOne: async (query) => {
      lookupCount += 1;
      if (query.uploaderId !== 'owner' || query.url !== url || query.purpose !== 'complaint-attachment') return null;
      return { expiresAt: new Date(5000) };
    },
  };
  assert.deepEqual(await validateComplaintAttachments([url], 'owner', { now: 2000, grantModel }), [url]);
  assert.deepEqual(await validateComplaintAttachments([url], 'owner', { now: 2000, grantModel }), [url]);
  assert.equal(lookupCount, 2, 'non-consuming grants support safe request retries');
  await assert.rejects(() => validateComplaintAttachments([url], 'other', { now: 2000, grantModel }), /No valid/);
  await assert.rejects(() => validateComplaintAttachments([url], 'owner', { now: 6000, grantModel }), /No valid/);
  await assert.rejects(() => validateComplaintAttachments([url.replace('example.jpg', 'other.jpg')], 'owner', { now: 2000, grantModel }), /No valid/);
  await assert.rejects(() => validateComplaintAttachments(['capacitor://localhost/_capacitor_http_interceptor_/x'], 'owner', { grantModel }), /Invalid/);
});

test('persists exact grant fields before success and propagates persistence failures', async () => {
  let created;
  const grantModel = { create: async (data) => { created = data; return data; } };
  await persistComplaintAttachmentGrant({ url, publicId, userId: 'owner', now: 1000, grantModel });
  assert.equal(created.uploaderId, 'owner');
  assert.equal(created.url, url);
  assert.equal(created.publicId, publicId);
  assert.equal(created.purpose, 'complaint-attachment');
  assert.equal(created.createdAt.getTime(), 1000);
  assert.equal(created.expiresAt.getTime(), 1000 + GRANT_TTL_MS);
  await assert.rejects(
    () => persistComplaintAttachmentGrant({ url, publicId, userId: 'owner', grantModel: { create: async () => { throw new Error('write failed'); } } }),
    /write failed/,
  );
});

test('grant schema defines lookup and TTL indexes', () => {
  const indexes = ComplaintAttachmentGrant.schema.indexes();
  assert.ok(indexes.some(([keys, options]) => keys.uploaderId === 1 && keys.url === 1 && keys.purpose === 1 && options.name === 'complaint_attachment_grant_lookup'));
  assert.ok(indexes.some(([keys, options]) => keys.expiresAt === 1 && options.expireAfterSeconds === 0 && options.name === 'complaint_attachment_grant_ttl'));
});

test('low-level writers can only unwrap centrally authorized attachments', async () => {
  const receipt = createComplaintAttachmentReceipt({ url, publicId, userId: 'owner', now: 1000 });
  const authorization = await authorizeComplaintAttachments([{ url, publicId, receipt }], 'owner', { now: 2000 });
  assert.deepEqual(getAuthorizedComplaintAttachmentUrls(authorization), [url]);
  assert.throws(() => getAuthorizedComplaintAttachmentUrls({ urls: [url] }), /not authorized/);
});
