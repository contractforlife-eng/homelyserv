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
    if (!hireId || !commissionAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: hireId, commissionAmount'
      });
    }

    // Find the hire record
    const hire = await prisma.hire.findUnique({
      where: { id: hireId }
    });

    if (!hire) {
      return res.status(404).json({
        success: false,
        error: 'Hire not found'
      });
    }

    // Check if payment already exists for this hireId with completed status
    const existingPayment = await prisma.payment.findFirst({
      where: {
        hireId: hireId,
        status: 'completed'
      }
    });

    if (existingPayment) {
      console.log('⚠️ Payment already exists for hire:', hireId, 'Updating:', existingPayment.id);
      
      // Update existing payment with commission metadata
      const updatedPayment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          amount: Number(commissionAmount),
          metadata: {
            ...(existingPayment.metadata || {}),
            type: 'commission',
            fullSalary: fullSalary || 0,
            source: 'commission_payment',
            updatedAt: new Date().toISOString()
          }
        }
      });

      console.log('✅ Commission payment updated:', updatedPayment.id);

      return res.json({
        success: true,
        payment: updatedPayment,
        message: 'Commission payment updated successfully'
      });
    }

    // Check if there's a pending/processing payment for this hire
    const pendingPayment = await prisma.payment.findFirst({
      where: {
        hireId: hireId,
        status: {
          in: ['pending', 'processing']
        }
      }
    });

    let payment;
    if (pendingPayment) {
      // Update existing pending payment to completed
      payment = await prisma.payment.update({
        where: { id: pendingPayment.id },
        data: {
          status: 'completed',
          amount: Number(commissionAmount),
          completedAt: new Date(),
          metadata: {
            ...(pendingPayment.metadata || {}),
            type: 'commission',
            fullSalary: fullSalary || 0,
            source: 'commission_payment'
          }
        }
      });
      
      console.log('✅ Pending payment updated to completed:', payment.id);
    } else {
      // Create new payment record
      const orderId = 'COMM-' + Date.now();
      const transactionIdNew = transactionId || 'TXN-' + Date.now();

      payment = await prisma.payment.create({
        data: {
          orderId,
          transactionId: transactionIdNew,
          amount: Number(commissionAmount),
          currency: 'EGP',
          paymentMethod: paymentMethod || 'paymob',
          status: 'completed',
          userId: String(employerId),
          workerId: String(workerId),
          employerId: String(employerId),
          hireId: hireId,
          offerId: offerId || null,
          completedAt: new Date(),
          metadata: {
            type: 'commission',
            fullSalary: fullSalary || 0,
            source: 'commission_payment'
          }
        }
      });

      console.log('✅ Commission payment created:', payment.id);
    }

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