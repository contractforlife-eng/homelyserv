const mongoose = require('mongoose');
const MONGODB_URI = process.env.DATABASE_URL || process.env.DATABASE_URL;
async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
  const Hire = mongoose.model('Hire', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  // The payment document that canContactWorker() should match
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

  // Check what user_1784367005840 corresponds to using email search
  console.log('=== LOOKING FOR EMPLOYER (user_1784367005840) ===');
  const employerUser = await User.findOne({ email: 'remo@gmail.com' });
  if (employerUser) {
    console.log('  Found user: remo@gmail.com');
    console.log('  _id:', employerUser._id, '| type:', typeof employerUser._id);
    console.log('  _id as string:', String(employerUser._id));
    console.log('  role:', employerUser.role);
    console.log();
    console.log('  === KEY COMPARISON ===');
    console.log('  Payment.employerId:', payment.employerId);
    console.log('  User._id (as string):', String(employerUser._id));
    console.log('  Match:', String(employerUser._id) === payment.employerId ? 'YES' : 'NO');
  }
  console.log();

  // Check what user_1784367039768 corresponds to
  console.log('=== LOOKING FOR WORKER (user_1784367039768) ===');
  const workerUser = await User.findOne({ email: 'contractforlife@gmail.com' });
  if (workerUser) {
    console.log('  Found user: contractforlife@gmail.com');
    console.log('  _id:', workerUser._id, '| type:', typeof workerUser._id);
    console.log('  _id as string:', String(workerUser._id));
    console.log('  role:', workerUser.role);
    console.log();
    console.log('  === KEY COMPARISON ===');
    console.log('  Payment.workerId:', payment.workerId);
    console.log('  User._id (as string):', String(workerUser._id));
    console.log('  Match:', String(workerUser._id) === payment.workerId ? 'YES' : 'NO');
  }
  console.log();

  // Now: what canContactWorker() would query
  console.log('=== WHAT canContactWorker() QUERIES ===');
  console.log('When employer remo@gmail.com sends a message:');
  console.log('  req.userId =', employerUser ? String(employerUser._id) : 'UNKNOWN');
  console.log('  req.body.recipientId = worker MongoDB ObjectId');
  console.log();
  console.log('  Prisma query:');
  console.log('    employerId:', employerUser ? String(employerUser._id) : 'UNKNOWN');
  console.log('    workerId:', workerUser ? String(workerUser._id) : 'UNKNOWN');
  console.log('    status: completed');
  console.log();

  // Try the Prisma query with MongoDB ObjectIds
  console.log('=== PRISMA QUERY RESULT ===');
  const prismaMatch = await Payment.findOne({
    employerId: employerUser ? String(employerUser._id) : '',
    workerId: workerUser ? String(workerUser._id) : '',
    status: 'completed'
  });
  console.log('Match found:', prismaMatch ? 'YES' : 'NO');
  if (prismaMatch) {
    console.log('  _id:', prismaMatch._id);
    console.log('  employerId:', prismaMatch.employerId);
    console.log('  workerId:', prismaMatch.workerId);
    console.log('  status:', prismaMatch.status);
  } else {
    console.log('  canContactWorker() returns FALSE');
  }
  console.log();

  // Now try with user_XXXXX format
  console.log('=== WHAT IF QUERY USED user_XXXXX FORMAT? ===');
  const altMatch = await Payment.findOne({
    employerId: 'user_1784367005840',
    workerId: 'user_1784367039768',
    status: 'completed'
  });
  console.log('Match found:', altMatch ? 'YES' : 'NO');
  if (altMatch) {
    console.log('  _id:', altMatch._id);
    console.log('  employerId:', altMatch.employerId);
    console.log('  workerId:', altMatch.workerId);
    console.log('  status:', altMatch.status);
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });