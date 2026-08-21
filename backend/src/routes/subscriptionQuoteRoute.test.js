import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import test from 'node:test';
import paymentRouter from './payment.js';

test('subscription quote route requires the canonical authentication middleware', async () => {
  const app = express();
  app.use('/api/payments', paymentRouter);
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/payments/subscription-quote`);
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.success, false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
