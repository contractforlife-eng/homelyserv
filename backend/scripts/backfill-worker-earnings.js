// backend/scripts/backfill-worker-earnings.js
// Worker Earnings Ledger — Phase 1 backfill for EXISTING active hires.
//
// SAFE BY DEFAULT:
//   - DRY-RUN unless run with --apply.
//   - Never writes without --apply.
//   - Selects only "legitimate active" hires (status 'active' with a
//     positive agreedSalary).
//   - Skips any hire that already has an initial ledger record
//     (idempotencyKey `worker_earning_initial_<hireId>`).
//   - Prints counts only — no sensitive details.
//   - Records may never automatically transition out of PENDING (Phase 1).
//
// Usage:
//   node scripts/backfill-worker-earnings.js            # dry-run
//   node scripts/backfill-worker-earnings.js --apply    # create records
//   node scripts/backfill-worker-earnings.js --limit 50 # dry-run, first 50
import prisma from '../src/lib/prisma.js';
import {
  ensureInitialWorkerEarning,
  initialEarningIdempotencyKey,
} from '../src/services/workerEarningService.js';

const APPLY = process.argv.includes('--apply');
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : null;

const run = async () => {
  console.log('=== Backfill: Worker Earnings Ledger (Phase 1) ===');
  console.log(`Mode: ${APPLY ? 'APPLY (writes allowed)' : 'DRY-RUN (no writes)'}`);
  console.log(`Limit: ${LIMIT ? LIMIT : 'none'}`);
  console.log('');

  // 1. Existing ledger keys we must skip.
  const existingRows = await prisma.workerEarning.findMany({
    select: { idempotencyKey: true },
  });
  const existingKeys = new Set(existingRows.map((r) => r.idempotencyKey));
  console.log(`Existing ledger records: ${existingRows.length}`);

  // 2. Candidates: active hires with an agreed (positive) salary.
  const hires = await prisma.hire.findMany({
    where: {
      status: 'active',
      agreedSalary: { gt: 0 },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Active hires with agreedSalary > 0: ${hires.length}`);

  // 3. Filter out hires that already have an initial ledger record.
  const eligible = hires.filter(
    (h) => !existingKeys.has(initialEarningIdempotencyKey(h.id))
  );

  console.log(`Eligible for creation (no existing ledger record): ${eligible.length}`);
  console.log(`Already recorded (skipped): ${hires.length - eligible.length}`);

  if (!APPLY) {
    console.log('');
    console.log('DRY-RUN complete — NO records created.');
    console.log('Re-run with --apply to create the PENDING ledger records.');
    return;
  }

  const batch = LIMIT ? eligible.slice(0, LIMIT) : eligible;
  let created = 0;
  let failed = 0;

  for (const hire of batch) {
    try {
      const entry = await ensureInitialWorkerEarning(hire);
      if (entry) created++;
    } catch (error) {
      failed++;
      console.error(` - Failed hire ${hire.id}: ${error.message}`);
    }
  }

  console.log('');
  console.log(`Created PENDING records: ${created}`);
  if (failed) console.log(`Failed: ${failed}`);
  if (LIMIT && batch.length < eligible.length) {
    console.log(`Note: --limit used; ${eligible.length - batch.length} eligible hire(s) remain.`);
  }
};

run()
  .catch((error) => {
    console.error('❌ Backfill error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });