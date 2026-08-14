import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import authRouter from './auth.js';

const secret = 'profile-photo-upload-test-secret-value-2026';
process.env.JWT_SECRET = secret;

const withServer = async (run) => {
  const app = express();
  app.use('/api/auth', authRouter);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); } finally { await new Promise((resolve) => server.close(resolve)); }
};

const authorization = { authorization: `Bearer ${jwt.sign({ userId: 'legacy-photo-test-user', role: 'WORKER' }, secret)}` };

test('profile photo endpoint requires the photo multipart field', async () => withServer(async (base) => {
  const response = await fetch(`${base}/api/auth/upload-photo`, { method: 'POST', headers: authorization });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, 'No photo uploaded');
}));

test('invalid profile photo type returns controlled 400', async () => withServer(async (base) => {
  const form = new FormData();
  form.append('photo', new Blob(['not an image'], { type: 'text/plain' }), 'profile.txt');
  const response = await fetch(`${base}/api/auth/upload-photo`, { method: 'POST', headers: authorization, body: form });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /valid JPEG/);
}));

test('oversized profile photo returns controlled 413', async () => withServer(async (base) => {
  const form = new FormData();
  form.append('photo', new Blob([Buffer.alloc((5 * 1024 * 1024) + 1)], { type: 'image/png' }), 'profile.png');
  const response = await fetch(`${base}/api/auth/upload-photo`, { method: 'POST', headers: authorization, body: form });
  assert.equal(response.status, 413);
  assert.match((await response.json()).message, /5 MB/);
}));
