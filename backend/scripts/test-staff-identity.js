// backend/scripts/test-staff-identity.js
// ============================================================
// STAFF IDENTITY SYSTEM - Offline verification tests
// Verifies the identity helpers WITHOUT a database connection:
//   - identity object shaping
//   - graceful fallback when the DB is unreachable / ids are legacy
//   - never-throws behavior (enrichment always returns data)
//
// Phase 1 focus: SUPPORT_HELPER is a recognized staff role for DISPLAY and
// can be assigned by Admins, but it is deliberately EXCLUDED from every
// authorization gate (private chat, payments, support tickets, employer
// profile access). These tests assert that boundary statically.
//
// Run: node scripts/test-staff-identity.js
// ============================================================
import { readFileSync } from 'fs';
import {
  isValidObjectId,
  toIdentityObject,
  isStaffRole,
  STAFF_ROLES,
  enrichMessageIdentities,
  enrichAuthorIdentities,
} from '../src/utils/staffIdentity.js';

let passed = 0;
let failed = 0;

const assert = (condition, label) => {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}`);
  }
};

// Read a sibling source file relative to this script.
const HERE = new URL('.', import.meta.url);
const read = (p) => readFileSync(new URL(p, HERE), 'utf8');

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
assert(isStaffRole('SUPPORT') && isStaffRole('ADMIN') && isStaffRole('SUP_ADMIN') && isStaffRole('SUPPORT_HELPER'), 'staff roles detected (incl. SUPPORT_HELPER)');
assert(isStaffRole('support_helper') === true, 'staff role detection is case-insensitive');
assert(!isStaffRole('WORKER') && !isStaffRole('EMPLOYER'), 'non-staff roles rejected');

console.log('\n--- SUPPORT_HELPER persistence (enums + admin allowlist) ---');
const mongooseSchema = read('../src/models/User.js');
assert(mongooseSchema.includes("'SUPPORT_HELPER'"), 'Mongoose User role enum includes SUPPORT_HELPER');
const prismaSchema = read('../prisma/schema.prisma');
assert(prismaSchema.includes('SUPPORT_HELPER'), 'Prisma Role enum includes SUPPORT_HELPER');
const adminRoute = read('../src/routes/admin.js');
assert(adminRoute.includes('SUPPORT_HELPER'), 'admin role-change allowlist includes SUPPORT_HELPER');

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

console.log('\n--- Security boundaries: SUPPORT_HELPER must NOT grant broad private-chat authorization ---');
const chatJs = read('../src/routes/chat.js');
assert(
  chatJs.includes("const STAFF_ROLES = new Set(['ADMIN', 'SUPPORT']);"),
  'chat.js private-chat STAFF_ROLES must remain ADMIN+SUPPORT only (no SUPPORT_HELPER)'
);
const paymentAuth = read('../src/services/paymentAuthService.js');
assert(
  !paymentAuth.includes("SUPPORT_HELPER"),
  'paymentAuthService.js must not include SUPPORT_HELPER'
);
const publicSupportAccess = read('../src/services/publicSupportAccessService.js');
assert(
  !publicSupportAccess.includes('SUPPORT_HELPER'),
  'publicSupportAccessService.js must not include SUPPORT_HELPER'
);
const employerProfileAuth = read('../src/services/employerProfileAuthorization.js');
assert(
  !employerProfileAuth.includes('SUPPORT_HELPER'),
  'employerProfileAuthorization.js must not include SUPPORT_HELPER'
);
const reportValidation = read('../src/services/reportValidationService.js');
assert(
  !reportValidation.includes('SUPPORT_HELPER'),
  'reportValidationService.js must not include SUPPORT_HELPER'
);

console.log('\n--- Phase 2C: SUPPORT_HELPER allowed only in scoped internal messaging ---');
const supHelpRoute = read('../src/routes/supHelp.js');
assert(
  supHelpRoute.includes('SUPPORT_HELPER'),
  'supHelp.js may reference SUPPORT_HELPER for scoped internal messaging'
);

console.log(`\n=== RESULT: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
