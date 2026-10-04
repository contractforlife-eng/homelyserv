import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEmployerPaymentsCounterWhere,
  buildWorkerPaymentsCounterWhere,
  buildWorkerActionableEarningsWhere,
  buildSupportComplaintsCounterWhere,
  buildEscalatedHandoffConversationWhere,
  buildMessagesCounterWhere,
  countUnreadMessages,
} from './sidebarCountersService.js';

test('Worker payment badge counts only payer-owned awaiting-transfer items', () => {
  assert.deepEqual(buildWorkerPaymentsCounterWhere('worker-1'), {
    status: 'pending',
    manualReviewState: 'awaiting_transfer',
    userId: 'worker-1',
  });
});
test('Employer payment badge counts only employer-owned awaiting-transfer items', () => {
  assert.deepEqual(buildEmployerPaymentsCounterWhere('employer-1'), {
    status: 'pending',
    manualReviewState: 'awaiting_transfer',
    OR: [
      { userId: 'employer-1' },
      { employerId: 'employer-1' },
    ],
  });
});

test('Worker Hires badge targets pending earning actions for active hires', () => {
  assert.deepEqual(buildWorkerActionableEarningsWhere('worker-1', ['hire-1']), {
    workerId: 'worker-1',
    hireId: { in: ['hire-1'] },
    status: 'PENDING',
  });
});

test('Support complaints badge excludes waiting-for-user work', () => {
  assert.deepEqual(buildSupportComplaintsCounterWhere('support-1'), {
    OR: [
      {
        status: 'NEW',
        OR: [
          { assignedSupport: null },
          { assignedSupport: 'support-1' },
        ],
      },
      {
        assignedSupport: 'support-1',
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    ],
  });
});

// ============================================================
// REGRESSION: Sup-Admin unread Messages badge vs ESCALATED hand-off
// ------------------------------------------------------------
// A conversation escalated to Co-Admin is no longer owned/actionable by the
// former Sup-Admin, so its unread messages must not keep the sidebar badge
// lit. The eligible rule is ownership (supportAgentId === userId) + the
// existing escalation state (type='ESCALATED' + escalatedAt).
// ============================================================

test('Escalated hand-off filter uses the existing ownership + escalation state', () => {
  assert.deepEqual(buildEscalatedHandoffConversationWhere('support-1'), {
    supportAgentId: 'support-1',
    type: 'ESCALATED',
    escalatedAt: { $ne: null },
  });
});

test('Messages counter where excludes handed-off conversations only when present', () => {
  assert.deepEqual(buildMessagesCounterWhere('support-1'), {
    recipientId: 'support-1',
    read: false,
  });
  assert.deepEqual(buildMessagesCounterWhere('support-1', ['conv_escalated']), {
    recipientId: 'support-1',
    read: false,
    conversationId: { $nin: ['conv_escalated'] },
  });
});

// Minimal matcher so the counter can be proven against fake data (no DB).
const makeCounterDeps = ({ messages = [], escalatedConversationIds = [] }) => {
  const matches = (where, doc) => {
    if (where.recipientId !== undefined && String(doc.recipientId) !== String(where.recipientId)) return false;
    if (where.read !== undefined && doc.read !== where.read) return false;
    if (where.conversationId?.$nin && where.conversationId.$nin.map(String).includes(String(doc.conversationId))) {
      return false;
    }
    return true;
  };
  return {
    messageModel: {
      countDocuments: async (where) => messages.filter((m) => matches(where, m)).length,
    },
    conversationModel: {
      distinct: async () => escalatedConversationIds,
    },
  };
};

test('Sup-Admin unread counter: an unread message in a normal visible conversation IS counted (1)', async () => {
  const deps = makeCounterDeps({
    messages: [{ recipientId: 'support-1', read: false, conversationId: 'conv_visible' }],
    escalatedConversationIds: [],
  });
  assert.equal(await countUnreadMessages('support-1', 'SUPPORT', deps), 1);
});

test('Sup-Admin unread counter: an unread message in an ESCALATED hand-off is NOT counted', async () => {
  const deps = makeCounterDeps({
    messages: [
      { recipientId: 'support-1', read: false, conversationId: 'conv_visible' },
      { recipientId: 'support-1', read: false, conversationId: 'conv_escalated' },
    ],
    escalatedConversationIds: ['conv_escalated'],
  });
  assert.equal(await countUnreadMessages('support-1', 'SUPPORT', deps), 1);
});

test('Sup-Admin unread counter: two valid unread messages produce 2 (hand-off ignored)', async () => {
  const deps = makeCounterDeps({
    messages: [
      { recipientId: 'support-1', read: false, conversationId: 'conv_a' },
      { recipientId: 'support-1', read: false, conversationId: 'conv_b' },
      { recipientId: 'support-1', read: false, conversationId: 'conv_escalated' },
    ],
    escalatedConversationIds: ['conv_escalated'],
  });
  assert.equal(await countUnreadMessages('support-1', 'SUPPORT', deps), 2);
});

test('Sup-Admin unread counter: no unread messages produce 0', async () => {
  const deps = makeCounterDeps({
    messages: [{ recipientId: 'support-1', read: true, conversationId: 'conv_a' }],
    escalatedConversationIds: [],
  });
  assert.equal(await countUnreadMessages('support-1', 'SUPPORT', deps), 0);
});

test('Unread counter for other roles is unchanged by the Sup-Admin rule', async () => {
  const deps = makeCounterDeps({
    messages: [{ recipientId: 'worker-1', read: false, conversationId: 'conv_escalated' }],
    escalatedConversationIds: ['conv_escalated'],
  });
  // WORKER keeps the original rule: the message is still counted.
  assert.equal(await countUnreadMessages('worker-1', 'WORKER', deps), 1);
});
