export const LEGACY_CHAT_THREAD = Object.freeze({
  employerUserId: '6a5e8a91eb53a9b7ad90eca8',
  workerProfileId: '6a66757d8e0a042d07896783',
  workerUserId: '6a5e8a0deb53a9b7ad90eca6',
  legacyConversationId: 'conv_6a5e8a91eb53a9b7ad90eca8_6a66757d8e0a042d07896783',
  canonicalConversationId: 'conv_6a5e8a0deb53a9b7ad90eca6_6a5e8a91eb53a9b7ad90eca8',
  expectedMessageCount: 9,
});

const sameMembers = (left = [], right = []) => {
  const a = [...new Set(left.map(String))].sort();
  const b = [...new Set(right.map(String))].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
};

const messageIds = (messages, field, value) => messages.filter(
  (message) => String(message[field]) === String(value),
).length;

const baseReport = ({ conversation, canonicalConversation, messages, canonicalMessageCount }) => ({
  legacyConversationId: LEGACY_CHAT_THREAD.legacyConversationId,
  canonicalConversationId: LEGACY_CHAT_THREAD.canonicalConversationId,
  legacyMessageCount: messages.length,
  canonicalMessageCount,
  currentParticipantIds: conversation?.participantIds || null,
  newParticipantIds: [LEGACY_CHAT_THREAD.workerUserId, LEGACY_CHAT_THREAD.employerUserId].sort(),
  messagesWithLegacySenderId: messageIds(messages, 'senderId', LEGACY_CHAT_THREAD.workerProfileId),
  messagesWithLegacyRecipientId: messageIds(messages, 'recipientId', LEGACY_CHAT_THREAD.workerProfileId),
  messagesToRetargetConversationId: messages.filter(
    (message) => String(message.conversationId) === LEGACY_CHAT_THREAD.legacyConversationId,
  ).length,
  canonicalConversationExists: Boolean(canonicalConversation),
  preconditionsPassed: false,
  wouldApply: false,
  status: 'blocked',
  reasons: [],
});

/**
 * Builds a strict, side-effect-free migration plan. The caller supplies the
 * already-read WorkerProfile mapping so this function is usable in tests
 * without connecting to MongoDB.
 */
export const buildLegacyChatThreadPlan = ({
  conversation,
  canonicalConversation = null,
  messages = [],
  canonicalMessageCount = 0,
  workerProfile,
} = {}) => {
  const report = baseReport({ conversation, canonicalConversation, messages, canonicalMessageCount });

  if (!conversation && canonicalConversation && canonicalMessageCount === LEGACY_CHAT_THREAD.expectedMessageCount) {
    return {
      ...report,
      legacyMessageCount: 0,
      currentParticipantIds: null,
      preconditionsPassed: true,
      status: 'already_migrated',
    };
  }

  if (!conversation) report.reasons.push('LEGACY_CONVERSATION_MISSING');
  if (canonicalConversation) report.reasons.push('CANONICAL_CONVERSATION_ALREADY_EXISTS');
  if (messages.length !== LEGACY_CHAT_THREAD.expectedMessageCount) {
    report.reasons.push('UNEXPECTED_LEGACY_MESSAGE_COUNT');
  }
  if (!workerProfile
    || String(workerProfile.id) !== LEGACY_CHAT_THREAD.workerProfileId
    || String(workerProfile.userId) !== LEGACY_CHAT_THREAD.workerUserId) {
    report.reasons.push('WORKER_PROFILE_MAPPING_MISMATCH');
  }
  if (conversation && !sameMembers(conversation.participantIds, [
    LEGACY_CHAT_THREAD.employerUserId,
    LEGACY_CHAT_THREAD.workerProfileId,
  ])) {
    report.reasons.push('UNEXPECTED_PARTICIPANTS');
  }

  const allowedIds = new Set([
    LEGACY_CHAT_THREAD.employerUserId,
    LEGACY_CHAT_THREAD.workerProfileId,
  ]);
  for (const message of messages) {
    if (String(message.conversationId) !== LEGACY_CHAT_THREAD.legacyConversationId) {
      report.reasons.push('MESSAGE_CONVERSATION_ID_MISMATCH');
      break;
    }
    if (!allowedIds.has(String(message.senderId)) || !allowedIds.has(String(message.recipientId))) {
      report.reasons.push('UNEXPECTED_MESSAGE_PARTICIPANT');
      break;
    }
  }

  report.preconditionsPassed = report.reasons.length === 0;
  report.wouldApply = report.preconditionsPassed;
  report.status = report.preconditionsPassed ? 'ready' : 'blocked';
  return report;
};

/** Apply identity-only updates inside a caller-owned Mongo transaction. */
export const applyLegacyChatThreadPlan = async ({
  conversationModel,
  messageModel,
  messages = [],
  session,
} = {}) => {
  if (!conversationModel || !messageModel || !session) {
    throw new Error('Conversation model, Message model, and Mongo session are required');
  }

  const conversationResult = await conversationModel.updateOne(
    {
      conversationId: LEGACY_CHAT_THREAD.legacyConversationId,
      participantIds: { $all: [LEGACY_CHAT_THREAD.employerUserId, LEGACY_CHAT_THREAD.workerProfileId] },
    },
    {
      $set: {
        conversationId: LEGACY_CHAT_THREAD.canonicalConversationId,
        participantIds: [LEGACY_CHAT_THREAD.workerUserId, LEGACY_CHAT_THREAD.employerUserId].sort(),
      },
    },
    { session, timestamps: false },
  );

  if (conversationResult.matchedCount !== 1) {
    throw new Error('Legacy conversation changed before migration');
  }

  if (messages.length !== LEGACY_CHAT_THREAD.expectedMessageCount) {
    throw new Error('Legacy message count changed before migration');
  }

  let messagesModified = 0;
  for (const message of messages) {
    const data = { conversationId: LEGACY_CHAT_THREAD.canonicalConversationId };
    if (String(message.senderId) === LEGACY_CHAT_THREAD.workerProfileId) {
      data.senderId = LEGACY_CHAT_THREAD.workerUserId;
    }
    if (String(message.recipientId) === LEGACY_CHAT_THREAD.workerProfileId) {
      data.recipientId = LEGACY_CHAT_THREAD.workerUserId;
    }

    const result = await messageModel.updateOne(
      {
        _id: message._id,
        conversationId: LEGACY_CHAT_THREAD.legacyConversationId,
      },
      { $set: data },
      { session, timestamps: false },
    );
    if (result.matchedCount !== 1) {
      throw new Error(`Legacy message changed before migration: ${message._id}`);
    }
    messagesModified += result.modifiedCount || 0;
  }

  return {
    conversationMatched: conversationResult.matchedCount,
    messagesMatched: messages.length,
    messagesModified,
  };
};

export const executeLegacyChatThreadMigration = async ({
  inspect,
  apply,
  dryRun = true,
} = {}) => {
  if (typeof inspect !== 'function' || typeof apply !== 'function') {
    throw new Error('inspect and apply callbacks are required');
  }

  const report = await inspect();
  if (dryRun || report.status === 'already_migrated') {
    return { ...report, applied: false };
  }
  if (!report.preconditionsPassed) {
    throw new Error(`Preconditions failed: ${report.reasons.join(', ')}`);
  }

  await apply();
  return { ...report, applied: true };
};
