// backend/src/controllers/paymentController.js
import prisma from '../lib/prisma.js';

// Get worker payments
export const getWorkerPayments = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    const userId = req.user.id || req.user.email;
    console.log('📊 Fetching payments for user:', userId);

    try {
      const payments = await prisma.payment.findMany({
        where: {
          OR: [
            { userId: userId },
            { workerId: userId },
            { employerId: userId }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({
        success: true,
        payments: payments,
        total: payments.length
      });
    } catch (error) {
      console.log('ℹ️ Error fetching payments, returning empty:', error.message);
      return res.json({
        success: true,
        payments: [],
        total: 0
      });
    }
  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};