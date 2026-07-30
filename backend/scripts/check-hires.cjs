const mongoose = require('mongoose');
const MONGODB_URI = process.env.DATABASE_URL || process.env.DATABASE_URL;

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
  const Hire = mongoose.model('Hire', new mongoose.Schema({}, { strict: false }));

  // Get all users with their roles
  const users = await User.find({}).limit(20);
  console.log('=== ALL USERS ===');
  for (const u of users) {
    console.log('_id:', u._id, '| role:', u.role, '| email:', u.email);
  }
  console.log();

  // Get all hires
  const allHires = await Hire.find({});
  console.log('=== ALL HIRES ===');
  console.log('Count:', allHires.length);
  for (const h of allHires) {
    console.log('  hireId:', h.id);
    console.log('  employerId:', h.employerId, 'type:', typeof h.employerId);
    console.log('  workerId:', h.workerId, 'type:', typeof h.workerId);
    console.log('  status:', h.status);
    console.log('  paymentStatus:', h.paymentStatus);
    console.log();
  }

  // Get all payments with their userId field
  const allPayments = await Payment.find({});
  console.log('=== ALL PAYMENTS (with userId field) ===');
  for (const p of allPayments) {
    console.log('  _id:', p._id);
    console.log('  employerId:', p.employerId, 'type:', typeof p.employerId);
    console.log('  workerId:', p.workerId, 'type:', typeof p.workerId);
    console.log('  userId:', p.userId, 'type:', typeof p.userId);
    console.log('  status:', p.status);
    console.log('  hireId:', p.hireId);
    console.log('  offerId:', p.offerId);
    console.log('  completedAt:', p.completedAt);
    console.log();
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });