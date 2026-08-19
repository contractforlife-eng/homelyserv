// backend/scripts/backfillLegacyReviews.js
// ============================================================
// Idempotent, safe backfill of LEGACY Review documents into the new
// directional Review schema.
//
// Legacy Review (old model) fields:
//   employerId  -> User.id of the reviewer (Employer)
//   workerId    -> WorkerProfile.id of the reviewee
//   hireId, rating, comment, createdAt
//
// New Review fields (per schema.prisma):
//   reviewerUserId = old employerId
//   revieweeUserId = WorkerProfile.userId (resolved from old workerId)
//   direction      = EMPLOYER_TO_WORKER
//   hireId, rating, comment, createdAt preserved
//
// Only documents WITHOUT a `direction` field are processed (idempotent:
// already-migrated docs are left untouched). If a WorkerProfile cannot be
// resolved from the legacy workerId, that record is reported and NEVER
// corrupted. Duplicate (hireId, reviewerUserId, direction) combinations are
// detected BEFORE any write and the run is aborted (never auto-deleted).
//
// SAFETY:
//   - Default mode is `--check` (read-only audit + duplicate detection).
//   - `--apply` requires env REVIEW_BACKFILL_APPLY=yes AND refuses to run
//     against any non-localhost DATABASE_URL (never Production/Atlas).
// ============================================================
import prisma from '../src/lib/prisma.js';

const isLegacy = (doc) => doc && !('direction' in doc);
const isLocalhost = (url = '') => /^(mongodb(?:\+srv)?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:[0-9]+)?\//.test(url);

const firstBatch = (res) => res?.cursor?.firstBatch ?? res?.documents ?? res?.firstBatch ?? [];

// Normalize a value that may be (a) a hex string, (b) a BSON ObjectId
// deserialized by $runCommandRaw into { $oid: '<hex>' }, or (c) a BSON
// ObjectId instance from mongodb/bson. Always yields the 24-hex string.
const oidStr = (value) => {
  if (value == null) return value;
  if (typeof value === 'object' && '$oid' in value) return String(value.$oid);
  return String(value);
};

// Read-only audit: returns legacy docs + duplicate (hireId, reviewerUserId,
// direction=EMPLOYER_TO_WORKER) groups.
export async function auditLegacyReviews(db = prisma) {
  const res = await db.$runCommandRaw({ find: 'Review', filter: {} });
  const all = firstBatch(res);
  const legacy = all.filter(isLegacy);

  const groups = new Map();
  for (const d of legacy) {
    const reviewer = oidStr(d.employerId);
    const key = `${oidStr(d.hireId)}|${reviewer}|EMPLOYER_TO_WORKER`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(oidStr(d._id));
  }
  const duplicates = [...groups.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([key, ids]) => {
      const [hireId, reviewerUserId, direction] = key.split('|');
      return { hireId, reviewerUserId, direction, ids };
    });

  return { total: all.length, legacyCount: legacy.length, legacy, duplicates };
}

