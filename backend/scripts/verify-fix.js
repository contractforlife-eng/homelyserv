// backend/scripts/verify-fix.js
// Verify that @@map("users") fix works
// Run: node backend/scripts/verify-fix.js

import prisma from '../src/lib/prisma.js';

async function verify() {
  console.log('=== VERIFY: @@map("users") fix ===\n');

  // 1. Check prisma.user.findMany() now returns users
  const users = await prisma.user.findMany({ take: 3 });
  console.log(`prisma.user.findMany() returns: ${users.length} users`);
  for (const u of users) {
    console.log(`  id=${u.id}, fullName=${u.fullName}, email=${u.email}, role=${u.role}`);
  }
  console.log('');

  // 2. Check getMyHires resolution chain
  const hires = await prisma.hire.findMany({ orderBy: { createdAt: 'desc' } });
  console.log(`Total Hires: ${hires.length}\n`);

  let resolved = 0;
  let failed = 0;

  for (const hire of hires) {
    const profile = await prisma.workerProfile.findUnique({ where: { id: hire.workerId } });
    if (!profile) {
      console.log(`Hire ${hire.id.slice(-8)}: WorkerProfile NOT FOUND`);
      failed++;
      continue;
    }

    const user = await prisma.user.findUnique({ where: { id: profile.userId } });
    if (user) {
      console.log(`Hire ${hire.id.slice(-8)}: workerName=${user.fullName}, email=${user.email}, image=${user.image || '(none)'}`);
      resolved++;
    } else {
      console.log(`Hire ${hire.id.slice(-8)}: User NOT FOUND for userId=${profile.userId}`);
      failed++;
    }
  }

  console.log(`\nResolved: ${resolved}, Failed: ${failed}`);
  console.log(`\n${resolved === hires.length ? '✅ FIX VERIFIED: All hires resolve correctly' : '❌ Some hires still fail'}`);

  await prisma.$disconnect();
}

verify().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});