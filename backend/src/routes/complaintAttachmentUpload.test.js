import test from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET = 'complaint-upload-route-test-secret-value-2026';
process.env.CLOUDINARY_CLOUD_NAME = 'homelyserv';
const { createComplaintAttachmentUploadHandler } = await import('./complaints.js');

const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test('grant persistence completes before upload success is returned', async () => {
  const events = [];
  const handler = createComplaintAttachmentUploadHandler({
    uploadBuffer: async () => ({ secure_url: 'https://res.cloudinary.com/homelyserv/image/upload/v1/homelyserv/complaints/a.jpg', public_id: 'homelyserv/complaints/a' }),
    persistGrant: async () => { events.push('grant'); },
    createReceipt: () => { events.push('receipt'); return 'receipt'; },
  });
  const res = makeResponse();
  await handler({ file: { buffer: Buffer.from('x') }, userId: 'owner' }, res);
  events.push('response');
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.deepEqual(events, ['grant', 'receipt', 'response']);
  assert.deepEqual(Object.keys(res.body).filter((key) => ['url', 'publicId', 'receipt'].includes(key)).sort(), ['publicId', 'receipt', 'url']);
});

test('grant persistence failure cannot return upload success', async () => {
  const handler = createComplaintAttachmentUploadHandler({
    uploadBuffer: async () => ({ secure_url: 'https://res.cloudinary.com/homelyserv/image/upload/v1/homelyserv/complaints/a.jpg', public_id: 'homelyserv/complaints/a' }),
    persistGrant: async () => { throw new Error('grant write failed'); },
    createReceipt: () => 'must-not-run',
  });
  const res = makeResponse();
  await handler({ file: { buffer: Buffer.from('x') }, userId: 'owner' }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.equal(res.body.receipt, undefined);
});
