// frontend/src/store/sidebarCountersRequestGate.test.js
// ============================================================
// Regression test for the phantom "1" Sup-Admin messages badge.
//
// Reproduces the exact root cause: two overlapping
// GET /api/sidebar/counters requests where the OLDER response
// (computed while a message was still unread -> messages: 1)
// resolves AFTER the NEWER response (messages: 0). The stale
// response must be ignored so the badge reflects the real count.
//
// Run: node --test src/store/sidebarCountersRequestGate.test.js
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestGate } from './sidebarCountersRequestGate.js';

test('stale out-of-order sidebar-counter response cannot overwrite a fresh count', () => {
  const gate = createRequestGate();

  // 1. A poll/socket refresh starts while the message is still unread (-> 1).
  const staleId = gate.next();

  // 2. The user reads the message: markMessagesAsRead then dispatches an
  //    immediate refresh, which starts a newer request (-> 0).
  const freshId = gate.next();

  // 3. Responses resolve OUT OF ORDER: the newer one first, then the older.
  let counters = { messages: 0 };
  const applyIfLatest = (id, next) => {
    if (gate.isLatest(id)) counters = next;
  };

  applyIfLatest(freshId, { messages: 0 }); // fresh response arrives first
  applyIfLatest(staleId, { messages: 1 }); // stale response arrives last

  // The stale "1" must NOT win - the badge stays hidden (0 unread).
  assert.equal(counters.messages, 0);
});

test('the newest response is applied normally (no false negatives)', () => {
  const gate = createRequestGate();

  const firstId = gate.next();
  const secondId = gate.next();

  assert.equal(gate.isLatest(firstId), false);
  assert.equal(gate.isLatest(secondId), true);

  // Only the newest id is accepted.
  let counters = { messages: 0 };
  if (gate.isLatest(secondId)) counters = { messages: 2 };
  if (gate.isLatest(firstId)) counters = { messages: 9 };
  assert.equal(counters.messages, 2);
});
