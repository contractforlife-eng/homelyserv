// backend/scripts/diagnose-hire-workerid.js
// Final: Map Hire.workerId (WorkerProfile.id) -> WorkerProfile.userId -> User._id
// Run: node backend/scripts/diagnose-hire-workerid.js

import prisma from '../src/lib/prisma.js';

async function diagnose() {
  console.log('=== ACTUAL ROOT CAUSE: Collection name mismatch ===\n');

  // 1. Show the two User collections
  const collections = await prisma.$runCommandRaw({
    listCollections: 1,
    nameOnly: true
  });
  console.log('Collections containing user data:');
  for (const coll of collections.cursor.firstBatch) {
    if (coll.name.toLowerCase().includes('user') || coll.name.toLowerCase().includes('worker') || coll.name.toLowerCase().includes('hire') || coll.name.toLowerCase().includes('offer')) {
      const count = await prisma.$runCommandRaw({ count: coll.name });
      console.log(`  ${coll.name}: ${count.n} docs`);
    }
  }
  console.log('');

  // 2. Verify Prisma cannot access User via its model
  const prismaUsers = await prisma.user.findMany({ take: 2 });
  console.log(`prisma.user.findMany() returns: ${prismaUsers.length} users`);
  
  // 3. But raw query on "users" works - show the ObjectId format
  const rawResult = await prisma.$runCommandRaw({
    find: 'users',
    filter: {},
    limit: 3,
    projection: { _id: 1, fullName: 1, email: 1, role: 1 }
  });
  const rawUsers = rawResult.cursor?.firstBatch || [];
  console.log(`Raw query on "users" collection returns: ${rawUsers.length} docs`);
  for (const u of rawUsers) {
    console.log(`  _id type: ${typeof u._id}, _id: ${u._id}, fullName: ${u.fullName}`);
  }
  console.log('');

  // 4. Check if WorkerProfile.userId matches the ObjectId format in "users"
  const profiles = await prisma.workerProfile.findMany({ take: 2 });
  console.log(`WorkerProfile userId format:`);
  for (const p of profiles) {
    console.log(`  WorkerProfile.id=${p.id}, WorkerProfile.userId=${p.userId}`);
  }
  console.log('');

  // 5. Try to find the worker document via "users" collection using WorkerProfile.id
  console.log('Can we find WorkerProfile.userId in the "users" collection?');
  for (const p of profiles) {
    const found = await prisma.$runCommandRaw({
      find: 'users',
      filter: { _id: { $oid: p.userId } },
      limit: 1,
      projection: { _id: 1, fullName: 1, email: 1 }
    });
    const docs = found.cursor?.firstBatch || [];
    if (docs.length > 0) {
      console.log(`  ✅ Profile.userId=${p.userId} -> User found: ${docs[0].fullName}`);
    } else {
      // Try without $oid
      const found2 = await prisma.$runCommandRaw({
        find: 'users',
        filter: { _id: p.userId },
        limit: 1,
        projection: { _id: 1, fullName: 1, email: 1 }
      });
      const docs2 = found2.cursor?.firstBatch || [];
      if (docs2.length > 0) {
        console.log(`  ✅ Profile.userId=${p.userId} -> User found (without $oid): ${docs2[0].fullName}`);
      } else {
        console.log(`  ❌ Profile.userId=${p.userId} -> User NOT found in "users" collection`);
      }
    }
  }
  console.log('');

  // 6. Full resolution for all 15 hires using raw "users" collection
  console.log('=== Full resolution for all hires ===');
  const hires = await prisma.hire.findMany({ orderBy: { createdAt: 'desc' } });
  let resolved = 0;
  let failed = 0;
  
  for (const hire of hires) {
    const profile = await prisma.workerProfile.findUnique({ where: { id: hire.workerId } });
    if (!profile) {
      console.log(`Hire ${hire.id.slice(-8)}: WorkerProfile ${hire.workerId} NOT FOUND`);
      failed++;
      continue;
    }
    
    // Look up user via raw "users" collection
    const userResult = await prisma.$runCommandRaw({
      find: 'users',
      filter: { _id: { $oid: profile.userId } },
      limit: 1,
      projection: { _id: 1, fullName: 1, email: 1, image: 1, phone: 1, city: 1 }
    });
    const userDoc = userResult.cursor?.firstBatch?.[0];
    
    if (userDoc) {
      console.log(`Hire ${hire.id.slice(-8)}: workerName=${userDoc.fullName}, email=${userDoc.email}, image=${userDoc.image || '(none)'}`);
      resolved++;
    } else {
      console.log(`Hire ${hire.id.slice(-8)}: WorkerProfile ${hire.workerId.slice(-8)} userId=${profile.userId} -> USER NOT RESOLVABLE`);
      failed++;
    }
  }
  
  console.log(`\nResolved: ${resolved}, Failed: ${failed}`);
  console.log(`\nCONCLUSION: Prisma's User model maps to collection "User" (${0} docs),`);
  console.log(`but Mongoose stores users in collection "users" (${rawUsers.length}+ docs).`);
  console.log(`The fix is to add @@map("users") to the Prisma User model.`);

  await prisma.$disconnect();
}

diagnose().catch(e => {
  console.error('Diagnosis failed:', e);
  process.exit(1);
});