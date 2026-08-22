// B5A legacy Manual Premium COPY/UPSERT migration.
//
// SAFE BY DEFAULT: no writes unless --apply is supplied together with the
// explicit production confirmation guard. Never run this from application
// startup, build, or deployment hooks.
//
// Dry run:
//   node scripts/migrate-legacy-manual-premium.js
// Production apply, only after explicit approval:
//   B5A_CONFIRM=YES NODE_ENV=production node scripts/migrate-legacy-manual-premium.js --apply
import prisma from '../src/lib/prisma.js';
import { migrateLegacyManualPremium } from '../src/services/legacyManualPremiumMigration.js';

const APPLY = process.argv.includes('--apply');
const production = String(process.env.NODE_ENV || '').toLowerCase() === 'production'
  || String(process.env.RAILWAY_ENVIRONMENT || '').toLowerCase() === 'production'
  || String(process.env.RAILWAY_ENVIRONMENT_NAME || '').toLowerCase() === 'production';

if (APPLY && (!production || process.env.B5A_CONFIRM !== 'YES')) {
  throw new Error('B5A apply requires production environment and B5A_CONFIRM=YES');
}

const run = async () => {
  console.log(`B5A legacy manual migration: ${APPLY ? 'COPY/UPSERT APPLY' : 'READ-ONLY DRY-RUN'}`);
  const summary = await migrateLegacyManualPremium({
    dryRun: !APPLY,
    log: (candidate) => console.log(JSON.stringify(candidate)),
  });
  console.log(JSON.stringify(summary, null, 2));
};

try {
  await run();
} finally {
  await prisma.$disconnect();
}
