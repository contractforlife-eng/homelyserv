const mongoose = require('mongoose');
const MONGODB_URI = process.env.DATABASE_URL || process.env.DATABASE_URL;
async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  console.log('Database:', mongoose.connection.db.databaseName);
  console.log();

  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
  const Hire = mongoose.model('Hire', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  // Step 1: Find all completed payments where employerId and workerId are both MongoDB ObjectId strings (24 hex chars)
  const completedPayments = await Payment.find({
    status: 'completed',
    employerId: { $type: 'string', $regex: /^[0-9a-fA-F]{24}$/ },
    workerId: { $type: 'string', $regex: /^[0-9a-fA-F]{24}$/ }
  });

  console.log('=== COMPLETED PAYMENTS WITH ObjectId-FORMAT employerId AND workerId ===');
  console.log('Count:', completedPayments.length);
  console.log();

  for (const p of completedPayments) {
    console.log('---');
    console.log('_id:', p._id);
    console.log('employerId:', p.employerId, '| type:', typeof p.employerId);
    console.log('workerId:', p.workerId, '| type:', typeof p.workerId);
    console.log('status:', p.status);
    console.log('offerId:', p.offerId);
    console.log('hireId:', p.hireId);
    console.log('userId:', p.userId, '| type:', typeof p.userId);
    console.log('amount:', p.amount);
    console.log('paymentMethod:', p.paymentMethod);
    console.log('completedAt:', p.completedAt);
    console.log('createdAt:', p.createdAt);
    console.log();
  }

  // Step 2: For each such payment, check if there's a corresponding hire record
  console.log('=== HIRE RECORDS FOR THESE PAYMENTS ===');
  for (const p of completedPayments) {
    const hire = await Hire.findOne({
      $or: [
        { employerId: p.employerId, workerId: p.workerId },
        { offerId: p.offerId }
      ]
    });
    console.log('Payment:', p._id);
    console.log('  employerId:', p.employerId);
    console.log('  workerId:', p.workerId);
    console.log('  offerId:', p.offerId);
    console.log('  hireId:', p.hireId);
    if (hire) {
      console.log('  ✅ Hire found:', hire.id);
      console.log('    hire.employerId:', hire.employerId, '| type:', typeof hire.employerId);
      console.log('    hire.workerId:', hire.workerId, '| type:', typeof hire.workerId);
      console.log('    hire.status:', hire.status);
      console.log('    hire.paymentStatus:', hire.paymentStatus);
    } else {
      console.log('  ❌ No hire record found');
    }
    console.log();
  }

  // Step 3: Check what canContactWorker() would query for each completed payment
  console.log('=== WHAT canContactWorker() QUERIES FOR EACH ===');
  for (const p of completedPayments) {
    console.log('Payment:', p._id);
    console.log('  Prisma query:');
    console.log('    employerId:', String(p.employerId));
    console.log('    workerId:', String(p.workerId));
    console.log('    status: completed');
    console.log('  Payment document values:');
    console.log('    employerId:', p.employerId, '| type:', typeof p.employerId);
    console.log('    workerId:', p.workerId, '| type:', typeof p.workerId);
    console.log('    status:', p.status);

    const match = await Payment.findOne({
      employerId: String(p.employerId),
      workerId: String(p.workerId),
      status: 'completed'
    });

    if (match) {
      console.log('  ✅ Prisma query WOULD MATCH this document');
    } else {
      console.log('  ❌ Prisma query would NOT match');
    }
    console.log();
  }

  // Step 4: Check ALL completed payments regardless of format
  console.log('=== ALL COMPLETED PAYMENTS ===');
  const allCompleted = await Payment.find({ status: 'completed' });
  console.log('Total completed payments:', allCompleted.length);
  for (const p of allCompleted) {
    console.log('  _id:', p._id);
    console.log('  employerId:', p.employerId, '| type:', typeof p.employerId);
    console.log('  workerId:', p.workerId, '| type:', typeof p.workerId);
    console.log('  status:', p.status);
    console.log('  offerId:', p.offerId);
    console.log('  hireId:', p.hireId);
    console.log();
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });