// backend/scripts/check-payment.js
// Quick check of payment records
import mongoose from 'mongoose';

async function check() {
  try {
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/homelyserv');
    console.log('Connected to MongoDB\n');

    const payments = await mongoose.connection.db.collection('payments').find({}).limit(10).toArray();
    
    console.log('Found', payments.length, 'payment records\n');
    
    for (const p of payments) {
      console.log('=== Payment Document ===');
      console.log('_id:', p._id);
      console.log('employerId:', p.employerId, '| type:', typeof p.employerId);
      console.log('workerId:', p.workerId, '| type:', typeof p.workerId);
      console.log('userId:', p.userId, '| type:', typeof p.userId);
      console.log('hireId:', p.hireId, '| type:', typeof p.hireId);
      console.log('offerId:', p.offerId, '| type:', typeof p.offerId);
      console.log('status:', p.status);
      console.log('paymentMethod:', p.paymentMethod);
      console.log('completedAt:', p.completedAt);
      console.log('');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();