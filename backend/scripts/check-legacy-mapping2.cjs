const mongoose = require('mongoose');
const MONGODB_URI = process.env.DATABASE_URL || process.env.DATABASE_URL;

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const db = mongoose.connection.db;

  const payments = await Payment.find({
    $or: [
      { employerId: { $type: 'string', $regex: /^user_\d+$/ } },
      { workerId: { $type: 'string', $regex: /^user_\d+$/ } }
    ]
  });

  console.log('Payments with legacy IDs:', payments.length);
  console.log();

  for (const p of payments) {
    console.log('---');
    console.log('Payment:', p._id.toString());
    console.log('employerId:', p.employerId);
    console.log('workerId:', p.workerId);
    console.log('status:', p.status);

    if (p.employerId && typeof p.employerId === 'string' && p.employerId.startsWith('user_')) {
      const timestampMs = parseInt(p.employerId.replace('user_', ''));
      const timestampSec = Math.floor(timestampMs / 1000);
      const hexPrefix = timestampSec.toString(16);

      console.log('  employerId legacy:', p.employerId);
      console.log('  hexPrefix:', hexPrefix);

      const users = await db.collection('users').find({
        _id: { $regex: new RegExp('^' + hexPrefix) }
      }).toArray();
      console.log('  Matching users:', users.length);
      for (const u of users) {
        console.log('    -', u.email, '|', u._id.toString());
      }
    }

    if (p.workerId && typeof p.workerId === 'string' && p.workerId.startsWith('user_')) {
      const timestampMs = parseInt(p.workerId.replace('user_', ''));
      const timestampSec = Math.floor(timestampMs / 1000);
      const hexPrefix = timestampSec.toString(16);

      console.log('  workerId legacy:', p.workerId);
      console.log('  hexPrefix:', hexPrefix);

      const users = await db.collection('users').find({
        _id: { $regex: new RegExp('^' + hexPrefix) }
      }).toArray();
      console.log('  Matching users:', users.length);
      for (const u of users) {
        console.log('    -', u.email, '|', u._id.toString());
      }
    }
    console.log();
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });