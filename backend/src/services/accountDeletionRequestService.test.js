import assert from 'node:assert/strict';
import test from 'node:test';
import { createOrReuseAccountDeletionRequest } from './accountDeletionRequestService.js';

const makeRequest = (userId) => ({
  id: 'request-1',
  userId,
  status: 'pending',
  requestedAt: new Date('2026-08-21T00:00:00.000Z')
});

const makeDatabase = ({ existing = null, race = false } = {}) => {
  let stored = existing;
  let createCalls = 0;
  const db = {
    accountDeletionRequest: {
      findUnique: async () => stored,
      create: async ({ data }) => {
        createCalls += 1;
        if (race) {
          const error = new Error('unique constraint');
          error.code = 'P2002';
          stored = makeRequest(data.userId);
          throw error;
        }
        stored = { ...makeRequest(data.userId), ...data };
        return stored;
      }
    }
  };

  return { db, getCreateCalls: () => createCalls, getStored: () => stored };
};

test('creates an idempotent pending request without a deletion operation', async () => {
  const { db, getCreateCalls, getStored } = makeDatabase();
  const result = await createOrReuseAccountDeletionRequest('worker-1', db);

  assert.equal(result.reused, false);
  assert.equal(result.request.status, 'pending');
  assert.equal(result.request.userId, 'worker-1');
  assert.equal(getCreateCalls(), 1);
  assert.ok(getStored(), 'the request record remains available for later processing');
});

test('supports employer requests and reuses the same actionable request', async () => {
  const fakeRequest = makeRequest('employer-1');
  const { db, getCreateCalls } = makeDatabase({ existing: fakeRequest });

  const first = await createOrReuseAccountDeletionRequest('employer-1', db);
  const second = await createOrReuseAccountDeletionRequest('employer-1', db);

  assert.equal(first.reused, true);
  assert.equal(second.reused, true);
  assert.equal(second.request.id, fakeRequest.id);
  assert.equal(getCreateCalls(), 0);
});

test('reuses a request when creation races on the unique userId constraint', async () => {
  const { db, getCreateCalls } = makeDatabase({ race: true });
  const result = await createOrReuseAccountDeletionRequest('user-1', db);

  assert.equal(result.reused, true);
  assert.equal(result.request.userId, 'user-1');
  assert.equal(getCreateCalls(), 1);
});

test('rejects a request without an authenticated user id', async () => {
  await assert.rejects(
    () => createOrReuseAccountDeletionRequest('', makeDatabase().db),
    /Authenticated user id is required/
  );
});