// Apply the backfill. Refuses if duplicates exist or WorkerProfile missing.
//
// `applyWrite` is an injectable single-document writer. The default uses
// Prisma's typed `review.update` (works on Production Atlas, which is a
// replica set — required because Prisma wraps writes in a transaction).
// The standalone local mongod is NOT a replica set, so verification injects
// a native-driver writer (via `db.review.updateOne`) that performs the exact
// same $set transformation. `applyWrite(legacyDoc, profile)` returns a
// Promise; it must throw on failure so the run reports the record as failed.
export async function backfillLegacyReviews(db = prisma, { apply = false, applyWrite } = {}) {
  const audit = await auditLegacyReviews(db);
  if (audit.duplicates.length > 0) {
    return {
      applied: false,
      stopped: true,
      reason: 'DUPLICATE_LEGACY_REVIEWS_DETECTED',
      duplicates: audit.duplicates,
      legacyCount: audit.legacyCount,
    };
  }
  if (!apply) {
    return { applied: false, legacyCount: audit.legacyCount, duplicates: audit.duplicates };
  }

  const unresolved = [];
  for (const d of audit.legacy) {
    const workerProfile = await db.workerProfile.findUnique({
      where: { id: oidStr(d.workerId) },
    });
    if (!workerProfile) {
      unresolved.push({ _id: oidStr(d._id), workerId: oidStr(d.workerId), reason: 'WORKER_PROFILE_NOT_FOUND' });
    }
  }
  if (unresolved.length > 0) {
    return {
      applied: false,
      stopped: true,
      reason: 'UNRESOLVED_LEGACY_REVIEWS_DETECTED',
      unresolved,
      legacyCount: audit.legacyCount,
    };
  }

  let migrated = 0;
  const migratedWorkerProfileIds = new Set();
  for (const d of audit.legacy) {
    const docId = oidStr(d._id);
    const workerProfile = await db.workerProfile.findUnique({
      where: { id: oidStr(d.workerId) },
    });
    if (!workerProfile) {
      throw new Error(`Unresolved WorkerProfile for review ${docId} after preflight`);
    }
    const doWrite = applyWrite
      ? () => applyWrite(d, workerProfile)
      : () => db.review.update({
          where: { id: docId },
          data: {
            reviewerUserId: oidStr(d.employerId),
            revieweeUserId: oidStr(workerProfile.userId),
            direction: 'EMPLOYER_TO_WORKER',
            updatedAt: new Date(),
          },
        });
    await doWrite();
    migrated += 1;
    migratedWorkerProfileIds.add(workerProfile.id);
  }

  if (migratedWorkerProfileIds.size > 0) {
    await recomputeWorkerAggregates(db, Array.from(migratedWorkerProfileIds));
  }

  return { applied: true, migrated, failed: [], legacyCount: audit.legacyCount, duplicates: [] };
}

// Recompute cached WorkerProfile aggregates from authoritative Review records.
// Only updates the explicitly provided WorkerProfile IDs; never touches
// EmployerProfile or unrelated records.
async function recomputeWorkerAggregates(db, workerProfileIds) {
  const results = [];
  for (const profileId of workerProfileIds) {
    const profile = await db.workerProfile.findUnique({
      where: { id: profileId },
      select: { id: true, userId: true },
    });
    if (!profile) {
      results.push({ profileId, reason: 'WORKER_PROFILE_NOT_FOUND' });
      continue;
    }
    const [count, avgResult] = await Promise.all([
      db.review.count({
        where: { revieweeUserId: profile.userId, direction: 'EMPLOYER_TO_WORKER' },
      }),
      db.review.aggregate({
        where: { revieweeUserId: profile.userId, direction: 'EMPLOYER_TO_WORKER' },
        _avg: { rating: true },
      }),
    ]);
    const ratingAvg = count > 0 ? Math.round((avgResult._avg.rating || 0) * 100) / 100 : 0;
    await db.workerProfile.update({
      where: { id: profileId },
      data: { ratingAvg, ratingCount: count },
    });
    results.push({ profileId, ratingAvg, ratingCount: count });
  }
  return results;
}

// CLI
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const mode = process.argv.includes('--apply') ? 'apply' : 'check';
  (async () => {
    if (mode === 'apply') {
      if (process.env.REVIEW_BACKFILL_APPLY !== 'yes') {
        console.error('Refusing --apply: set env REVIEW_BACKFILL_APPLY=yes to enable writes.');
        process.exit(2);
      }
      if (!isLocalhost(process.env.DATABASE_URL)) {
        console.error('Refusing --apply against non-localhost DATABASE_URL (Production guard).');
        process.exit(3);
      }
    }
    const result = mode === 'apply'
      ? await backfillLegacyReviews(prisma, { apply: true })
      : await auditLegacyReviews(prisma);
    console.log(JSON.stringify(result, null, 2));
    await prisma.$disconnect();
  })().catch(async (e) => {
    console.error('Backfill error:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
}
