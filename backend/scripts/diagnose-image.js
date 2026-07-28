// backend/scripts/diagnose-image.js
// Trace: Where is the worker image stored?
// Run: node backend/scripts/diagnose-image.js

import prisma from '../src/lib/prisma.js';

async function diagnose() {
  console.log('=== IMAGE FIELD DIAGNOSIS ===\n');

  // 1. Show that @map("profileImage") now maps Prisma's "image" to MongoDB's "profileImage"
  const user = await prisma.user.findFirst({
    where: { email: 'contractforlife@gmail.com' },
    select: { id: true, image: true, fullName: true }
  });
  console.log(`User with @map("profileImage") fix:`);
  console.log(`  fullName: ${user.fullName}`);
  console.log(`  image (Prisma field, mapped from profileImage): "${user.image}"`);
  console.log('');

  // 2. Check all hires for workerImage
  const hires = await prisma.hire.findMany({ take: 5 });
  for (const hire of hires) {
    const profile = await prisma.workerProfile.findUnique({ where: { id: hire.workerId } });
    if (!profile) continue;
    const userRecord = await prisma.user.findUnique({ where: { id: profile.userId } });
    if (!userRecord) continue;

    // This is exactly what getMyHires() line 272 does:
    const workerImage = userRecord.image || profile.profilePhotoUrl || null;
    console.log(`Hire ${hire.id.slice(-8)}: image="${workerImage ? workerImage.substring(0, 60) + '...' : '(empty)'}"`);
  }

  await prisma.$disconnect();
}

diagnose().catch(e => {
  console.error('Diagnosis failed:', e);
  process.exit(1);
});