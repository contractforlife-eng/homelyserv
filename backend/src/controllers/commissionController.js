// backend/src/controllers/commissionController.js
// Handles commission payment recording to MongoDB via Prisma
import prisma from '../lib/prisma.js';

export const recordCommissionPayment = async (req, res) => {
  try {
    const {
      offerId,
      workerId,
      employerId,
      hireId,
      commissionAmount,
      paymentMethod,
      transactionId,
      fullSalary
    } = req.body;

    console.log('📝 Recording commission payment:', {
      offerId,
      workerId,
      employerId,
      hireId,
      commissionAmount,
      paymentMethod,
      transactionId
    });

    // Validate required fields
    if (!offerId || !workerId || !employerId || !commissionAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: offerId, workerId, employerId, commissionAmount'
      });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        offerId: offerId,
        workerId: String(workerId),
        employerId: String(employerId),
        status: 'completed'
      }
    });

    if (existingPayment) {
      console.log('⚠️ Payment already exists:', existingPayment.id);
      return res.json({
        success: true,
        payment: existingPayment,
        message: 'Payment already recorded'
      });
    }

    // Find the hire record if hireId is not provided
    let actualHireId = hireId;
    if (!actualHireId && offerId) {
      const hire = await prisma.hire.findFirst({
        where: { offerId: offerId }
      });
      if (hire) {
        actualHireId = hire.id;
      }
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: 'COMM-' + Date.now(),
        transactionId: transactionId || 'TXN-' + Date.now(),
        amount: Number(commissionAmount),
        currency: 'EGP',
        paymentMethod: paymentMethod || 'paymob',
        status: 'completed',
        userId: String(employerId),
        workerId: String(workerId),
        workerName: '',
        employerId: String(employerId),
        employerName: '',
        hireId: actualHireId || null,
        offerId: offerId,
        completedAt: new Date(),
        metadata: {
          type: 'commission',
          fullSalary: fullSalary || 0,
          source: 'commission_payment'
        }
      }
    });

    console.log('✅ Commission payment recorded:', payment.id);

    return res.json({
      success: true,
      payment: payment,
      message: 'Commission payment recorded successfully'
    });

  } catch (error) {
    console.error('❌ Error recording commission payment:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to record commission payment'
    });
  }
};

export default {
  recordCommissionPayment
};