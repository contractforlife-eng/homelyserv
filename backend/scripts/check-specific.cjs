const mongoose = require('mongoose');
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb+srv://contractforlife_db_user:Killuemad-123@cluster0.hblbv4s.mongodb.net/homelyserv?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
  const Hire = mongoose.model('Hire', new mongoose.Schema({}, { strict: false }));

  // Find users whose email or username matches the user_ prefix IDs
  const user1 = await User.findOne({ email: 'remo@gmail.com' });
  const user2 = await User.findOne({ email: 'contractforlife@gmail.com' });

  console.log('=== Target Employer (remo@gmail.com) ===');
  console.log('_id:', user1._id);
  console.log('_id as string:', String(user1._id));
  console.log('role:', user1.role);
  console.log();

  console.log('=== Target Worker (contractforlife@gmail.com) ===');
  console.log('_id:', user2._id);
  console.log('_id as string:', String(user2._id));
  console.log('role:', user2.role);
  console.log();

  const employerId = String(user1._id);
  const workerId = String(user2._id);

  console.log('=== WHAT canContactWorker() QUERIES ===');
  console.log('employerId:', employerId);
  console.log('workerId:', workerId);
  console.log('status: completed');
  console.log();

  // Query exactly what canContactWorker queries
  const prismaPayment = await Payment.findOne({
    employerId: employerId,
    workerId: workerId,
    status: 'completed'
  });

  console.log('=== PRISMA QUERY RESULT ===');
  if (prismaPayment) {
    console.log('FOUND:', prismaPayment._id);
  } else {
    console.log('NOT FOUND - canContactWorker() returns false');
  }
  console.log();

  // Now check: what payments exist for this employer (any workerId)?
  console.log('=== ALL PAYMENTS FOR THIS EMPLOYER (by employerId) ===');
  const empPayments = await Payment.find({ employerId: employerId });
  console.log('Count:', empPayments.length);
  for (const p of empPayments) {
    console.log('  _id:', p._id, '| workerId:', p.workerId, '| status:', p.status);
  }
  console.log();

  // Check payments by userId for this employer
  console.log('=== ALL PAYMENTS BY userId FOR THIS EMPLOYER ===');
  const userPayments = await Payment.find({ userId: employerId });
  console.log('Count:', userPayments.length);
  for (const p of userPayments) {
    console.log('  _id:', p._id, '| employerId:', p.employerId, '| workerId:', p.workerId, '| status:', p.status);
  }
  console.log();

  // Check ALL completed payments for this worker
  console.log('=== ALL COMPLETED PAYMENTS FOR THIS WORKER ===');
  const workerCompleted = await Payment.find({
    workerId: workerId,
    status: 'completed'
  });
  console.log('Count:', workerCompleted.length);
  for (const p of workerCompleted) {
    console.log('  _id:', p._id, '| employerId:', p.employerId, '| workerId:', p.workerId, '| status:', p.status);
  }
  console.log();

  // Check ALL payments for this worker (any status)
  console.log('=== ALL PAYMENTS FOR THIS WORKER ===');
  const workerAll = await Payment.find({
    $or: [
      { workerId: workerId },
      { userId: workerId }
    ]
  });
  console.log('Count:', workerAll.length);
  for (const p of workerAll) {
    console.log('  _id:', p._id, '| employerId:', p.employerId, '| workerId:', p.workerId, '| userId:', p.userId, '| status:', p.status);
  }
  console.log();

  // Check all payments that have employerId as a MongoDB ObjectId
  console.log('=== ALL PAYMENTS WITH employerId AS OBJECTID STRING ===');
  const objectIdPayments = await Payment.find({
    employerId: { $type: 'string', $regex: /^[0-9a-fA-F]{24}$/ }
  });
  console.log('Count:', objectIdPayments.length);
  for (const p of objectIdPayments) {
    console.log('  _id:', p._id, '| employerId:', p.employerId, '| workerId:', p.workerId, '| status:', p.status);
  }
  console.log();

  // Check the specific completed payment that has userId = employerId
  console.log('=== THE COMPLETED PAYMENT WITH userId = employer ObjectId ===');
  const specificPayment = await Payment.findOne({
    userId: employerId,
    status: 'completed'
  });
  if (specificPayment) {
    console.log('_id:', specificPayment._id);
    console.log('employerId:', specificPayment.employerId, 'type:', typeof specificPayment.employerId);
    console.log('workerId:', specificPayment.workerId, 'type:', typeof specificPayment.workerId);
    console.log('userId:', specificPayment.userId, 'type:', typeof specificPayment.userId);
    console.log('status:', specificPayment.status);
    console.log('hireId:', specificPayment.hireId);
    console.log('offerId:', specificPayment.offerId);
    console.log('metadata:', JSON.stringify(specificPayment.metadata));
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });