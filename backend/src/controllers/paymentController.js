// backend/src/controllers/paymentController.js
import mongoose from 'mongoose';

// Payment Schema
const PaymentSchema = new mongoose.Schema({
  userId: String,
  workerId: String,
  workerName: String,
  employerId: String,
  employerName: String,
  amount: Number,
  jobTitle: String,
  paymentMethod: String,
  paymentId: String,
  status: { type: String, default: 'pending' },
  hireId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

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
      const payments = await Payment.find({
        $or: [
          { userId: userId },
          { workerId: userId },
          { employerId: userId }
        ]
      }).sort({ createdAt: -1 });

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