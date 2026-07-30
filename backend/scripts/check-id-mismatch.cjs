const mongoose = require('mongoose');
const MONGODB_URI = process.env.DATABASE_URL || process.env.DATABASE_URL;

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  console.log('Database:', mongoose.connection.db.databaseName);

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
  const Hire = mongoose.model('Hire', new mongoose.Schema({}, { strict: false }));

  const employer = await User.findOne({ role: 'EMPLOYER' }).limit(1);
  console.log('=== EMPLOYER USER ===');
  console.log('_id:', employer._id);
  console.log('id (string):', String(employer._id));
  console.log('email:', employer.email);
  console.log();

  const worker = await User.findOne({ role: 'WORKER' }).limit(1);
  console.log('=== WORKER USER ===');
  console.log('_id:', worker._id);
  console.log('id (string):', String(worker._id));
  console.log('email:', worker.email);
  console.log();

  const employerIdStr = String(employer._id);
  const workerIdStr = String(worker._id);

  console.log('=== PAYMENTS FOR THIS EMPLOYER (by MongoDB ObjectId as employerId) ===');
  const paymentsByObjectId = await Payment.find({
    employerId: employerIdStr
  });
  console.log('Found:', paymentsByObjectId.length);
  for (const p of paymentsByObjectId) {
    console.log('  employerId:', p.employerId, '| workerId:', p.workerId, '| status:', p.status);
  }

  console.log();
  console.log('=== PAYMENTS FOR THIS WORKER (by MongoDB ObjectId as workerId) ===');
  const paymentsByWorkerId = await Payment.find({
    workerId: workerIdStr
  });
  console.log('Found:', paymentsByWorkerId.length);
  for (const p of paymentsByWorkerId) {
    console.log('  employerId:', p.employerId, '| workerId:', p.workerId, '| status:', p.status);
  }

  console.log();
  console.log('=== ALL COMPLETED PAYMENTS ===');
  const completedPayments = await Payment.find({ status: 'completed' });
  console.log('Found:', completedPayments.length);
  for (const p of completedPayments) {
    console.log('  employerId:', p.employerId, '| workerId:', p.workerId, '| status:', p.status);
  }

  console.log();
  console.log('=== HIRE RECORDS FOR THIS EMPLOYER ===');
  const hires = await Hire.find({ employerId: employerIdStr });
  console.log('Found:', hires.length);
  for (const h of hires) {
    console.log('  hireId:', h.id);
    console.log('  employerId:', h.employerId, 'type:', typeof h.employerId);
    console.log('  workerId:', h.workerId, 'type:', typeof h.workerId);
    console.log('  status:', h.status);
    console.log('  paymentStatus:', h.paymentStatus);
    console.log();
  }

  console.log('=== WHAT canContactWorker() QUERIES ===');
  console.log('employerId:', employerIdStr);
  console.log('workerId:', workerIdStr);
  console.log('status: completed');
  console.log();

  const prismaPayment = await Payment.findOne({
    employerId: employerIdStr,
    workerId: workerIdStr,
    status: 'completed'
  });

  if (prismaPayment) {
    console.log('MATCH FOUND - canContactWorker() would return true');
  } else {
    console.log('NO MATCH - canContactWorker() returns false');
    console.log();
    console.log('The Prisma query looks for:');
    console.log('  employerId =', employerIdStr);
    console.log('  workerId =', workerIdStr);
    console.log('  status = completed');
    console.log();
    console.log('But the Payment documents have different values for employerId/workerId');
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });