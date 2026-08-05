import 'dotenv/config';
import prisma from '../src/lib/prisma.js';

async function main() {
  // Use raw MongoDB command via Prisma
  const result = await prisma.$runCommandRaw({
    aggregate: 'Notification',
    pipeline: [
      {
        $facet: {
          total: [{ $count: 'count' }],
          nullMessage: [{ $match: { message: null } }, { $count: 'count' }],
          missingMessage: [{ $match: { message: { $exists: false } } }, { $count: 'count' }],
          withBody: [{ $match: { body: { $exists: true } } }, { $count: 'count' }],
          samples: [{ $limit: 5 }]
        }
      }
    ],
    cursor: {}
  });

  const data = result.cursor.firstBatch[0];
  console.log('Total notifications:', data.total[0]?.count || 0);
  console.log('Notifications with null message:', data.nullMessage[0]?.count || 0);
  console.log('Notifications with missing message field:', data.missingMessage[0]?.count || 0);
  console.log('Notifications with body field:', data.withBody[0]?.count || 0);
  
  console.log('\nSample notifications:');
  data.samples.forEach(n => {
    console.log(JSON.stringify({
      _id: n._id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      body: n.body,
      isRead: n.isRead,
      createdAt: n.createdAt
    }, null, 2));
  });

  process.exit(0);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});