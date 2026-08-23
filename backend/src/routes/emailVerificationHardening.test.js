import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import test from 'node:test';
import authRouter from './auth.js';

const withServer = async (run) => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
};

test('GET verification links are non-mutating and require explicit POST', async () => withServer(async (base) => {
  const response = await fetch(`${base}/api/auth/verify-email?token=unopened-token`);
  const body = await response.json();
  assert.equal(response.status, 405);
  assert.equal(body.success, false);
  assert.equal(body.reason, 'use_post');
}));

test('POST verification requires a token', async () => withServer(async (base) => {
  const response = await fetch(`${base}/api/auth/verify-email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.reason, 'missing_token');
}));
