import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';
import { allowedOrigins, corsOptions, corsFallbackMiddleware } from '../src/config/cors.js';

test('CORS preflight permits Idempotency-Key header for trusted origin https://www.homelyserv.com', async () => {
  const app = express();
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(corsFallbackMiddleware);

  app.post('/api/wall/posts/:postId/gifts', (req, res) => res.json({ success: true }));

  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const port = server.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/wall/posts/post-123/gifts`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://www.homelyserv.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization,idempotency-key'
      }
    });

    assert.equal(response.status, 204, 'Preflight status should be 204 or 200');
    assert.equal(
      response.headers.get('access-control-allow-origin'),
      'https://www.homelyserv.com',
      'Origin must match trusted origin https://www.homelyserv.com'
    );
    assert.equal(
      response.headers.get('access-control-allow-credentials'),
      'true',
      'Credentials must be allowed'
    );

    const allowHeaders = (response.headers.get('access-control-allow-headers') || '').toLowerCase();
    assert.ok(allowHeaders.includes('idempotency-key'), 'Access-Control-Allow-Headers must include idempotency-key');
    assert.ok(allowHeaders.includes('content-type'), 'Access-Control-Allow-Headers must include content-type');
    assert.ok(allowHeaders.includes('authorization'), 'Access-Control-Allow-Headers must include authorization');

    const allowMethods = response.headers.get('access-control-allow-methods') || '';
    assert.ok(allowMethods.includes('POST'), 'Access-Control-Allow-Methods must include POST');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('CORS preflight rejects untrusted origin', async () => {
  const app = express();
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(corsFallbackMiddleware);

  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const port = server.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/wall/posts/post-123/gifts`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://malicious-site.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization,idempotency-key'
      }
    });

    // Should not reflect untrusted origin
    assert.notEqual(response.headers.get('access-control-allow-origin'), 'https://malicious-site.com');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
