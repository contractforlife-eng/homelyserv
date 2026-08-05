// backend/scripts/test-staff-identity.js
// ============================================================
// STAFF IDENTITY SYSTEM - Offline verification tests
// Verifies the identity helpers WITHOUT a database connection:
//   - identity object shaping
//   - graceful fallback when the DB is unreachable / ids are legacy
//   - never-throws behavior (enrichment always returns data)
// Run: node scripts/test-staff-identity.js
// ============================================================
import {
  isValidObjectId,
  toIdentityObject,
  isStaffRole,
  enrichMessageIdentities,
  enrichAuthorIdentities,
} from '../src/utils/staffIdentity.js';

let passed = 0;
let failed = 0;

const assert = (condition, label) => {
  if (condition) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.error(`  ❌ ${label}`);
  }
};

console.log('\n--- isValidObjectId ---');
assert(isValidObjectId('665f1a2b3c4d5e6f7a8b9c0d') === true, 'accepts 24-char hex');
assert(isValidObjectId('user_1784367005840') === false, 'rejects legacy id');
assert(isValidObjectId(null) === false, 'rejects null');

console.log('\n--- toIdentityObject ---');
const identity = toIdentityObject({ id: '665f1a2b3c4d5e6f7a8b9c0d', fullName: 'Rania', role: 'SUPPORT', image: 'img.png', email: 'r@h.com' });
assert(identity.name === 'Rania', 'maps fullName -> name');
assert(identity.role === 'SUPPORT', 'keeps role');
assert(toIdentityObject(null) === null, 'null user -> null');

console.log('\n--- isStaffRole ---');
assert(isStaffRole('SUPPORT') && isStaffRole('ADMIN') && isStaffRole('SUP_ADMIN'), 'staff roles detected');
assert(!isStaffRole('WORKER') && !isStaffRole('EMPLOYER'), 'non-staff roles rejected');

console.log('\n--- enrichMessageIdentities (DB offline -> graceful fallback) ---');
const messages = [
  { senderId: '665f1a2b3c4d5e6f7a8b9c0d', senderName: 'Support Agent', senderRole: 'SUPPORT', recipientId: 'legacy_user', recipientName: 'Ali', text: 'hi' },
  { senderId: null, senderName: 'System', text: 'started' },
];
const enrichedMessages = await enrichMessageIdentities(messages);
assert(Array.isArray(enrichedMessages) && enrichedMessages.length === 2, 'returns all messages');
assert(enrichedMessages[0].senderName === 'Support Agent', 'falls back to stored name when DB offline');
assert(enrichedMessages[0].sender.id === '665f1a2b3c4d5e6f7a8b9c0d', 'adds sender object with id/name/role');
assert(enrichedMessages[0].recipientName === 'Ali', 'legacy recipient id keeps stored name');

console.log('\n--- enrichAuthorIdentities (legacy/invalid ids) ---');
const replies = [
  { id: 'r1', authorId: 'not-an-objectid', authorName: 'Admin', authorRole: 'ADMIN', message: 'hello' },
  { id: 'r2', authorId: null, authorName: null, authorRole: null, message: 'sys' },
];
const enrichedReplies = await enrichAuthorIdentities(replies);
assert(enrichedReplies[0].authorName === 'Admin', 'keeps stored name for legacy id');
assert(enrichedReplies[0].author.name === 'Admin', 'author object built from stored snapshot');
assert(enrichedReplies[1].author === null, 'no authorId -> author null');

console.log(`\n=== RESULT: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
