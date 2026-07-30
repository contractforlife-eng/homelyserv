const mongoose = require('mongoose');
const MONGODB_URI = process.env.DATABASE_URL || process.env.DATABASE_URL;
async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  console.log('Database:', mongoose.connection.db.databaseName);

  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));

  const payments = await Payment.find({}).limit(20);
  console.log('Total payments found:', payments.length);
  console.log();

  for (const p of payments) {
    console.log('---');
    console.log('_id:', p._id);
    console.log('employerId:', p.employerId, 'type:', typeof p.employerId);
    console.log('workerId:', p.workerId, 'type:', typeof p.workerId);
    console.log('status:', p.status);
    console.log('hireId:', p.hireId, 'type:', typeof p.hireId);
    console.log('orderId:', p.orderId);
    console.log('amount:', p.amount);
    console.log('paymentMethod:', p.paymentMethod);
    console.log('completedAt:', p.completedAt);
    console.log('createdAt:', p.createdAt);
    console.log();
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });