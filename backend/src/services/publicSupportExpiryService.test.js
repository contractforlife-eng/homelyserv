import test from 'node:test';
import assert from 'node:assert/strict';
import PublicSupportConversation from '../models/PublicSupportConversation.js';
import { canSendToPublicSupportConversation, expireConversationIfInactive, isInactiveConversation } from './publicSupportExpiryService.js';

const now = new Date('2026-08-14T12:00:00.000Z');
const old = new Date(now.getTime() - 31 * 60_000);
const recent = new Date(now.getTime() - 29 * 60_000);

const fakeConversation = (status, lastActivityAt = old) => ({ _id:`id-${status}`, publicId:`public-${status}`, status, language:'en', lastActivityAt });
const fakeModelFor = (conversation) => ({
  findOneAndUpdate: async (_filter, update) => ({ ...conversation, ...update.$set }),
});

for (const status of ['BOT','WAITING_FOR_SUPPORT','ASSIGNED']) {
  test(`${status} conversation expires after the inactivity timeout`, async () => {
    const conversation = fakeConversation(status);
    const result = await expireConversationIfInactive(conversation, { now, ConversationModel:fakeModelFor(conversation), io:null });
    assert.equal(result.status, 'CLOSED');
    assert.equal(result.closeReason, 'INACTIVITY_TIMEOUT');
    assert.equal(result.closedAt, now);
  });
}

test('recent conversation remains open', async () => {
  const conversation = fakeConversation('BOT', recent);
  const result = await expireConversationIfInactive(conversation, { now, ConversationModel:{ findOneAndUpdate:() => assert.fail('must not update') }, io:null });
  assert.equal(result.status, 'BOT');
});

test('already closed conversation is ignored by expiration', () => {
  assert.equal(isInactiveConversation(fakeConversation('CLOSED'), now), false);
});

test('visitor cannot send into an expired closed conversation', () => {
  assert.equal(canSendToPublicSupportConversation({ status:'CLOSED' }), false);
});

test('a new session after expiry starts as an independent BOT conversation', () => {
  const next = new PublicSupportConversation({ publicId:'new-session', accessTokenHash:'hash' });
  assert.equal(next.status, 'BOT');
  assert.ok(next.lastActivityAt instanceof Date);
  assert.equal(canSendToPublicSupportConversation(next), true);
});
