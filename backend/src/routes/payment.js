// backend/src/routes/payment.js
import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

// ============================================================
// MODELS
// ============================================================
const PaymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  transactionId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'EGP' },
  paymentMethod: { type: String, enum: ['paymob', 'paypal', 'credit_card'], default: 'paymob' },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  userEmail: { type: String },
  userId: { type: String },
  workerId: { type: String },
  workerName: { type: String },
  jobTitle: { type: String },
  employerId: { type: String },
  employerName: { type: String },
  hireId: { type: String },
  phone: { type: String },
  paymobOrderId: { type: String },
  paymobTransactionId: { type: String },
  paypalOrderId: { type: String },
  metadata: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', PaymentSchema);

// ============================================================
// HELPER FUNCTIONS
// ============================================================
const generateId = () => {
  return 'TXN-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
};

const generateOrderId = () => {
  return 'ORD-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
};

// ============================================================
// PAYMOB INTEGRATION
// ============================================================

const getPaymobAuthToken = async () => {
  try {
    const response = await axios.post('https://accept.paymob.com/api/auth/tokens', {
      api_key: process.env.PAYMOB_API_KEY
    });
    
    if (response.data && response.data.token) {
      console.log('✅ Paymob auth token obtained');
      return response.data.token;
    } else {
      throw new Error('Failed to get Paymob token');
    }
  } catch (error) {
    console.error('❌ Paymob auth error:', error.response?.data || error.message);
    throw new Error('Paymob authentication failed');
  }
};

const createPaymobOrder = async (authToken, amount, orderId, customerData) => {
  try {
    const response = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: Math.round(amount * 100),
      currency: 'EGP',
      merchant_order_id: orderId,
      items: [
        {
          name: customerData?.jobTitle || 'Service Payment',
          amount_cents: Math.round(amount * 100),
          description: customerData?.description || 'Payment for service',
          quantity: 1
        }
      ],
      shipping_data: {
        first_name: customerData?.firstName || 'Customer',
        last_name: customerData?.lastName || 'User',
        email: customerData?.email || 'customer@example.com',
        phone_number: customerData?.phone || '+201234567890'
      }
    });
    
    if (response.data && response.data.id) {
      console.log('✅ Paymob order created:', response.data.id);
      return response.data;
    } else {
      throw new Error('Failed to create Paymob order');
    }
  } catch (error) {
    console.error('❌ Paymob order error:', error.response?.data || error.message);
    throw new Error('Paymob order creation failed');
  }
};

const getPaymobPaymentKey = async (authToken, orderId, amount, customerData) => {
  try {
    const integrationId = process.env.PAYMOB_INTEGRATION_ID;
    const response = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
      auth_token: authToken,
      amount_cents: Math.round(amount * 100),
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        first_name: customerData?.firstName || 'Customer',
        last_name: customerData?.lastName || 'User',
        email: customerData?.email || 'customer@example.com',
        phone_number: customerData?.phone || '+201234567890',
        apartment: 'NA',
        floor: 'NA',
        street: 'NA',
        building: 'NA',
        shipping_method: 'NA',
        postal_code: 'NA',
        city: customerData?.city || 'Cairo',
        country: customerData?.country || 'EG'
      },
      currency: 'EGP',
      integration_id: integrationId,
      lock_order_when_paid: true
    });
    
    if (response.data && response.data.token) {
      console.log('✅ Paymob payment key generated');
      return response.data.token;
    } else {
      throw new Error('Failed to get Paymob payment key');
    }
  } catch (error) {
    console.error('❌ Paymob payment key error:', error.response?.data || error.message);
    throw new Error('Paymob payment key generation failed');
  }
};

// ============================================================
// PAYPAL INTEGRATION
// ============================================================

const getPayPalAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
    ).toString('base64');
    
    const response = await axios.post(
      process.env.PAYPAL_MODE === 'production' 
        ? 'https://api-m.paypal.com/v1/oauth2/token'
        : 'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    if (response.data && response.data.access_token) {
      console.log('✅ PayPal access token obtained');
      return response.data.access_token;
    } else {
      throw new Error('Failed to get PayPal token');
    }
  } catch (error) {
    console.error('❌ PayPal auth error:', error.response?.data || error.message);
    throw new Error('PayPal authentication failed');
  }
};

