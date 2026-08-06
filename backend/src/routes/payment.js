// backend/src/routes/payment.js
import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService.js';

const router = express.Router();

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
// ENVIRONMENT-AWARE CLIENT URL RESOLUTION
// ============================================================
// Resolves the frontend base URL for PayPal return/cancel redirects.
// - Production NEVER falls back to localhost, even if CLIENT_URL is misconfigured.
// - Development uses localhost by default.
const getClientUrl = () => {
  const envClientUrl = process.env.CLIENT_URL;

  // If explicitly configured and not localhost, use it (strip trailing slash)
  if (envClientUrl && !envClientUrl.includes('localhost')) {
    return envClientUrl.replace(/\/+$/, '');
  }

  // In production, never redirect to localhost
  if (process.env.NODE_ENV === 'production') {
    return 'https://homelyserv.com';
  }

  // Development default
  return 'http://localhost:5173';
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

    const url = process.env.PAYPAL_MODE === 'production'
      ? 'https://api-m.paypal.com/v1/oauth2/token'
      : 'https://api-m.sandbox.paypal.com/v1/oauth2/token';

    const response = await axios.post(
      url,
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

    const clientUrl = getClientUrl();
    const returnUrl = `${clientUrl}/payment-success`;
    const cancelUrl = `${clientUrl}/payment-cancel`;

    console.log(`🔗 Return URL: ${returnUrl}`);
    console.log(`🔗 Cancel URL: ${cancelUrl}`);

    const response = await axios.post(
      `${baseUrl}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: orderId,
            description: customerData?.description || `Payment for ${customerData?.jobTitle || 'service'}`,
            custom_id: customerData?.transactionId || orderId,
            amount: {
              currency_code: 'USD',
              value: finalAmount.toFixed(2)
            }
          }
        ],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
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
// UPDATE HIRE AFTER PAYMENT - Single source of truth
// ============================================================
const updateHireAfterPayment = async (hireId, captureId) => {
  try {
    if (!hireId) {
      console.log('⚠️ No hireId provided, skipping hire update');
      return false;
    }

    console.log(`📝 Updating Hire ${hireId} after payment...`);
    console.log(`   Payment capture ID: ${captureId}`);

    // Find the Hire
    const hire = await prisma.hire.findUnique({
      where: { id: hireId }
    });

    if (!hire) {
      console.log(`⚠️ Hire not found: ${hireId}`);
      return false;
    }

    console.log(`📋 Found Hire: ${hire.id}`);
    console.log(`   Status before: ${hire.status}`);
    console.log(`   Payment status before: ${hire.paymentStatus}`);

    // Update the hire with payment completion
    const updatedHire = await prisma.hire.update({
      where: { id: hireId },
      data: {
        paymentStatus: 'completed',
        paymentReference: captureId || ('CAPTURED_' + Date.now()),
        status: 'active'
      }
    });

    console.log(`✅ Hire updated successfully`);
    console.log(`   Hire ID: ${updatedHire.id}`);
    console.log(`   Status after: ${updatedHire.status}`);
    console.log(`   Payment status after: ${updatedHire.paymentStatus}`);
    console.log(`   Payment reference: ${updatedHire.paymentReference}`);

    // Update the Offer to mark payment as confirmed and verified
    if (hire.offerId) {
      const updatedOffer = await prisma.offer.update({
        where: { id: hire.offerId },
        data: {
          paymentConfirmed: true,
          paymentVerified: true
        }
      });

      console.log(`✅ Offer ${hire.offerId} updated: paymentConfirmed=true, paymentVerified=true`);
    }

    // Notify both parties that the payment completed.
    // NotificationService never throws, so payment processing is unaffected.
    if (hire.employerId) {
      await createNotification(String(hire.employerId), {
        type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
        title: 'Payment Successful',
        message: `Your payment of ${updatedHire.totalDue ?? ''} EGP was completed successfully. Reference: ${updatedHire.paymentReference || captureId || 'N/A'}`,
        entityType: 'PAYMENT',
        entityId: String(hire.id),
        link: '/employer-payments',
      });
    }

    try {
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { id: String(hire.workerId) },
        select: { userId: true }
      });
      if (workerProfile?.userId) {
        await createNotification(String(workerProfile.userId), {
          type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
          title: 'Payment Confirmed',
          message: 'The employer completed the payment for your hire. The hire is now active.',
          entityType: 'HIRE',
          entityId: String(hire.id),
          link: '/my-hires',
        });
      }
    } catch (workerLookupError) {
      console.error('⚠️ Could not resolve worker for payment notification:', workerLookupError.message);
    }

    return true;

  } catch (error) {
    console.error('❌ Error updating hire after payment:', error);
    return false;
  }
};

// ============================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================

const ensureSubscription = async (userId, amount) => {
  try {
    console.log("ENTER ensureSubscription");
    console.log("Running findFirst...");
    const existing = await prisma.subscription.findFirst({
      where: {
        userId: String(userId),
        status: 'active',
        endDate: { gte: new Date() }
      }
    });
    console.log("findFirst result:", existing);
    if (existing) {
      console.log("Updating existing subscription...");
      const updated = await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      console.log("Update succeeded:", updated);

      // Notify the user their premium subscription was extended.
      await createNotification(String(userId), {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'Premium Subscription Renewed',
        message: `Your premium subscription has been extended until ${updated.endDate.toLocaleDateString()}.`,
        entityType: 'SUBSCRIPTION',
        entityId: String(updated.id),
        icon: '👑',
        link: '/subscription',
      });

      return updated;
    }
    console.log("Creating subscription...");
    const subscriptionData = {
      userId: String(userId),
      plan: 'premium',
      amount: Number(amount),
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    console.log("subscriptionData =", JSON.stringify(subscriptionData, null, 2));
    console.log(typeof subscriptionData.userId);
    console.log(typeof subscriptionData.amount);
    console.log(typeof subscriptionData.plan);
    console.log(typeof subscriptionData.status);
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/\/\/[^\/]+@/, "//<masked>@") : "not set");
    console.log("Authenticated userId:", userId);
    const count = await prisma.user.count();
    console.log("Total Prisma users:", count);
    const firstUsers = await prisma.user.findMany({
      take: 5
    });
    console.dir(firstUsers, { depth: null });
    const byId = await prisma.user.findUnique({
      where: {
        id: userId
      }
    });
    console.log("findUnique result:");
    console.dir(byId, { depth: null });
    const userExists = await prisma.user.findUnique({
      where: {
        id: subscriptionData.userId
      }
    });
    console.log("USER EXISTS:");
    console.dir(userExists, { depth: null });
    const existingSubs = await prisma.subscription.findMany({
      where: {
        userId: subscriptionData.userId
      }
    });
    console.log("EXISTING SUBSCRIPTIONS:");
    console.dir(existingSubs, { depth: null });
    try {
      console.log("========= BEFORE CREATE =========");
      console.log(subscriptionData);
      const created = await prisma.subscription.create({
        data: subscriptionData
      });
      console.log("========= CREATE SUCCESS =========");
      console.dir(created, { depth: null });

      // Notify the user their premium subscription is now active.
      await createNotification(String(userId), {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'Premium Subscription Activated',
        message: `Your premium subscription is now active until ${created.endDate.toLocaleDateString()}. Enjoy unlimited access!`,
        entityType: 'SUBSCRIPTION',
        entityId: String(created.id),
        icon: '👑',
        link: '/subscription',
      });

      return created;
    } catch (e) {
      console.log("========= CREATE FAILED =========");
      console.log("name:");
      console.log(e.name);
      console.log("code:");
      console.log(e.code);
      console.log("message:");
      console.log(e.message);
      console.log("meta:");
      console.dir(e.meta, { depth: null });
      console.log("stack:");
      console.log(e.stack);
      console.log("full error:");
      console.dir(e, { depth: null });
      throw e;
    }
  } catch(err) {
    console.error("========= PRISMA CREATE FAILED =========");
    console.error("name:", err.name);
    console.error("code:", err.code);
    console.error("message:", err.message);
    console.error("meta:", err.meta);
    console.error("stack:", err.stack);
    console.error(err);
    throw err;
  }
};

// ============================================================
// ROUTES
// ============================================================

/**
 * Create Payment Intent
 * POST /api/payments/create-payment-intent
 */
router.post('/create-payment-intent', authenticate, async (req, res) => {
  try {
    const {
      amount,
      paymentMethod,
      userEmail,
      workerName,
      workerId,
      jobTitle,
      employerId,
      employerName,
      hireId,
      phone,
      offerId
    } = req.body;

    console.log('📤 Creating payment intent:', {
      amount,
      paymentMethod,
      userEmail,
      jobTitle,
      hireId,
      offerId
    });

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    if (!hireId) {
      return res.status(400).json({
        success: false,
        error: 'hireId is required'
      });
    }

    const orderId = generateOrderId();
    const transactionId = generateId();

    const customerData = {
      firstName: employerName?.split(' ')[0] || 'Employer',
      lastName: employerName?.split(' ').slice(1).join(' ') || 'User',
      email: userEmail || 'employer@example.com',
      phone: phone || '+201234567890',
      userId: req.userId,
      workerId,
      workerName,
      jobTitle,
      employerId,
      employerName,
      hireId,
      offerId,
      transactionId,
      description: `Payment for ${jobTitle || 'service'} - ${workerName || 'worker'}`
    };

    // Check if payment already exists for this hireId with pending/processing status
    const existingPayment = await prisma.payment.findFirst({
      where: {
        hireId: hireId,
        status: {
          in: ['pending', 'processing']
        }
      }
    });

    let payment;
    if (existingPayment) {
      console.log('⚠️ Payment already exists for hire:', hireId, 'Updating:', existingPayment.id);
      
      // Update existing payment with new order details
      payment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          orderId: orderId,
          transactionId: transactionId,
          amount: Number(amount),
          paymentMethod: paymentMethod || 'paymob',
          userEmail: userEmail || existingPayment.userEmail,
          workerId: workerId || existingPayment.workerId,
          workerName: workerName || existingPayment.workerName,
          jobTitle: jobTitle || existingPayment.jobTitle,
          employerId: employerId || existingPayment.employerId,
          employerName: employerName || existingPayment.employerName,
          hireId: hireId,
          offerId: offerId || existingPayment.offerId,
          phone: phone || existingPayment.phone,
          metadata: {
            ...existingPayment.metadata,
            createdFrom: 'payment-intent',
            source: 'frontend',
            originalAmount: amount,
            originalCurrency: 'EGP',
            updatedAt: new Date().toISOString()
          }
        }
      });
      
      console.log('✅ Payment record updated:', transactionId);
    } else {
      // Create new payment record
      payment = await prisma.payment.create({
        data: {
          orderId,
          transactionId,
          amount: Number(amount),
          currency: 'EGP',
          paymentMethod: paymentMethod || 'paymob',
          status: 'pending',
          userEmail: userEmail || 'employer@example.com',
          userId: req.userId || null,
          workerId: workerId || null,
          workerName: workerName || 'Worker',
          jobTitle: jobTitle || null,
          employerId: employerId || null,
          employerName: employerName || null,
          hireId: hireId,
          offerId: offerId || null,
          phone: phone || null,
          metadata: {
            createdFrom: 'payment-intent',
            source: 'frontend',
            originalAmount: amount,
            originalCurrency: 'EGP'
          }
        }
      });
      console.log('✅ Payment record created:', transactionId);
    }

    let result;

    if (paymentMethod === 'paymob' || !paymentMethod) {
      try {
        const authToken = await getPaymobAuthToken();
        const paymobOrder = await createPaymobOrder(authToken, amount, orderId, customerData);
        const paymobOrderId = paymobOrder.id;
        const paymentKey = await getPaymobPaymentKey(authToken, paymobOrderId, amount, customerData);

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            paymobOrderId: String(paymobOrderId),
            status: 'processing'
          }
        });

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
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            metadata: { ...(payment.metadata || {}), error: error.message }
          }
        });

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

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            paypalOrderId,
            approvalUrl,
            status: 'processing'
          }
        });

        console.log(`✅ PayPal order created with approval URL: ${approvalUrl}`);

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

      } catch (error) {
        console.error('❌ PayPal integration error:', error);
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            metadata: { ...(payment.metadata || {}), error: error.message }
          }
        });

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
 * Get PayPal Approval URL
 * GET /api/payments/paypal-approval/:orderId
 */
router.get('/paypal-approval/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { paypalOrderId: orderId }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    if (!payment.approvalUrl) {
      return res.status(400).json({
        success: false,
        error: 'No approval URL found for this payment'
      });
    }

    res.json({
      success: true,
      approvalUrl: payment.approvalUrl,
      orderId: payment.orderId,
      transactionId: payment.transactionId
    });

  } catch (error) {
    console.error('❌ Get approval URL error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get approval URL'
    });
  }
});

/**
 * Capture PayPal Order
 * POST /api/payments/capture-paypal/:orderId
 */
router.post('/capture-paypal/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`🔍 Capturing PayPal order: ${orderId}`);

    // Find by paypalOrderId
    let payment = await prisma.payment.findFirst({
      where: { paypalOrderId: orderId }
    });

    // If not found, try by orderId
    if (!payment) {
      payment = await prisma.payment.findFirst({
        where: { orderId: orderId }
      });
    }

    if (!payment) {
      console.log(`❌ Payment not found for order: ${orderId}`);
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    console.log(`✅ Found payment for order: ${orderId}, status: ${payment.status}`);

    // If already completed, return success
    if (payment.status === 'completed') {
      console.log(`✅ Payment already completed: ${orderId}`);
      console.log("RETURN SUCCESS PATH A");
      return res.json({
        success: true,
        message: 'Payment already completed',
        transaction: {
          id: payment.transactionId,
          orderId: payment.orderId,
          amount: payment.amount,
          status: 'completed',
          paymentMethod: 'paypal'
        }
      });
    }

    // Check if payment is still pending approval
    if (payment.status === 'pending' || payment.status === 'processing') {
      // Get PayPal access token
      let accessToken;
      try {
        accessToken = await getPayPalAccessToken();
        console.log('✅ PayPal access token obtained');
      } catch (tokenError) {
        console.error('❌ Failed to get PayPal access token:', tokenError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to authenticate with PayPal. Please try again.'
        });
      }

      const baseUrl = process.env.PAYPAL_MODE === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

      try {
        // First, check the order status
        const orderCheck = await axios.get(
          `${baseUrl}/v2/checkout/orders/${orderId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        console.log(`📊 Order ${orderId} status: ${orderCheck.data?.status}`);

        // If order is already completed, update and return
        if (orderCheck.data?.status === 'COMPLETED') {
          const captureId = orderCheck.data?.purchase_units?.[0]?.payments?.captures?.[0]?.id;

          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'completed',
              completedAt: new Date(),
              captureId: captureId || null
            }
          });

          // Update hire status
          if (payment.hireId) {
            await updateHireAfterPayment(payment.hireId, captureId);
          }

          // Persist subscription in MongoDB
          console.log("CALLING ensureSubscription");
          await ensureSubscription(payment.userId, payment.amount);

          console.log("RETURN SUCCESS PATH A");
          return res.json({
            success: true,
            message: 'Payment already completed',
            transaction: {
              id: payment.transactionId,
              orderId: payment.orderId,
              amount: payment.amount,
              status: 'completed',
              paymentMethod: 'paypal'
            }
          });
        }

        // If order is APPROVED, capture it
        if (orderCheck.data?.status === 'APPROVED') {
          console.log(`🔄 Order ${orderId} is APPROVED, attempting to capture...`);

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

          console.log(`📥 PayPal capture response status: ${captureResponse.data?.status}`);

          if (captureResponse.data && captureResponse.data.status === 'COMPLETED') {
            const captureId = captureResponse.data.id || captureResponse.data?.purchase_units?.[0]?.payments?.captures?.[0]?.id;

            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'completed',
                completedAt: new Date(),
                captureId: captureId || null
              }
            });

            console.log(`✅ PayPal order captured successfully: ${orderId}`);

            // Update hire status
            if (payment.hireId) {
              await updateHireAfterPayment(payment.hireId, captureId);
            }

            // Persist subscription in MongoDB
            console.log("CALLING ensureSubscription");
            await ensureSubscription(payment.userId, payment.amount);

            console.log("RETURN SUCCESS PATH B");
            return res.json({
              success: true,
              message: 'Payment captured successfully',
              transaction: {
                id: payment.transactionId,
                orderId: payment.orderId,
                amount: payment.amount,
                status: 'completed',
                paymentMethod: 'paypal',
                paypalOrderId: orderId,
                captureId: captureId
              }
            });
          } else {
            // If capture didn't complete, return the status
            return res.json({
              success: false,
              error: `Order status: ${captureResponse.data?.status || 'unknown'}`,
              status: captureResponse.data?.status || 'unknown'
            });
          }
        }

        // If order is CREATED or PENDING_APPROVAL, user hasn't approved yet
        if (orderCheck.data?.status === 'CREATED' || orderCheck.data?.status === 'PAYER_ACTION_REQUIRED') {
          return res.json({
            success: false,
            error: 'Order not approved by user yet. Please complete the PayPal approval process.',
            status: 'PENDING_APPROVAL',
            approvalUrl: payment.approvalUrl
          });
        }

        // Any other status
        return res.json({
          success: false,
          error: `Order status: ${orderCheck.data?.status || 'unknown'}`,
          status: orderCheck.data?.status || 'unknown'
        });

      } catch (captureError) {
        console.error('❌ PayPal capture API error:', captureError.response?.data || captureError.message);

        const errorData = captureError.response?.data;

        // Handle specific error cases
        if (errorData?.details) {
          const details = errorData.details;

          // Check for ORDER_ALREADY_CAPTURED
          const alreadyCaptured = details.some(d => d.issue === 'ORDER_ALREADY_CAPTURED');
          if (alreadyCaptured) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'completed',
                completedAt: new Date(),
                captureId: 'CAPTURED_' + Date.now()
              }
            });

            // Update hire status
            if (payment.hireId) {
              await updateHireAfterPayment(payment.hireId, 'CAPTURED_' + Date.now());
            }

            // Persist subscription in MongoDB
            console.log("CALLING ensureSubscription");
            await ensureSubscription(payment.userId, payment.amount);

            console.log("RETURN SUCCESS PATH A");
            return res.json({
              success: true,
              message: 'Payment was already captured',
              transaction: {
                id: payment.transactionId,
                orderId: payment.orderId,
                amount: payment.amount,
                status: 'completed',
                paymentMethod: 'paypal'
              }
            });
          }

          // Check for ORDER_NOT_APPROVED
          const notApproved = details.some(d => d.issue === 'ORDER_NOT_APPROVED');
          if (notApproved) {
            return res.json({
              success: false,
              error: 'Order not approved by user yet.',
              status: 'PENDING_APPROVAL',
              approvalUrl: payment.approvalUrl
            });
          }

          // Handle COMPLIANCE_VIOLATION with fallback for development
          const complianceViolation = details.some(d => d.issue === 'COMPLIANCE_VIOLATION');
          if (complianceViolation) {
            console.log('⚠️ COMPLIANCE_VIOLATION detected');

            // In development mode, simulate successful capture
            if (process.env.NODE_ENV === 'development' || process.env.PAYPAL_MODE === 'sandbox') {
              console.log('🔄 Development mode: Simulating successful capture...');

              const testCaptureId = 'TEST_CAPTURE_' + Date.now();

              // Update payment status to completed
              await prisma.payment.update({
                where: { id: payment.id },
                data: {
                  status: 'completed',
                  completedAt: new Date(),
                  captureId: testCaptureId
                }
              });

              // Update hire status
              if (payment.hireId) {
                await updateHireAfterPayment(payment.hireId, testCaptureId);
              }

              // Persist subscription in MongoDB
              console.log("CALLING ensureSubscription");
              await ensureSubscription(payment.userId, payment.amount);

              console.log('✅ Payment simulated successfully for testing');
              console.log("RETURN SUCCESS PATH B");

              return res.json({
                success: true,
                message: 'Payment completed (test mode - compliance bypass)',
                transaction: {
                  id: payment.transactionId,
                  orderId: payment.orderId,
                  amount: payment.amount,
                  status: 'completed',
                  paymentMethod: 'paypal',
                  captureId: testCaptureId
                }
              });
            }

            // In production, return the error
            return res.json({
              success: false,
              error: 'Payment cannot be processed due to compliance restrictions. Please use a different payment method.',
              status: 'COMPLIANCE_VIOLATION',
              useAlternative: true
            });
          }
        }

        // Generic error
        const errorMessage = errorData?.message ||
                            errorData?.error_description ||
                            captureError.message ||
                            'PayPal capture failed';

        return res.status(500).json({
          success: false,
          error: errorMessage,
          details: errorData || null
        });
      }
    }

    // If payment status is failed or any other status
    return res.status(400).json({
      success: false,
      error: `Payment cannot be captured. Current status: ${payment.status}`
    });

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

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { transactionId: paymentId },
          { orderId: paymentId },
          { paypalOrderId: paymentId }
        ]
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // If PayPal payment, check status from PayPal
    if (payment.paymentMethod === 'paypal' && payment.paypalOrderId && payment.status !== 'completed') {
      try {
        const accessToken = await getPayPalAccessToken();
        const baseUrl = process.env.PAYPAL_MODE === 'production'
          ? 'https://api-m.paypal.com'
          : 'https://api-m.sandbox.paypal.com';

        const orderCheck = await axios.get(
          `${baseUrl}/v2/checkout/orders/${payment.paypalOrderId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (orderCheck.data?.status === 'COMPLETED') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'completed',
              completedAt: new Date()
            }
          });
          payment.status = 'completed';
          payment.completedAt = new Date();
        }
      } catch (error) {
        console.log('⚠️ Could not check PayPal status:', error.message);
      }
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
        updatedAt: payment.updatedAt,
        completedAt: payment.completedAt,
        approvalUrl: payment.approvalUrl
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
 * @deprecated Manual payment completion is obsolete. Payments are now captured
 * and verified automatically via the PayPal capture endpoint
 * (POST /api/payments/capture-paypal/:orderId) and Paymob, which already mark
 * the payment completed and call updateHireAfterPayment(). There is NO manual
 * "Mark as Paid" UI anymore.
 *
 * This endpoint is retained temporarily for backward compatibility with the
 * current automated frontend flow, which calls it as a redundant no-op after a
 * successful capture. It must NOT be used to manually mark a payment as paid.
 * TODO: remove once the redundant frontend call is cleaned up.
 *
 * POST /api/payments/complete-payment
 */
router.post('/complete-payment', async (req, res) => {
  try {
    const { orderId, transactionId, userId } = req.body;

    console.log('✅ Completing payment manually:', { orderId, transactionId, userId });

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { orderId },
          { transactionId },
          { paypalOrderId: orderId }
        ]
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Update hire status
    if (payment.hireId) {
      await updateHireAfterPayment(payment.hireId, 'MANUAL_' + Date.now());
    }

    res.json({
      success: true,
      message: 'Payment completed successfully',
      payment: {
        id: payment.transactionId,
        orderId: payment.orderId,
        amount: payment.amount,
        status: 'completed',
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
 * Get Current User Subscription Status (READ-ONLY)
 * GET /api/payments/subscription-status
 * Returns the real subscription from MongoDB (single source of truth).
 * The frontend uses this to REFLECT premium state after payment — it never
 * creates a subscription here.
 */
router.get('/subscription-status', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: String(userId),
        status: 'active',
        endDate: { gte: new Date() }
      },
      orderBy: { endDate: 'desc' }
    });

    res.json({
      success: true,
      isPremium: !!subscription,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate
          }
        : null
    });

  } catch (error) {
    console.error('❌ Subscription status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get subscription status'
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

    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { userId: userId },
          { userEmail: userId },
          { employerId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

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
        updatedAt: p.updatedAt,
        completedAt: p.completedAt
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

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { transactionId },
          { orderId },
          { paypalOrderId: orderId }
        ]
      }
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

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { orderId: merchant_order_id || orderId },
          { transactionId },
          { paymobOrderId: orderId },
          { paypalOrderId: orderId }
        ]
      }
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
      const updateData = { status: newStatus };

      if (newStatus === 'completed') {
        updateData.completedAt = new Date();
      }

      if (transactionId) {
        updateData.paymobTransactionId = transactionId;
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: updateData
      });
      console.log(`✅ Payment ${payment.transactionId} updated to ${newStatus}`);

      // Update hire status if payment completed
      if (newStatus === 'completed' && payment.hireId) {
        await updateHireAfterPayment(payment.hireId, 'WEBHOOK_' + Date.now());
      }
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