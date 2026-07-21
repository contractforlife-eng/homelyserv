// backend/src/routes/payment.js
import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import prisma from '../lib/prisma.js';

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

    const returnUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-success`;
    const cancelUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-cancel`;

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
            custom_id: JSON.stringify({
              orderId: orderId,
              transactionId: customerData?.transactionId,
              userEmail: customerData?.email,
              workerId: customerData?.workerId,
              workerName: customerData?.workerName,
              jobTitle: customerData?.jobTitle,
              employerId: customerData?.employerId,
              employerName: customerData?.employerName,
              hireId: customerData?.hireId,
              offerId: customerData?.offerId
            }),
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
// UPDATE OFFER AFTER PAYMENT - Prisma version (replaces Mongoose localStorage and Offer model)
// ============================================================
const updateOfferAfterPayment = async (offerId, captureId) => {
  try {
    if (!offerId) {
      console.log('⚠️ No offerId provided, skipping offer update');
      return false;
    }

    console.log(`📝 Updating offer ${offerId} after payment...`);

    // Find the hire (offer) in Prisma
    const hire = await prisma.hire.findFirst({
      where: { id: offerId }
    });

    if (!hire) {
      console.log(`⚠️ Hire/Offer ${offerId} not found in database`);
      return false;
    }

    console.log(`📋 Found hire: ${hire.status} for employer ${hire.employerId}`);

    // Update the hire with payment completion
    await prisma.hire.update({
      where: { id: hire.id },
      data: {
        paymentStatus: 'completed',
        paymentReference: captureId || ('CAPTURED_' + Date.now()),
        status: 'paid'
      }
    });

    console.log(`✅ Hire/Offer ${offerId} updated to "paid" in Prisma`);
    console.log('✅ Offer update completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Error updating offer after payment:', error);
    return false;
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
      phone,
      offerId
    } = req.body;

    console.log('📤 Creating payment intent:', {
      amount,
      paymentMethod,
      userEmail,
      jobTitle,
      offerId
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
      offerId,
      transactionId,
      description: `Payment for ${jobTitle || 'service'} - ${workerName || 'worker'}`
    };

    const payment = await prisma.payment.create({
      data: {
        orderId,
        transactionId,
        amount: Number(amount),
        currency: 'EGP',
        paymentMethod: paymentMethod || 'paymob',
        status: 'pending',
        userEmail: userEmail || 'employer@example.com',
        userId: userId || userEmail || null,
        workerId: workerId || null,
        workerName: workerName || 'Worker',
        jobTitle: jobTitle || null,
        employerId: employerId || null,
        employerName: employerName || null,
        hireId: hireId || null,
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

          // Update offer
          await updateOfferAfterPayment(payment.offerId, captureId);

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

            // Update offer
            await updateOfferAfterPayment(payment.offerId, captureId);

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

            // Update offer
            await updateOfferAfterPayment(payment.offerId, 'CAPTURED_' + Date.now());

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

              // Update offer status
              await updateOfferAfterPayment(payment.offerId, testCaptureId);

              console.log('✅ Payment simulated successfully for testing');

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
 * Complete Payment (Manual completion for testing)
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

    // Update offer
    await updateOfferAfterPayment(payment.offerId, 'MANUAL_' + Date.now());

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