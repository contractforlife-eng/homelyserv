import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGACY_CHAT_THREAD,
  buildLegacyChatThreadPlan,
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
