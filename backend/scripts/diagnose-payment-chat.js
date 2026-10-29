// Read-only diagnostic for payment-based chat authorization.
import mongoose from 'mongoose';
import prisma from '../src/lib/prisma.js';

const [employerUserId, workerUserId] = process.argv.slice(2);
if (!mongoose.isObjectIdOrHexString(employerUserId) || !mongoose.isObjectIdOrHexString(workerUserId)) {
  console.error('Usage: node backend/scripts/diagnose-payment-chat.js <employerObjectId> <workerObjectId>');
  process.exit(2);
}

const connectionString = process.env.DATABASE_URL || process.env.MONGODB_URI;
if (!connectionString) {
  console.error('Database connection is not configured.');
  process.exit(2);
}

const redactId = (id) => `${String(id).slice(0, 4)}…${String(id).slice(-4)}`;

async function diagnose() {
  try {
    await mongoose.connect(connectionString);
    const Payment = mongoose.models.Payment || mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
    const employerId = new mongoose.Types.ObjectId(employerUserId);
    const workerId = new mongoose.Types.ObjectId(workerUserId);
    const [employerPaymentCount, workerPaymentCount, matchingPayment, hireCount, workerProfile] = await Promise.all([
      Payment.countDocuments({ $or: [{ employerId }, { employerId: employerUserId }, { userId: employerId }, { userId: employerUserId }] }),
      Payment.countDocuments({ $or: [{ workerId }, { workerId: workerUserId }] }),
      prisma.payment.findFirst({ where: { employerId: employerUserId, workerId: workerUserId, status: 'completed' }, select: { id: true } }),
      prisma.hire.count({ where: { employerId: employerUserId, workerId: workerUserId } }),
      prisma.workerProfile.findFirst({ where: { userId: workerUserId }, select: { id: true } }),
    ]);

    console.log('Payment/chat authorization diagnostic (read-only)');
    console.log(`Employer ${redactId(employerUserId)}; worker ${redactId(workerUserId)}`);
    console.log(`Employer payments: ${employerPaymentCount}; worker payments: ${workerPaymentCount}`);
    console.log(`Completed matching payment: ${Boolean(matchingPayment)}`);
    console.log(`Matching hires: ${hireCount}; worker profile: ${Boolean(workerProfile)}`);
    console.log(matchingPayment ? 'The payment predicate is satisfied.' : 'No completed payment satisfied the current predicate; this alone does not establish the cause of a 403 response.');
  } catch (error) {
    console.error(`Diagnosis failed (${error?.name || 'Error'}).`);
    process.exitCode = 1;
  } finally {
    await Promise.allSettled([mongoose.disconnect(), prisma.$disconnect()]);
  }
}

diagnose();