const createPayPalOrder = async (accessToken, amount, orderId, customerData) => {
  try {
    const egpToUsdRate = 0.033;
    const usdAmount = Math.round((amount * egpToUsdRate) * 100) / 100;
    const finalAmount = Math.max(usdAmount, 1.00);
    
    console.log(`💰 Converting EGP ${amount} to USD ${finalAmount} (rate: ${egpToUsdRate})`);
    
    const baseUrl = process.env.PAYPAL_MODE === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
    
    const response = await axios.post(
      `${baseUrl}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: orderId,
            description: customerData?.description || `Payment for ${customerData?.jobTitle || 'service'}`,
            amount: {
              currency_code: 'USD',
              value: finalAmount.toFixed(2)
            }
          }
        ],
        application_context: {
          return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-success`,
          cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-cancel`,
          brand_name: 'HomelyServ',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (response.data && response.data.id) {
      console.log('✅ PayPal order created:', response.data.id);
      return response.data;
    } else {
      throw new Error('Failed to create PayPal order');
    }
  } catch (error) {
    console.error('❌ PayPal order error:', error.response?.data || error.message);
    throw new Error('PayPal order creation failed: ' + (error.response?.data?.message || error.message));
  }
};

// ============================================================
// ROUTES
// ============================================================

/**
 * Create Payment Intent
 * POST /api/payments/create-payment-intent
 */
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { 
      amount, 
      paymentMethod, 
      userEmail, 
      workerName, 
      userId, 
      workerId, 
      jobTitle, 
      employerId, 
      employerName, 
      hireId, 
      phone 
    } = req.body;

    console.log('📤 Creating payment intent:', { 
      amount, 
      paymentMethod, 
      userEmail,
      jobTitle 
    });

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    const orderId = generateOrderId();
    const transactionId = generateId();

    const customerData = {
      firstName: employerName?.split(' ')[0] || 'Employer',
      lastName: employerName?.split(' ').slice(1).join(' ') || 'User',
      email: userEmail || 'employer@example.com',
      phone: phone || '+201234567890',
      userId,
      workerId,
      workerName,
      jobTitle,
      employerId,
      employerName,
      hireId,
      description: `Payment for ${jobTitle || 'service'} - ${workerName || 'worker'}`
    };

    const payment = new Payment({
      orderId,
      transactionId,
      amount: Number(amount),
      currency: 'EGP',
      paymentMethod: paymentMethod || 'paymob',
      status: 'pending',
      userEmail: userEmail || 'employer@example.com',
      userId: userId || userEmail,
      workerId,
      workerName: workerName || 'Worker',
      jobTitle,
      employerId,
      employerName,
      hireId,
      phone,
      metadata: {
        createdFrom: 'payment-intent',
        source: 'frontend',
        originalAmount: amount,
        originalCurrency: 'EGP'
      }
    });

    await payment.save();
    console.log('✅ Payment record created:', transactionId);

    let result;

    if (paymentMethod === 'paymob' || !paymentMethod) {
      try {
        const authToken = await getPaymobAuthToken();
        const paymobOrder = await createPaymobOrder(authToken, amount, orderId, customerData);
        const paymobOrderId = paymobOrder.id;
        const paymentKey = await getPaymobPaymentKey(authToken, paymobOrderId, amount, customerData);
        
        payment.paymobOrderId = paymobOrderId;
        payment.status = 'processing';
        await payment.save();
        
        const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;
        
        result = {
          success: true,
          orderId,
          transactionId,
          paymentId: transactionId,
          iframeUrl: iframeUrl,
          status: 'processing',
          amount: Number(amount),
          currency: 'EGP',
          paymentMethod: 'paymob'
        };
        
        console.log('✅ Paymob payment created with iframe');
        
      } catch (error) {
        console.error('❌ Paymob integration error:', error);
        payment.status = 'failed';
        payment.metadata.error = error.message;
        await payment.save();
        
        return res.status(500).json({
          success: false,
          error: error.message || 'Paymob payment failed'
        });
      }
      
    } else if (paymentMethod === 'paypal') {
      try {
        const accessToken = await getPayPalAccessToken();
        const paypalOrder = await createPayPalOrder(accessToken, amount, orderId, customerData);
        const paypalOrderId = paypalOrder.id;
        
        const approvalLink = paypalOrder.links.find(link => link.rel === 'approve');
        const approvalUrl = approvalLink?.href;
        
        if (!approvalUrl) {
          throw new Error('No approval URL found in PayPal response');
        }
        
        payment.paypalOrderId = paypalOrderId;
        payment.status = 'processing';
        await payment.save();
        
        result = {
          success: true,
          orderId,
          transactionId,
          paymentId: transactionId,
          approvalUrl: approvalUrl,
          paypalOrderId: paypalOrderId,
          status: 'processing',
          amount: Number(amount),
          currency: 'EGP',
          paymentMethod: 'paypal'
        };
        
        console.log('✅ PayPal order created');
        
      } catch (error) {
        console.error('❌ PayPal integration error:', error);
        payment.status = 'failed';
        payment.metadata.error = error.message;
        await payment.save();
        
        return res.status(500).json({
          success: false,
          error: error.message || 'PayPal payment failed'
        });
      }
      
    } else {
      return res.status(400).json({
        success: false,
        error: 'Unsupported payment method'
      });
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Payment intent error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment intent'
    });
  }
});

/**
 * Capture PayPal Order - FIXED with better error handling
 * POST /api/payments/capture-paypal/:orderId
 */
router.post('/capture-paypal/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`🔍 Capturing PayPal order: ${orderId}`);

    const payment = await Payment.findOne({ paypalOrderId: orderId });
    
    if (!payment) {
      console.log(`❌ Payment not found for order: ${orderId}`);
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    console.log(`✅ Found payment for order: ${orderId}, status: ${payment.status}`);

    if (payment.status === 'completed') {
      console.log(`✅ Payment already completed: ${orderId}`);
      return res.json({
        success: true,
        transaction: {
          id: payment.transactionId,
          orderId: payment.orderId,
          amount: payment.amount,
          status: 'completed',
          paymentMethod: 'paypal'
        }
      });
    }

    try {
      const accessToken = await getPayPalAccessToken();
      console.log('✅ PayPal access token obtained');

      const baseUrl = process.env.PAYPAL_MODE === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
      
      const captureResponse = await axios.post(
        `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      console.log('📥 PayPal capture response status:', captureResponse.data?.status);

      if (captureResponse.data && captureResponse.data.status === 'COMPLETED') {
        payment.status = 'completed';
        payment.updatedAt = new Date();
        await payment.save();
        
        console.log(`✅ PayPal order captured successfully: ${orderId}`);
        
        return res.json({
          success: true,
          transaction: {
            id: payment.transactionId,
            orderId: payment.orderId,
            amount: payment.amount,
            status: 'completed',
            paymentMethod: 'paypal',
            paypalOrderId: orderId,
            captureId: captureResponse.data.id
          }
        });
      } else {
        const orderStatus = captureResponse.data?.status || 'unknown';
        console.log(`⏳ Order ${orderId} status: ${orderStatus}`);
        
        if (orderStatus === 'APPROVED') {
          return res.json({
            success: false,
            error: 'Order approved but not yet captured. Please try again.',
            status: 'APPROVED'
          });
        }
        
        if (orderStatus === 'CREATED') {
          return res.json({
            success: false,
            error: 'Order created but not approved by user.',
            status: 'CREATED'
          });
        }
        
        throw new Error(`PayPal capture failed with status: ${orderStatus}`);
      }
    } catch (captureError) {
      console.error('❌ PayPal capture API error:', captureError.response?.data || captureError.message);
      
      if (captureError.response?.data?.details) {
        const details = captureError.response.data.details;
        
        const alreadyCaptured = details.some(d => d.issue === 'ORDER_ALREADY_CAPTURED');
        if (alreadyCaptured) {
          payment.status = 'completed';
          payment.updatedAt = new Date();
          await payment.save();
          
          return res.json({
            success: true,
            transaction: {
              id: payment.transactionId,
              orderId: payment.orderId,
              amount: payment.amount,
              status: 'completed',
              paymentMethod: 'paypal'
            }
          });
        }
        
        const notApproved = details.some(d => d.issue === 'ORDER_NOT_APPROVED');
        if (notApproved) {
          return res.json({
            success: false,
            error: 'Order not approved by user yet.',
            status: 'PENDING_APPROVAL'
          });
        }
      }
      
      const errorMessage = captureError.response?.data?.message || 
                          captureError.response?.data?.error_description ||
                          captureError.message ||
                          'PayPal capture failed';
      
      return res.status(500).json({
        success: false,
        error: errorMessage,
        details: captureError.response?.data || null
      });
    }

  } catch (error) {
    console.error('❌ PayPal capture error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to capture PayPal payment'
    });
  }
});

