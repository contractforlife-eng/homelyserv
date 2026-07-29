const mongoose = require('mongoose');
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb+srv://contractforlife_db_user:Killuemad-123@cluster0.hblbv4s.mongodb.net/homelyserv?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  const users = await User.find({}).sort({ createdAt: 1 });
  console.log('Total users:', users.length);
  console.log();

  for (const u of users) {
    const oid = u._id;
    const timestampHex = oid.toString().substring(0, 8);
    const timestampSec = parseInt(timestampHex, 16);
    const timestampMs = timestampSec * 1000;
    const createdAtMs = u.createdAt.getTime();
    const diff = Math.abs(timestampMs - createdAtMs);
    console.log(u.email, '| oid:', oid.toString().substring(0, 12), '| ts:', timestampSec, '| createdAt:', u.createdAt.toISOString(), '| diff:', diff, 'ms');
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });