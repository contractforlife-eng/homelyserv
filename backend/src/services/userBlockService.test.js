import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UserBlockValidationError,
  blockPeer,
  getBlockRelationship,
  getPeerBlockStatus,
  resolveCustomerPeer,
  unblockPeer,
} from './userBlockService.js';

const employerId = '507f1f77bcf86cd799439011';
const workerId = '507f1f77bcf86cd799439012';
const thirdPartyId = '507f1f77bcf86cd799439013';
const conversationId = 'conv_507f1f77bcf86cd799439011_507f1f77bcf86cd799439012';

const makeContextDependencies = ({ participants = [employerId, workerId], peerRole = 'WORKER' } = {}) => ({
  conversationModel: { findOne: async () => ({ type: 'PRIVATE', participantIds: participants }) },
  prismaClient: {
    user: {
      findMany: async () => participants.map((id) => ({
        id,
        role: id === employerId ? 'EMPLOYER' : peerRole,
      })),
    },
  },
});

const resolveEmployerContext = (overrides = {}) => resolveCustomerPeer({
  conversationId,
  userId: employerId,
  userRole: 'EMPLOYER',
  ...makeContextDependencies(overrides),
});

test('resolves an actual canonical Employer-to-Worker peer', async () => {
  const context = await resolveEmployerContext();
  assert.equal(context.blockerId, employerId);
  assert.equal(context.blockedUserId, workerId);
});

test('resolves a Worker-to-Employer peer directionally', async () => {
  const context = await resolveCustomerPeer({
    conversationId,
    userId: workerId,
    userRole: 'WORKER',
    conversationModel: { findOne: async () => ({ type: 'PRIVATE', participantIds: [employerId, workerId] }) },
    prismaClient: {
      user: {
        findMany: async () => [
          { id: employerId, role: 'EMPLOYER' },
          { id: workerId, role: 'WORKER' },
        ],
      },
    },
  });
  assert.equal(context.blockerId, workerId);
  assert.equal(context.blockedUserId, employerId);
});

test('rejects self-shaped, non-participant, and staff targets', async () => {
  await assert.rejects(
    resolveCustomerPeer({ conversationId, userId: employerId, userRole: 'EMPLOYER', ...makeContextDependencies({ participants: [employerId, employerId] }) }),
    (error) => error instanceof UserBlockValidationError,
  );

  await assert.rejects(
    resolveCustomerPeer({ conversationId, userId: employerId, userRole: 'EMPLOYER', ...makeContextDependencies({ peerRole: 'SUPPORT' }) }),
    (error) => error instanceof UserBlockValidationError,
  );

  await assert.rejects(
    resolveCustomerPeer({ conversationId, userId: thirdPartyId, userRole: 'EMPLOYER', ...makeContextDependencies() }),
    (error) => error instanceof UserBlockValidationError && error.statusCode === 403,
  );
});

test('repeated block converges to one directional upsert', async () => {
  const context = await resolveEmployerContext();
  const calls = [];
  const prismaClient = { userBlock: { upsert: async (args) => { calls.push(args); return { id: 'block-1' }; } } };
  await blockPeer({ context, prismaClient });
  await blockPeer({ context, prismaClient });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].where, { blockerId_blockedUserId: { blockerId: employerId, blockedUserId: workerId } });
  assert.equal(calls[0].create.blockerId, employerId);
  assert.equal(calls[0].create.blockedUserId, workerId);
});

test('unblock deletes only the current directional pair', async () => {
  const context = await resolveEmployerContext();
  let deleted;
  await unblockPeer({
    context,
    prismaClient: { userBlock: { deleteMany: async (args) => { deleted = args.where; } } },
  });
  assert.deepEqual(deleted, { blockerId: employerId, blockedUserId: workerId });
});

test('status distinguishes my block from reciprocal block', async () => {
  const context = await resolveEmployerContext();
  const rows = new Set(['mine']);
  const status = await getPeerBlockStatus({
    context,
    prismaClient: {
      userBlock: {
        findUnique: async ({ where }) => rows.has(where.blockerId_blockedUserId.blockerId === employerId ? 'mine' : 'reciprocal') ? { id: 'x' } : null,
      },
    },
  });
  assert.deepEqual(status, { blockedByMe: true, blockedMe: false });
});

test('status reports a reciprocal block without treating it as my block', async () => {
  const context = await resolveEmployerContext();
  const status = await getPeerBlockStatus({
    context,
    prismaClient: {
      userBlock: {
        findUnique: async ({ where }) => where.blockerId_blockedUserId.blockerId === workerId ? { id: 'reciprocal' } : null,
      },
    },
  });
  assert.deepEqual(status, { blockedByMe: false, blockedMe: true });
});

test('communication relationship is symmetric even when storage is directional', async () => {
  const calls = [];
  const relationship = await getBlockRelationship(employerId, workerId, {
    prismaClient: {
      userBlock: {
        findUnique: async ({ where }) => {
          calls.push(where.blockerId_blockedUserId);
          return where.blockerId_blockedUserId.blockerId === workerId ? { id: 'reciprocal' } : null;
        },
      },
    },
  });
  assert.equal(calls.length, 2);
  assert.deepEqual(relationship, { blockedByA: false, blockedByB: true, isCommunicationBlocked: true });
});
