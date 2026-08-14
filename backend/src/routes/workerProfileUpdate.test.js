import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import workersRouter from './workers.js';

const secret = 'worker-profile-update-test-secret-value-2026';
process.env.JWT_SECRET = secret;

test('Worker profile route saves allowed data while ignoring fake geography metadata', async () => {
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;
  let capturedUpdate;
  User.findByIdAndUpdate = (id, update, options) => {
    capturedUpdate = { id, update, options };
    return {
      select: async () => ({
        toObject: () => ({ _id: id, fullName: update.$set.fullName, location: update.$set.location, role: 'WORKER' }),
      }),
    };
  };

  const app = express();
  app.use(express.json());
  app.use('/api/workers', workersRouter);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const userId = 'legacy-worker-profile-test';
    const token = jwt.sign({ userId, role: 'WORKER', tokenVersion: 0 }, secret);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/workers/profile/${userId}`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Saved Worker',
        location: 'Giza',
        registrationIp: '8.8.8.8',
        registrationCountryCode: 'US',
        registrationCountryName: 'Fake',
        registrationLocationCapturedAt: '2000-01-01T00:00:00.000Z',
      }),
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.deepEqual(capturedUpdate.update, { $set: { fullName: 'Saved Worker', location: 'Giza' } });
    assert.equal(capturedUpdate.options.runValidators, true);
  } finally {
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
    await new Promise((resolve) => server.close(resolve));
  }
});
