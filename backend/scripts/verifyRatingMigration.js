// backend/scripts/verifyRatingMigration.js
// ============================================================
// Local-only migration-safety verification for the Rating Phase 1 schema.
//
// Targets a SEPARATE, isolated test database (NOT Production/Atlas). The
// script refuses to run unless DATABASE_URL points to localhost/127.0.0.1.
//
// NOTE: The local standalone mongod is NOT a replica set, so Prisma's
// interactive `$transaction` (used by submitRating) cannot run here — that
// path is unit-tested with the mock and runs on Production Atlas (a RS).
// This script therefore exercises the ACTUAL MongoDB unique index via raw
// commands (no transactions required): index creation, duplicate rejection
// (real E11000), backfill, and opposite-direction coexistence.
//
// Steps: drop+push schema (creates the real unique index), seed a
// WorkerProfile + legacy-shaped Reviews, audit (duplicate preflight),
// backfill, verify the index, verify migrated records + aggregate, prove
// the index rejects a duplicate insert (E11000), prove opposite-direction
// coexistence, prove duplicate-legacy detection, then clean up.
// ============================================================
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { ObjectId } from 'bson';

const TEST_DB = process.env.DATABASE_URL;
if (!/^(mongodb(?:\+srv)?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:[0-9]+)?\//.test(TEST_DB || '')) {
  console.error('REFUSING: DATABASE_URL must point to localhost for this local-only verification.');
  process.exit(3);
}

const p = new PrismaClient();
const log = (...a) => console.log('[verify]', ...a);
const oid = (hex) => new ObjectId(hex);
const firstBatch = (res) => res?.cursor?.firstBatch ?? res?.documents ?? [];
// Normalize a value that may be (a) a hex string, (b) a BSON ObjectId
// deserialized by $runCommandRaw into { $oid: '<hex>' }, or (c) a BSON
// ObjectId instance. Always yields the 24-hex string.
const toStr = (v) => {
  if (v == null) return v;
  if (typeof v === 'object' && '$oid' in v) return String(v.$oid);
  return String(v);
};
const findReviews = async (filter = {}) => firstBatch(await p.$runCommandRaw({ find: 'Review', filter }));

// Fixed 24-hex ids
const WPID = '333333333333333333333333';
const WUID = '222222222222222222222222';
const EUID = '111111111111111111111111';
const H_BACK = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const H_BACK2 = 'dddddddddddddddddddddddd';
const H_DUP = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const H_COEX = 'cccccccccccccccccccccccc';

let pass = true;
const check = (name, cond) => { if (!cond) pass = false; log('  [%s] %s', cond ? 'PASS' : 'FAIL', name); };

async function pushSchema() {
  log('prisma db push (local test DB) ...');
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    env: { ...process.env, DATABASE_URL: TEST_DB }, stdio: 'inherit',
  });
}

