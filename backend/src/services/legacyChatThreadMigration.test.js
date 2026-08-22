import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGACY_CHAT_THREAD,
  buildLegacyChatThreadPlan,
  applyLegacyChatThreadPlan,
  executeLegacyChatThreadMigration,
} from './legacyChatThreadMigration.js';

const workerProfile = {
  id: LEGACY_CHAT_THREAD.workerProfileId,
  userId: LEGACY_CHAT_THREAD.workerUserId,
};

const makeMessages = () => Array.from({ length: 9 }, (_, index) => ({
  _id: `message-${index}`,
  conversationId: LEGACY_CHAT_THREAD.legacyConversationId,
  senderId: index % 2 ? LEGACY_CHAT_THREAD.workerProfileId : LEGACY_CHAT_THREAD.employerUserId,
  recipientId: index % 2 ? LEGACY_CHAT_THREAD.employerUserId : LEGACY_CHAT_THREAD.workerProfileId,
  read: index % 3 === 0,
  createdAt: new Date(2026, 0, index + 1),
}));

const makeConversation = () => ({
  _id: 'conversation-1',
  conversationId: LEGACY_CHAT_THREAD.legacyConversationId,
  participantIds: [LEGACY_CHAT_THREAD.employerUserId, LEGACY_CHAT_THREAD.workerProfileId],
});

test('builds a ready plan without changing message identity or metadata', () => {
  const messages = makeMessages();
  const plan = buildLegacyChatThreadPlan({
    conversation: makeConversation(),
    messages,
    workerProfile,
  });

  assert.equal(plan.preconditionsPassed, true);
  assert.equal(plan.wouldApply, true);
  assert.equal(plan.legacyMessageCount, 9);
  assert.equal(plan.messagesWithLegacySenderId, 4);
  assert.equal(plan.messagesWithLegacyRecipientId, 5);
  assert.deepEqual(plan.newParticipantIds, [
    LEGACY_CHAT_THREAD.workerUserId,
    LEGACY_CHAT_THREAD.employerUserId,
  ].sort());
  assert.deepEqual(messages.map((message) => message._id), Array.from({ length: 9 }, (_, i) => `message-${i}`));
  assert.equal(messages.filter((message) => message.read).length, 3);
});

test('wrong mapping, participant, count, or canonical collision refuses migration', () => {
  const base = {
    conversation: makeConversation(),
    messages: makeMessages(),
    workerProfile,
  };

  assert.equal(buildLegacyChatThreadPlan({
    ...base,
    workerProfile: { ...workerProfile, userId: LEGACY_CHAT_THREAD.employerUserId },
  }).preconditionsPassed, false);

  assert.equal(buildLegacyChatThreadPlan({
    ...base,
    conversation: { ...makeConversation(), participantIds: [LEGACY_CHAT_THREAD.employerUserId] },
  }).preconditionsPassed, false);

  assert.equal(buildLegacyChatThreadPlan({
    ...base,
    messages: base.messages.slice(0, 8),
  }).preconditionsPassed, false);

  assert.equal(buildLegacyChatThreadPlan({
    ...base,
    canonicalConversation: { conversationId: LEGACY_CHAT_THREAD.canonicalConversationId },
  }).preconditionsPassed, false);
});

test('already migrated state is safe to retry', () => {
  const report = buildLegacyChatThreadPlan({
    conversation: null,
    canonicalConversation: { conversationId: LEGACY_CHAT_THREAD.canonicalConversationId },
    messages: [],
    canonicalMessageCount: 9,
    workerProfile,
  });

  assert.equal(report.status, 'already_migrated');
  assert.equal(report.preconditionsPassed, true);
  assert.equal(report.wouldApply, false);
});

test('unexpected message participant refuses migration', () => {
  const messages = makeMessages();
  messages[0].senderId = '999999999999999999999999';
  const report = buildLegacyChatThreadPlan({
    conversation: makeConversation(),
    messages,
    workerProfile,
  });

  assert.equal(report.preconditionsPassed, false);
  assert.ok(report.reasons.includes('UNEXPECTED_MESSAGE_PARTICIPANT'));
});

test('dry-run never invokes the write operation', async () => {
  let writes = 0;
  const report = await executeLegacyChatThreadMigration({
    inspect: async () => buildLegacyChatThreadPlan({
      conversation: makeConversation(),
      messages: makeMessages(),
      workerProfile,
    }),
    apply: async () => { writes += 1; },
    dryRun: true,
  });

  assert.equal(report.applied, false);
  assert.equal(writes, 0);
});

test('apply uses explicit $set updates and preserves each message identity', async () => {
  const conversationUpdates = [];
  const messageUpdates = [];
  const conversationModel = {
    updateOne: async (...args) => {
      conversationUpdates.push(args);
      return { matchedCount: 1, modifiedCount: 1 };
    },
  };
  const messageModel = {
    updateOne: async (...args) => {
      messageUpdates.push(args);
      return { matchedCount: 1, modifiedCount: 1 };
    },
  };

  const result = await applyLegacyChatThreadPlan({
    conversationModel,
    messageModel,
    messages: makeMessages(),
    session: { id: 'test-session' },
  });

  assert.equal(result.messagesMatched, 9);
  assert.equal(conversationUpdates.length, 1);
  assert.equal(messageUpdates.length, 9);
  assert.ok(messageUpdates.every(([, update]) => !Array.isArray(update)));
  assert.ok(messageUpdates.every(([, update, options]) =>
    update.$set.conversationId === LEGACY_CHAT_THREAD.canonicalConversationId
      && options.timestamps === false
  ));
  assert.equal(messageUpdates[0][1].$set.recipientId, LEGACY_CHAT_THREAD.workerUserId);
  assert.equal(messageUpdates[1][1].$set.senderId, LEGACY_CHAT_THREAD.workerUserId);
  assert.deepEqual(messageUpdates.map(([filter]) => filter._id), makeMessages().map((message) => message._id));
});

test('a mid-transaction apply failure is surfaced for transaction rollback', async () => {
  let writes = 0;
  const messageModel = {
    updateOne: async () => {
      writes += 1;
      if (writes === 5) throw new Error('simulated write failure');
      return { matchedCount: 1, modifiedCount: 1 };
    },
  };

  await assert.rejects(
    applyLegacyChatThreadPlan({
      conversationModel: {
        updateOne: async () => ({ matchedCount: 1, modifiedCount: 1 }),
      },
      messageModel,
      messages: makeMessages(),
      session: { id: 'test-session' },
    }),
    /simulated write failure/,
  );
  assert.equal(writes, 5);
});
