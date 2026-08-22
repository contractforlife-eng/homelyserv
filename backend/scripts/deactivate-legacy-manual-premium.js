// B5B controlled legacy Manual Premium deactivation.
//
// SAFE BY DEFAULT: read-only dry-run unless --apply is combined with both
// B5B_CONFIRM=YES and NODE_ENV=production. Never run automatically.
//
// Dry run:
//   node scripts/deactivate-legacy-manual-premium.js
// Production apply, only after explicit approval:
//   B5B_CONFIRM=YES NODE_ENV=production node scripts/deactivate-legacy-manual-premium.js --apply
import prisma from '../src/lib/prisma.js';
import { deactivateLegacyManualPremium } from '../src/services/legacyManualPremiumDeactivation.js';

const APPLY = process.argv.includes('--apply');
const production = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

if (APPLY && (!production || process.env.B5B_CONFIRM !== 'YES')) {
  throw new Error('B5B apply requires --apply, NODE_ENV=production, and B5B_CONFIRM=YES');
}

try {
  console.log(`B5B legacy deactivation: ${APPLY ? 'APPLY' : 'READ-ONLY DRY-RUN'}`);
  const summary = await deactivateLegacyManualPremium({
    dryRun: !APPLY,
    log: (row) => console.log(JSON.stringify(row)),
  });
  console.log(JSON.stringify(summary, null, 2));
  if (summary.errors > 0) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