/**
 * Get Payment Status
 * GET /api/payments/status/:paymentId
 */
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    console.log(`🔍 Checking payment status: ${paymentId}`);

    const payment = await Payment.findOne({ 
      $or: [{ transactionId: paymentId }, { orderId: paymentId }] 
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment: {
        id: payment.transactionId,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        userEmail: payment.userEmail,
        workerName: payment.workerName,
        jobTitle: payment.jobTitle,
        employerName: payment.employerName,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get payment status'
    });
  }
});

/**
 * Complete Payment (Manual completion)
 * POST /api/payments/complete-payment
 */
router.post('/complete-payment', async (req, res) => {
  try {
    const { orderId, transactionId, userId } = req.body;

    console.log('✅ Completing payment:', { orderId, transactionId, userId });

    const payment = await Payment.findOne({
      $or: [{ orderId }, { transactionId }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    payment.status = 'completed';
    payment.updatedAt = new Date();
    await payment.save();

    res.json({
      success: true,
      payment: {
        id: payment.transactionId,
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod
      }
    });

  } catch (error) {
    console.error('❌ Complete payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete payment'
    });
  }
});

/**
 * Get User Payments
 * GET /api/payments/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📂 Getting payments for user: ${userId}`);

    const payments = await Payment.find({
      $or: [{ userId }, { userEmail: userId }, { employerId: userId }]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      payments: payments.map(p => ({
        id: p.transactionId,
        orderId: p.orderId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        workerName: p.workerName,
        jobTitle: p.jobTitle,
        employerName: p.employerName,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }))
    });

  } catch (error) {
    console.error('❌ Get user payments error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user payments'
    });
  }
});

/**
 * Verify Payment
 * POST /api/payments/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const { transactionId, orderId } = req.body;

    const payment = await Payment.findOne({
      $or: [{ transactionId }, { orderId }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      verified: payment.status === 'completed',
      payment: {
        id: payment.transactionId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod
      }
    });

  } catch (error) {
    console.error('❌ Verify payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify payment'
    });
  }
});

/**
 * Webhook Handler
 * POST /api/payments/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('📨 Webhook received:', req.body);

    const { transactionId, orderId, status, amount, merchant_order_id } = req.body;

    const payment = await Payment.findOne({
      $or: [{ orderId: merchant_order_id || orderId }, { transactionId }, { paymobOrderId: orderId }]
    });

    if (!payment) {
      console.log('⚠️ Payment not found for webhook');
      return res.json({ success: true, message: 'Webhook processed (payment not found)' });
    }

    const newStatus = status === 'success' || status === 'completed' || status === 'COMPLETED' 
      ? 'completed' 
      : status === 'failed' || status === 'FAILED' 
        ? 'failed' 
        : payment.status;

    if (newStatus !== payment.status) {
      payment.status = newStatus;
      payment.updatedAt = new Date();
      
      if (transactionId) {
        payment.paymobTransactionId = transactionId;
      }
      
      await payment.save();
      console.log(`✅ Payment ${payment.transactionId} updated to ${newStatus}`);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process webhook'
    });
  }
});

export default router;