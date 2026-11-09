import 'dotenv/config';
import prisma from '../src/lib/prisma.js';

async function main() {
  const isExecute = process.argv.includes('--execute');
  console.log(`🔧 ${isExecute ? 'EXECUTING' : 'DRY RUN'}: Repairing notifications with string createdAt...\n`);

  let totalScanned = 0;
  let validCount = 0;
  let invalidCount = 0;
  let repaired = 0;
  let failed = 0;

  // Batch cursor scan across all matching records in the collection
  let batchDocs = [];
  let cursorId = null;

  const initialResult = await prisma.$runCommandRaw({
    find: 'Notification',
    filter: {
      createdAt: { $type: 'string' }
    },
    batchSize: 100
  });

  cursorId = initialResult.cursor?.id;
  batchDocs = initialResult.cursor?.firstBatch || [];

  const processBatch = async (docs) => {
    for (const doc of docs) {
      totalScanned++;
      const parsedDate = new Date(doc.createdAt);
      if (isNaN(parsedDate.getTime())) {
        console.warn(`⚠️ Cannot parse date "${doc.createdAt}" for notification ${doc._id?.$oid || doc._id}`);
        invalidCount++;
        continue;
      }
      validCount++;

      if (isExecute) {
        try {
          // Conditional update on both _id and exact original string createdAt
          const res = await prisma.$runCommandRaw({
            update: 'Notification',
            updates: [
              {
                q: {
                  _id: doc._id,
                  createdAt: doc.createdAt
                },
                u: {
                  $set: {
                    createdAt: { $date: parsedDate.toISOString() }
                  }
                }
              }
            ]
          });
          if (res.nModified > 0 || res.n > 0) {
            repaired++;
            console.log(`✅ Repaired notification ${doc._id?.$oid || doc._id}: converted "${doc.createdAt}" to BSON Date`);
          }
        } catch (err) {
          failed++;
          console.error(`❌ Failed to repair notification ${doc._id?.$oid || doc._id}:`, err.message);
        }
      } else {
        console.log(`[DRY RUN] Would update notification ${doc._id?.$oid || doc._id}: "${doc.createdAt}" -> BSON Date (${parsedDate.toISOString()})`);
      }
    }
  };

  await processBatch(batchDocs);

  while (cursorId && cursorId !== '0' && cursorId !== 0) {
    const getMoreResult = await prisma.$runCommandRaw({
      getMore: cursorId,
      collection: 'Notification',
      batchSize: 100
    });
    cursorId = getMoreResult.cursor?.id;
    const nextDocs = getMoreResult.cursor?.nextBatch || [];
    if (!nextDocs.length) break;
    await processBatch(nextDocs);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Total found with string createdAt: ${totalScanned}`);
  console.log(`   - Valid parseable dates: ${validCount}`);
  console.log(`   - Invalid dates: ${invalidCount}`);
  if (isExecute) {
    console.log(`   - Repaired: ${repaired}`);
    console.log(`   - Failed: ${failed}`);
  } else {
    console.log(`   - (Dry run completed without mutating database. Run with --execute to apply changes.)`);
  }

  process.exit(0);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
