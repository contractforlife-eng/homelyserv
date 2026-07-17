// backend/src/routes/payment.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getWorkerPayments } from '../controllers/paymentController.js';
import axios from 'axios';
import mongoose from 'mongoose';

const router = express.Router();

// ============================================================
// PAYMOB CONFIGURATION - YOUR REAL DATA
// ============================================================
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;
const PAYMOB_BASE_URL = process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com/api';

console.log('🔑 PAYMOB_API_KEY:', PAYMOB_API_KEY ? '✅ Set' : '❌ Missing');
console.log('🔑 PAYMOB_INTEGRATION_ID:', PAYMOB_INTEGRATION_ID ? '✅ Set' : '❌ Missing');
console.log('🔑 PAYMOB_IFRAME_ID:', PAYMOB_IFRAME_ID ? '✅ Set' : '❌ Missing');

// ============================================================
// MONGODB PAYMENT SCHEMA
// ============================================================
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
  orderId: String,
  transactionId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

// ============================================================
// EXISTING ROUTE - Get worker payments
// ============================================================
router.get('/my-payments', authenticate, getWorkerPayments);

// ============================================================
// CREATE PAYMENT INTENT - REAL PAYMOB
// ============================================================
router.post('/create-payment-intent', async (req, res) => {
  try {
    const {
      amount,
      userId,
      userEmail,
      workerName,
      workerId,
      jobTitle,
      employerId,
      employerName,
      hireId,
      paymentMethod = 'paymob'
    } = req.body;

    console.log('📊 Creating payment intent:', { amount, userId, workerName, paymentMethod });

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }
    if (paymentType === 'recruitment') {
  // require salary to be sent alongside amount, and verify the math server-side
  if (!salary || Math.abs(amount - Math.round(salary * 0.15 * 100) / 100) > 0.01) {
    return res.status(400).json({
      success: false,
      error: 'Invalid payment amount for application fee'
    });
  }
}
    // ============================================================
    // REAL PAYMOB PAYMENT - NO MOCK FALLBACK
    // ============================================================
    if (paymentMethod === 'paymob') {
      // Check if Paymob is configured
      if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID) {
        console.error('❌ Paymob not configured');
        return res.status(500).json({
          success: false,
          error: 'Payment gateway not configured. Please contact support.'
        });
      }

      try {
        // Step 1: Get auth token
        console.log('🔑 Getting Paymob auth token...');
        const authResponse = await axios.post(`${PAYMOB_BASE_URL}/auth/tokens`, {
          api_key: PAYMOB_API_KEY
        });

        if (!authResponse.data || !authResponse.data.token) {
          console.error('❌ Paymob auth failed:', authResponse.data);
          return res.status(500).json({
            success: false,
            error: 'Failed to authenticate with Paymob'
          });
        }

        const authToken = authResponse.data.token;
        console.log('✅ Paymob auth token obtained');

        // Step 2: Create order
        const amountInPiastres = Math.round(amount * 100);
        const merchantOrderId = `order_${Date.now()}_${userId || 'user'}`;

        console.log(`📦 Creating Paymob order for ${amountInPiastres} piastres...`);
        
        const orderResponse = await axios.post(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
          auth_token: authToken,
          delivery_needed: false,
          amount_cents: amountInPiastres,
          currency: 'EGP',
          merchant_order_id: merchantOrderId,
          items: []
        });

        if (!orderResponse.data || !orderResponse.data.id) {
          console.error('❌ Paymob order failed:', orderResponse.data);
          return res.status(500).json({
            success: false,
            error: 'Failed to create Paymob order'
          });
        }

        const orderId = orderResponse.data.id;
        console.log(`✅ Paymob order created: ${orderId}`);

        // Step 3: Get payment key - FIXED BILLING DATA
        console.log('🔑 Getting Paymob payment key...');
        
        // Make sure phone number is valid (11 digits for Egypt)
        const phoneNumber = '01009189851'; // Use your valid phone number
        
        const billingData = {
          apartment: 'NA',
          email: userEmail || 'contractforlife@gmail.com',
          floor: 'NA',
          first_name: workerName?.split(' ')[0] || 'Emad',
          street: 'NA',
          building: 'NA',
          phone_number: phoneNumber,
          shipping_method: 'NA',
          postal_code: 'NA',
          city: 'Cairo',
          country: 'EG',
          last_name: workerName?.split(' ').pop() || 'Abdelhalem',
          state: 'NA'
        };

        console.log('📋 Billing Data:', JSON.stringify(billingData, null, 2));

        const paymentKeyResponse = await axios.post(`${PAYMOB_BASE_URL}/acceptance/payment_keys`, {
          auth_token: authToken,
          amount_cents: amountInPiastres,
          expiration: 3600,
          order_id: orderId,
          billing_data: billingData,
          currency: 'EGP',
          integration_id: parseInt(PAYMOB_INTEGRATION_ID)
        });

        if (!paymentKeyResponse.data || !paymentKeyResponse.data.token) {
          console.error('❌ Paymob payment key failed:', paymentKeyResponse.data);
          return res.status(500).json({
            success: false,
            error: 'Failed to get Paymob payment key'
          });
        }

        const paymentKey = paymentKeyResponse.data.token;
        console.log('✅ Paymob payment key obtained');

        // Step 4: Save payment record to MongoDB
        try {
          await Payment.create({
            userId: userId || employerId || 'system',
            workerId: workerId || userId || 'system',
            workerName: workerName || 'Worker',
            employerId: employerId || userId || 'system',
            employerName: employerName || 'Employer',
            amount: amount,
            jobTitle: jobTitle || 'Service',
            paymentMethod: 'Paymob',
            paymentId: orderId,
            orderId: orderId,
            status: 'pending',
            hireId: hireId || null
          });
          console.log('✅ Payment record saved to MongoDB');
        } catch (dbError) {
          console.warn('⚠️ Could not save payment:', dbError.message);
        }

        // Step 5: Return payment URL
        const paymentUrl = `https://accept.paymob.com/iframe/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;
        console.log('🔗 Payment URL:', paymentUrl);

        return res.json({
          success: true,
          paymentMethod: 'paymob',
          paymentKey: paymentKey,
          orderId: orderId,
          iframeId: PAYMOB_IFRAME_ID,
          amount: amount,
          currency: 'EGP',
          paymentUrl: paymentUrl
        });

      } catch (paymobError) {
        console.error('❌ Paymob error DETAILS:');
        console.error('  Message:', paymobError.message);
        console.error('  Response:', paymobError.response?.data);
        console.error('  Status:', paymobError.response?.status);
        
        // Return the actual error so we can see what's wrong
        return res.status(500).json({
          success: false,
          error: paymobError.response?.data?.message || paymobError.message || 'Paymob payment failed',
          details: paymobError.response?.data || null
        });
      }
    }

    // ============================================================
    // PAYPAL PAYMENT (if needed)
    // ============================================================
    if (paymentMethod === 'paypal') {
      const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
      const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
      const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

      if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
        return res.status(500).json({
          success: false,
          error: 'PayPal not configured'
        });
      }

      try {
        // Get PayPal access token
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
        
        const tokenResponse = await axios.post(
          `${PAYPAL_BASE_URL}/v1/oauth2/token`,
          'grant_type=client_credentials',
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        if (!tokenResponse.data || !tokenResponse.data.access_token) {
          throw new Error('Failed to get PayPal access token');
        }

        const accessToken = tokenResponse.data.access_token;

        // Create PayPal order
        const orderResponse = await axios.post(
          `${PAYPAL_BASE_URL}/v2/checkout/orders`,
          {
            intent: 'CAPTURE',
            purchase_units: [{
              amount: {
                currency_code: 'EGP',
                value: amount.toFixed(2)
              },
              description: `HomelyServ Payment - ${workerName || 'Worker'}`
            }],
            application_context: {
              return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-success`,
              cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-cancel`
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!orderResponse.data || !orderResponse.data.id) {
          throw new Error('Failed to create PayPal order');
        }

        const orderId = orderResponse.data.id;
        const approvalLink = orderResponse.data.links?.find(link => link.rel === 'approve')?.href;

        // Save payment record
        try {
          await Payment.create({
            userId: userId || employerId || 'system',
            workerId: workerId || userId || 'system',
            workerName: workerName || 'Worker',
            employerId: employerId || userId || 'system',
            employerName: employerName || 'Employer',
            amount: amount,
            jobTitle: jobTitle || 'Service',
            paymentMethod: 'PayPal',
            paymentId: orderId,
            orderId: orderId,
            status: 'pending',
            hireId: hireId || null
          });
          console.log('✅ Payment record saved to MongoDB');
        } catch (dbError) {
          console.warn('⚠️ Could not save payment:', dbError.message);
        }

        return res.json({
          success: true,
          paymentMethod: 'paypal',
          orderId: orderId,
          amount: amount,
          currency: 'EGP',
          paymentUrl: approvalLink,
          approvalUrl: approvalLink
        });

      } catch (paypalError) {
        console.error('❌ PayPal error:', paypalError.response?.data || paypalError.message);
        return res.status(500).json({
          success: false,
          error: paypalError.message || 'PayPal payment failed'
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid payment method'
    });

  } catch (error) {
    console.error('❌ Payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Payment processing failed'
    });
  }
});

// ============================================================
// COMPLETE PAYMENT
// ============================================================
router.post('/complete-payment', async (req, res) => {
  try {
    const { orderId, userId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const result = await Payment.updateOne(
      { orderId: orderId },
      { 
        status: 'completed',
        updatedAt: new Date()
      }
    );

    if (result.matchedCount === 0) {
      await Payment.create({
        userId: userId || 'system',
        workerId: userId || 'system',
        workerName: 'Worker',
        employerId: userId || 'system',
        employerName: 'Employer',
        amount: 0,
        jobTitle: 'Service',
        paymentMethod: 'Paymob',
        paymentId: orderId,
        orderId: orderId,
        status: 'completed',
        hireId: null
      });
    }

    console.log('✅ Payment completed:', orderId);

    return res.json({
      success: true,
      message: 'Payment completed successfully'
    });

  } catch (error) {
    console.error('❌ Error completing payment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete payment'
    });
  }
});

// ============================================================
// PAYMENT WEBHOOK
// ============================================================
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    console.log('📥 Paymob webhook received');

    const { obj } = payload;
    if (obj && obj.success) {
      const paymentId = obj.order?.merchant_order_id;
      if (paymentId) {
        await Payment.updateOne(
          { paymentId: paymentId },
          { 
            status: 'completed',
            updatedAt: new Date()
          }
        );
        console.log('✅ Payment completed:', paymentId);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET PAYMENT STATUS
// ============================================================
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await Payment.findOne({
      $or: [
        { paymentId: paymentId },
        { orderId: paymentId }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    return res.json({
      success: true,
      payment: payment
    });
  } catch (error) {
    console.error('❌ Error getting payment status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET ALL PAYMENTS FOR A USER
// ============================================================
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
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
    console.error('❌ Error getting user payments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;