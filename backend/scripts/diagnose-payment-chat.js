// backend/scripts/diagnose-payment-chat.js
// Diagnostic script to check payment records for chat 403 issue
// Run: node backend/scripts/diagnose-payment-chat.js

import mongoose from 'mongoose';
import prisma from '../src/lib/prisma.js';

async function diagnose() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/homelyserv';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`📁 Database: ${mongoose.connection.db.databaseName}\n`);

    // Get the employer and worker IDs from the user's report
    // These should be replaced with actual IDs from the failing request
    const employerUserId = process.argv[2]; // Pass employer User ObjectId as argument
    const workerUserId = process.argv[3];   // Pass worker User ObjectId as argument

    if (!employerUserId || !workerUserId) {
      console.log('❌ Please provide employer and worker User ObjectIds');
      console.log('Usage: node backend/scripts/diagnose-payment-chat.js <employerUserId> <workerUserId>');
      process.exit(1);
    }

    console.log('='.repeat(80));
    console.log('DIAGNOSTIC: Payment Check for Chat 403');
    console.log('='.repeat(80));
    console.log();

    // 1. Show JWT values (what the backend receives)
    console.log('1. JWT AUTHENTICATION VALUES:');
    console.log('   req.userId:', employerUserId);
    console.log('   req.userRole: EMPLOYER');
    console.log();

    // 2. Show request values
    console.log('2. REQUEST VALUES:');
    console.log('   recipientId:', workerUserId);
    console.log();

    // 3. Query Payment collection directly via Mongoose
    console.log('3. PAYMENT COLLECTION (MongoDB):');
    const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
    const payments = await Payment.find({
      $or: [
        { employerId: employerUserId },
        { employerId: String(employerUserId) },
        { userId: employerUserId }
      ]
    }).limit(10);

    console.log(`   Found ${payments.length} payment(s) for employer`);
    for (const payment of payments) {
      console.log('   ---');
      console.log('   _id:', payment._id);
      console.log('   employerId:', payment.employerId, `(type: ${typeof payment.employerId})`);
      console.log('   workerId:', payment.workerId, `(type: ${typeof payment.workerId})`);
      console.log('   userId:', payment.userId, `(type: ${typeof payment.userId})`);
      console.log('   hireId:', payment.hireId, `(type: ${typeof payment.hireId})`);
      console.log('   offerId:', payment.offerId, `(type: ${typeof payment.offerId})`);
      console.log('   status:', payment.status);
      console.log('   paymentMethod:', payment.paymentMethod);
      console.log('   completedAt:', payment.completedAt);
      console.log();
    }

    // 4. Query Payment via Prisma
    console.log('4. PAYMENT QUERY VIA PRISMA (what canContactWorker uses):');
    const prismaPayment = await prisma.payment.findFirst({
      where: {
        employerId: String(employerUserId),
        workerId: String(workerUserId),
        status: 'completed'
      }
    });

    if (prismaPayment) {
      console.log('   ✅ FOUND payment matching criteria:');
      console.log('   _id:', prismaPayment.id);
      console.log('   employerId:', prismaPayment.employerId);
      console.log('   workerId:', prismaPayment.workerId);
      console.log('   status:', prismaPayment.status);
    } else {
      console.log('   ❌ NO payment found matching criteria');
      console.log('   Query: { employerId: String(employerUserId), workerId: String(workerUserId), status: "completed" }');
    }
    console.log();

    // 5. Check all payments for this worker
    console.log('5. ALL PAYMENTS FOR THIS WORKER:');
    const workerPayments = await Payment.find({
      $or: [
        { workerId: workerUserId },
        { workerId: String(workerUserId) }
      ]
    }).limit(10);

    console.log(`   Found ${workerPayments.length} payment(s)`);
    for (const payment of workerPayments) {
      console.log('   ---');
      console.log('   _id:', payment._id);
      console.log('   employerId:', payment.employerId);
      console.log('   workerId:', payment.workerId);
      console.log('   status:', payment.status);
      console.log();
    }

    // 6. Check Hire records
    console.log('6. HIRE RECORDS:');
    const hires = await prisma.hire.findMany({
      where: {
        employerId: employerUserId
      }
    });

    console.log(`   Found ${hires.length} hire(s) for employer`);
    for (const hire of hires) {
      console.log('   ---');
      console.log('   hireId:', hire.id);
      console.log('   employerId:', hire.employerId);
      console.log('   workerId:', hire.workerId);
      console.log('   status:', hire.status);
      console.log('   paymentStatus:', hire.paymentStatus);
      console.log();
    }

    // 7. Check WorkerProfile
    console.log('7. WORKER PROFILE:');
    const workerProfile = await prisma.workerProfile.findFirst({
      where: {
        userId: workerUserId
      }
    });

    if (workerProfile) {
      console.log('   Found worker profile:');
      console.log('   id:', workerProfile.id);
      console.log('   userId:', workerProfile.userId);
    } else {
      console.log('   ❌ No worker profile found for userId:', workerUserId);
    }
    console.log();

    // 8. Summary
    console.log('='.repeat(80));
    console.log('SUMMARY:');
    console.log('='.repeat(80));
    console.log();

    if (payments.length === 0) {
      console.log('❌ NO PAYMENT RECORDS FOUND FOR THIS EMPLOYER');
      console.log('   This is why canContactWorker() returns false');
      console.log();
      console.log('SOLUTION: Create a payment record with:');
      console.log('  - employerId:', employerUserId);
      console.log('  - workerId:', workerUserId);
      console.log('  - status: "completed"');
    } else if (!prismaPayment) {
      console.log('❌ PAYMENT EXISTS BUT DOES NOT MATCH QUERY CRITERIA');
      console.log();
      console.log('The canContactWorker() query requires:');
      console.log('  - employerId: String(employerUserId) =', String(employerUserId));
      console.log('  - workerId: String(workerUserId) =', String(workerUserId));
      console.log('  - status: "completed"');
      console.log();
      console.log('But the actual payment record has different values.');
      console.log('Check the payment records above to see the mismatch.');
    } else {
      console.log('✅ PAYMENT FOUND - canContactWorker() should return true');
      console.log('   If you are still getting 403, check:');
      console.log('   1. Are you using the correct employerUserId?');
      console.log('   2. Are you using the correct workerUserId?');
      console.log('   3. Is the payment status exactly "completed"?');
    }

    console.log();
    console.log('='.repeat(80));

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    process.exit(1);
  }
}

diagnose();