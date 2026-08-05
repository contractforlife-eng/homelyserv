import 'dotenv/config';
import prisma from '../src/lib/prisma.js';

async function main() {
  console.log('🔧 Repairing corrupted notifications...\n');

  // Find all notifications with body field and no message field
  const corrupted = await prisma.$runCommandRaw({
    find: 'Notification',
    filter: {
      body: { $exists: true },
      $or: [
        { message: { $exists: false } },
        { message: null }
      ]
    }
  });

  const docs = corrupted.cursor?.firstBatch || [];
  console.log(`Found ${docs.length} corrupted notifications to repair.\n`);

  let repaired = 0;
  let failed = 0;

  for (const doc of docs) {
    try {
      // Copy body to message and remove body field
      await prisma.$runCommandRaw({
        update: 'Notification',
        updates: [
          {
            q: { _id: doc._id },
            u: {
              $set: { message: doc.body || doc.title || 'Notification' },
              $unset: { body: '' }
            }
          }
        ]
      });
      repaired++;
      console.log(`✅ Repaired notification ${doc._id}: "${doc.title}"`);
    } catch (error) {
      failed++;
      console.error(`❌ Failed to repair notification ${doc._id}:`, error.message);
    }
  }

  console.log(`\n📊 Repair complete:`);
  console.log(`   - Repaired: ${repaired}`);
  console.log(`   - Failed: ${failed}`);

  // Verify no more corrupted notifications exist
  const remaining = await prisma.$runCommandRaw({
    count: 'Notification',
    query: {
      body: { $exists: true },
      $or: [
        { message: { $exists: false } },
        { message: null }
      ]
    }
  });

  console.log(`   - Remaining corrupted: ${remaining.n || 0}`);

  process.exit(0);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});