async function main() {
  log('Dropping isolated test DB (clean slate) ...');
  await p.$runCommandRaw({ dropDatabase: 1 });

  await pushSchema();

  // ---- Seed WorkerProfile + legacy-shaped Reviews (old model) ----
  // Seeded via mongosh so _id/userId are REAL BSON ObjectIds exactly like
  // production Mongoose data. ($runCommandRaw serializes through JSON and
  // coerces ObjectIds to strings, which Prisma cannot read back — the raw
  // wrapper stores strings, not BSON.) Real ObjectIds are required for the
  // Prisma backfill (workerProfile.findUnique) and for the unique-index
  // key comparison to be honest.
  log('Seeding WorkerProfile + legacy Reviews (BSON-faithful via mongosh) ...');
  const seedScript = `
    db.WorkerProfile.insertOne({
      _id: ObjectId('${WPID}'), userId: ObjectId('${WUID}'), category: 't',
      experienceYears: 0, expectedSalary: 0, availability: 'available',
      ratingAvg: 0, ratingCount: 0,
      createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01')
    });
    db.Review.insertMany([
      { hireId: ObjectId('${H_BACK}'), employerId: ObjectId('${EUID}'), workerId: ObjectId('${WPID}'),
        rating: 5, comment: 'legacy a', createdAt: new Date('2025-01-01') },
      { hireId: ObjectId('${H_BACK2}'), employerId: ObjectId('${EUID}'), workerId: ObjectId('${WPID}'),
        rating: 4, comment: 'legacy b', createdAt: new Date('2025-02-01') }
    ]);
  `;
  execSync(`mongosh "${TEST_DB}" --quiet --eval "${seedScript.replace(/\n/g, ' ')}" --norc`, { stdio: 'inherit' });
  const seededWp = await p.workerProfile.findUnique({ where: { id: WPID } });
  log('  seeded WorkerProfile readable via Prisma: %s', Boolean(seededWp));
  check('seeded WorkerProfile readable via Prisma findUnique', Boolean(seededWp) && String(seededWp.userId) === WUID);

  // ---- Duplicate preflight (read-only) ----
  log('Duplicate preflight (legacy, non-duplicate set) ...');
  const { auditLegacyReviews, backfillLegacyReviews } = await import('./backfillLegacyReviews.js');
  const preflight = await auditLegacyReviews(p);
  log('  legacyCount=%d duplicates=%d', preflight.legacyCount, preflight.duplicates.length);
  check('preflight legacy count == 2', preflight.legacyCount === 2);
  check('preflight detects no duplicates in this set', preflight.duplicates.length === 0);

  // ---- Backfill legacy -> directional ----
  // The isolated local mongod is NOT a replica set (no transactions), so
  // Prisma's typed `update` cannot run here. We inject a native-driver
  // writer that performs the identical BSON $set update via mongosh —
  // exactly what the production Mongoose/Atlas write does. The audit + 
  // WorkerProfile resolution still run through the real Prisma client.
  log('Backfill legacy -> directional (apply) ...');
  const applyWrite = async (legacyDoc, workerProfile) => {
    const script = `
      db.Review.updateOne(
        { _id: ObjectId('${toStr(legacyDoc._id)}') },
        { $set: {
            reviewerUserId: ObjectId('${toStr(legacyDoc.employerId)}'),
            revieweeUserId: ObjectId('${toStr(workerProfile.userId)}'),
            direction: 'EMPLOYER_TO_WORKER',
            updatedAt: new Date()
        } }
      );
    `;
    execSync(`mongosh "${TEST_DB}" --quiet --eval "${script.replace(/\n/g, ' ')}" --norc`, { stdio: 'inherit' });
  };
  const bf = await backfillLegacyReviews(p, { apply: true, applyWrite });
  log('  applied=%s migrated=%d failed=%d', bf.applied, bf.migrated, bf.failed?.length ?? 0);
  check('backfill migrated 2', bf.applied && bf.migrated === 2 && (bf.failed?.length ?? 0) === 0);

  // ---- Verify the ACTUAL MongoDB unique index ----
  log('Verifying actual MongoDB unique index ...');
  const indexes = firstBatch(await p.$runCommandRaw({ listIndexes: 'Review' }));
  const uniqueIdx = indexes.find((i) => i.unique && i.key && i.key.hireId && i.key.reviewerUserId && i.key.direction);
  log('  unique index present: %s (%s)', Boolean(uniqueIdx), uniqueIdx ? JSON.stringify(uniqueIdx.key) : 'none');
  check('unique index exists on (hireId, reviewerUserId, direction)', Boolean(uniqueIdx));

  // ---- Verified migrated records remain readable + aggregate ----
  log('Verifying migrated records readable + Worker aggregate ...');
  const migrated = await findReviews({ direction: 'EMPLOYER_TO_WORKER' });
  const allOk = migrated.length === 2 && migrated.every((d) =>
    toStr(d.revieweeUserId) === WUID && toStr(d.reviewerUserId) === EUID && toStr(d.direction) === 'EMPLOYER_TO_WORKER'
  );
  log('  migrated EMPLOYER_TO_WORKER count=%d', migrated.length);
  check('migrated records readable with correct derived identities', allOk);
  const avg = migrated.reduce((s, d) => s + d.rating, 0) / migrated.length;
  log('  computed Worker avg=%s (expect 4.5)', avg);
  check('Worker average computed correctly (4.5)', avg === 4.5);

  // ---- REAL index duplicate: duplicate insert is atomically rejected ----
  // The Prisma raw command wrapper does not surface writeErrors cleanly for
  // MongoDB; the authoritative proof that the unique index enforced is that
  // the persisted record count for the duplicate key NEVER exceeds one.
  log('Real DB duplicate rejection (two same-direction inserts) ...');
  const dupDoc = () => ({ hireId: H_DUP, reviewerUserId: EUID, revieweeUserId: WUID, direction: 'EMPLOYER_TO_WORKER', rating: 3 });
  await p.$runCommandRaw({ insert: 'Review', documents: [dupDoc()] }); // 1st succeeds
  const afterFirst = await findReviews({ hireId: H_DUP, direction: 'EMPLOYER_TO_WORKER' });
  await p.$runCommandRaw({ insert: 'Review', documents: [dupDoc()] }); // 2nd must be dropped
  const afterDup = await findReviews({ hireId: H_DUP, direction: 'EMPLOYER_TO_WORKER' });
  log('  records after 1st insert=%d; records after 2nd (duplicate) insert=%d', afterFirst.length, afterDup.length);
  check('first insert persisted (count == 1)', afterFirst.length === 1);
  check('duplicate insert did NOT increase persisted count', afterDup.length === 1);

  // ---- REAL CONCURRENT duplicate-rating: simultaneous identical inserts ----
  // Fire N identical (hireId, reviewerUserId, direction) inserts at once —
  // the unique index must atomically allow exactly ONE and drop the rest,
  // leaving exactly one persisted record. This mirrors the real API race
  // (two tabs / retries / hammered endpoint).
  log('Real CONCURRENT duplicate rejection (N simultaneous identical inserts) ...');
  const H_RACE = 'eeeeeeeeeeeeeeeeeeeeeeee';
  const CONCURRENCY = 8;
  await Promise.allSettled(
    Array.from({ length: CONCURRENCY }, () => p.$runCommandRaw({
      insert: 'Review',
      documents: [{
        hireId: H_RACE, reviewerUserId: EUID, revieweeUserId: WUID,
        direction: 'EMPLOYER_TO_WORKER', rating: 3,
      }],
    }))
  );
  const afterRace = await findReviews({ hireId: H_RACE, direction: 'EMPLOYER_TO_WORKER' });
  log('  %d concurrent identical inserts; persisted records=%d', CONCURRENCY, afterRace.length);
  check('exactly one record persists after concurrent race', afterRace.length === 1);

  // ---- Opposite concurrent duplicates on another Hire: WORKER→EMPLOYER burst ----
  log('Real CONCURRENT Worker→Employer duplicate rejection ...');
  const H_RACE_W2E = 'ffffffffffffffffffffffff';
  await Promise.allSettled(
    Array.from({ length: CONCURRENCY }, () => p.$runCommandRaw({
      insert: 'Review',
      documents: [{
        hireId: H_RACE_W2E, reviewerUserId: WUID, revieweeUserId: EUID,
        direction: 'WORKER_TO_EMPLOYER', rating: 4,
      }],
    }))
  );
  const afterW2E = await findReviews({ hireId: H_RACE_W2E, direction: 'WORKER_TO_EMPLOYER' });
  log('  ', 'concurrent Worker→Employer identical inserts; persisted records=%d', afterW2E.length);
  check('exactly one Worker→Employer record persists after concurrent race', afterW2E.length === 1);

  // ---- Opposite-direction coexistence on the same Hire ----
  log('Opposite-direction coexistence on same Hire ...');
  await p.$runCommandRaw({ insert: 'Review', documents: [
    { hireId: H_COEX, reviewerUserId: EUID, revieweeUserId: WUID, direction: 'EMPLOYER_TO_WORKER', rating: 5 },
    { hireId: H_COEX, reviewerUserId: WUID, revieweeUserId: EUID, direction: 'WORKER_TO_EMPLOYER', rating: 4 },
  ] });
  const coex = await findReviews({ hireId: H_COEX });
  const dirs = coex.map((d) => d.direction).sort();
  log('  directions=%j count=%d', dirs, coex.length);
  check('both directions coexist on same Hire', coex.length === 2 && dirs.join(',') === 'EMPLOYER_TO_WORKER,WORKER_TO_EMPLOYER');

  // ---- Duplicate-legacy detection in PRE-INDEX state (no auto-delete) ----
  // In production the legacy direction-less documents PRE-DATE the unique
  // index. Duplicate legacy pairs can therefore only exist in a database
  // where the index does NOT yet exist — once the index is present, a second
  // identical (hireId, employerId, direction=null) insert is rejected, so you
  // cannot even insert duplicates post-index. To verify the real migration
  // hazard, we drop the unique index in the isolated DB (simulating the
  // pre-migration database), seed the duplicate legacy pair, prove:
  //   1. the audit DETECTS the duplicate group (hireId + reviewerUserId);
  //   2. backfill REFUSES to run (never auto-deletes);
  //   3. re-creating the unique index is properly BLOCKED by the dups
  //      (the production migration would stop here for manual resolution).
  log('Duplicate-legacy detection in pre-index state (index dropped) ...');
  await p.$runCommandRaw({
    dropIndexes: 'Review',
    index: 'Review_hireId_reviewerUserId_direction_key',
  });
  const dupSeedScript = `
    db.Review.insertMany([
      { hireId: ObjectId('${H_BACK}'), employerId: ObjectId('${EUID}'), workerId: ObjectId('${WPID}'),
        rating: 2, createdAt: new Date('2025-03-01') },
      { hireId: ObjectId('${H_BACK}'), employerId: ObjectId('${EUID}'), workerId: ObjectId('${WPID}'),
        rating: 1, createdAt: new Date('2025-04-01') }
    ]);
  `;
  execSync(`mongosh "${TEST_DB}" --quiet --eval "${dupSeedScript.replace(/\n/g, ' ')}" --norc`, { stdio: 'inherit' });
  const dupAudit = await auditLegacyReviews(p);
  const dupReported = dupAudit.duplicates.some((d) => toStr(d.hireId) === H_BACK && toStr(d.reviewerUserId) === EUID);
  log('  total=%d legacy=%d duplicateGroups=%d', dupAudit.total, dupAudit.legacyCount, dupAudit.duplicates.length);
  check('duplicate-legacy group detected (hire+reviewer)', dupReported);
  const dupBackfill = await backfillLegacyReviews(p, { apply: true });
  log('  backfill refused=%s reason=%s', dupBackfill.stopped === true, dupBackfill.reason);
  check('backfill refuses to apply when duplicates exist (no auto-delete)', dupBackfill.stopped === true && dupBackfill.applied === false);
  let blockedByDup = false;
  try {
    await p.$runCommandRaw({
      createIndexes: 'Review',
      indexes: [{
        key: { hireId: 1, reviewerUserId: 1, direction: 1 },
        name: 'Review_hireId_reviewerUserId_direction_key',
        unique: true,
      }],
    });
  } catch (e) {
    blockedByDup = /duplicate key|E11000|11000/i.test(e?.message || '');
  }
  // Authoritative proof: the unique index must NOT exist after the attempt
  // (MongoDB refuses to build a unique index over duplicate keys). If the
  // raw command wrapper swallowed the error, the index absence still proves
  // the safety stop worked.
  const idxAfter = firstBatch(await p.$runCommandRaw({ listIndexes: 'Review' }));
  const stillAbsent = !idxAfter.some(
    (i) => i.unique && i.key && i.key.hireId && i.key.reviewerUserId && i.key.direction
  );
  blockedByDup = blockedByDup || stillAbsent;
  log('  index re-creation blocked by duplicates=%s (index absent=%s)', blockedByDup, stillAbsent);
  check('unique index cannot be created while duplicates exist (safety stop)', blockedByDup && stillAbsent);

  log('=== SUMMARY: %s ===', pass ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED');
  log('Cleaning up isolated test DB ...');
  await p.$runCommandRaw({ dropDatabase: 1 });
  await p.$disconnect();
  process.exitCode = pass ? 0 : 1;
}

main().catch(async (e) => {
  console.error('VERIFY ERROR:', e);
  try { await p.$disconnect(); } catch {}
  process.exit(1);
});
