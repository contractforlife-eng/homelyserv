const mongoose = require('mongoose');
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb+srv://contractforlife_db_user:Killuemad-123@cluster0.hblbv4s.mongodb.net/homelyserv?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  // Find all payments with legacy user_ prefixed IDs
  const payments = await Payment.find({
    $or: [
      { employerId: { $type: 'string', $regex: /^user_\d+$/ } },
      { workerId: { $type: 'string', $regex: /^user_\d+$/ } }
    ]
  });

  console.log('Payments with legacy IDs:', payments.length);
  console.log();

  // For each payment, try to map legacy IDs to User ObjectIds
  for (const p of payments) {
    console.log('---');
    console.log('Payment:', p._id);
    console.log('employerId:', p.employerId);
    console.log('workerId:', p.workerId);
    console.log('status:', p.status);

    // Map employerId
    if (p.employerId && typeof p.employerId === 'string' && p.employerId.startsWith('user_')) {
      const timestampMs = parseInt(p.employerId.replace('user_', ''));
      const timestampSec = Math.floor(timestampMs / 1000);
      const hexPrefix = timestampSec.toString(16);

      console.log('  employerId legacy:', p.employerId);
      console.log('  timestampMs:', timestampMs);
      console.log('  timestampSec:', timestampSec);
      console.log('  hexPrefix:', hexPrefix);

      // Find users whose ObjectId starts with this hex prefix
      const users = await User.find({
        _id: { $regex: new RegExp('^' + hexPrefix) }
      });
      console.log('  Matching users:', users.length);
      for (const u of users) {
        console.log('    -', u.email, '|', u._id.toString());
      }
    }

    // Map workerId
    if (p.workerId && typeof p.workerId === 'string' && p.workerId.startsWith('user_')) {
      const timestampMs = parseInt(p.workerId.replace('user_', ''));
      const timestampSec = Math.floor(timestampMs / 1000);
      const hexPrefix = timestampSec.toString(16);

      console.log('  workerId legacy:', p.workerId);
      console.log('  timestampMs:', timestampMs);
      console.log('  timestampSec:', timestampSec);
      console.log('  hexPrefix:', hexPrefix);

      const users = await User.find({
        _id: { $regex: new RegExp('^' + hexPrefix) }
      });
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