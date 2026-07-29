const mongoose = require('mongoose');
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb+srv://contractforlife_db_user:Killuemad-123@cluster0.hblbv4s.mongodb.net/homelyserv?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
  const Hire = mongoose.model('Hire', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  // Find the completed payment with user_XXXXX format
  const payment = await Payment.findOne({
    employerId: 'user_1784367005840',
    workerId: 'user_1784367039768',
    status: 'completed'
  });

  console.log('=== THE PAYMENT DOCUMENT ===');
  console.log('_id:', payment?._id);
  console.log('employerId:', payment?.employerId, '| type:', typeof payment?.employerId);
  console.log('workerId:', payment?.workerId, '| type:', typeof payment?.workerId);
  console.log('status:', payment?.status);
  console.log('offerId:', payment?.offerId);
  console.log('hireId:', payment?.hireId);
  console.log('userId:', payment?.userId, '| type:', typeof payment?.userId);
  console.log('amount:', payment?.amount);
  console.log('paymentMethod:', payment?.paymentMethod);
  console.log('completedAt:', payment?.completedAt);
  console.log('createdAt:', payment?.createdAt);
  console.log();

  // Check what user_1784367005840 corresponds to
  console.log('=== LOOKING FOR USER WITH ID user_1784367005840 ===');
  const employerUser = await User.findOne({
    $or: [
      { _id: 'user_1784367005840' },
      { email: 'user_1784367005840' }
    ]
  });
  console.log('User found:', employerUser ? 'YES' : 'NO');
  if (employerUser) {
    console.log('  _id:', employerUser._id);
    console.log('  email:', employerUser.email);
    console.log('  role:', employerUser.role);
  } else {
    console.log('  No user with this ID exists in the User collection');
  }
  console.log();

  // Check what user_1784367039768 corresponds to
  console.log('=== LOOKING FOR USER WITH ID user_1784367039768 ===');
  const workerUser = await User.findOne({
    $or: [
      { _id: 'user_1784367039768' },
      { email: 'user_1784367039768' }
    ]
  });
  console.log('User found:', workerUser ? 'YES' : 'NO');
  if (workerUser) {
    console.log('  _id:', workerUser._id);
    console.log('  email:', workerUser.email);
    console.log('  role:', workerUser.role);
  } else {
    console.log('  No user with this ID exists in the User collection');
  }
  console.log();

  // Now: what canContactWorker() would query
  console.log('=== WHAT canContactWorker() QUERIES ===');
  console.log('employerId: String(employerId) where employerId = req.userId from JWT');
  console.log('workerId: String(workerId) where workerId = req.body.recipientId');
  console.log('status: "completed"');
  console.log();

  // The JWT contains userId = MongoDB ObjectId (e.g., 6a5e8a4deb53a9b7ad90eca7 for remo@gmail.com)
  // But the Payment document has employerId = "user_1784367005840"
  // These are different values

  console.log('=== THE MISMATCH ===');
  console.log('canContactWorker() queries with employerId = MongoDB ObjectId from JWT');
  console.log('But Payment.employerId = "user_1784367005840" (custom string format)');
  console.log('These do NOT match.');
  console.log();

  // Also check: what if the JWT userId was the user_XXXXX format?
  console.log('=== WHAT IF req.userId WAS user_1784367005840? ===');
  const wouldMatch = await Payment.findOne({
    employerId: 'user_1784367005840',
    workerId: 'user_1784367039768',
    status: 'completed'
  });
  console.log('Would match:', wouldMatch ? 'YES' : 'NO');
  if (wouldMatch) {
    console.log('  _id:', wouldMatch._id);
    console.log('  employerId:', wouldMatch.employerId);
    console.log('  workerId:', wouldMatch.workerId);
    console.log('  status:', wouldMatch.status);
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });