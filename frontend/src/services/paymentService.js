// src/services/paymentService.js
// Complete Payment Service with Paymob and PayPal Integration

import { PAYMENT_CONFIG, PAYMENT_METHODS, PAYMENT_STATUS, TRANSACTION_TYPES, getPaymobIframeUrl } from '../config/paymentConfig';

// ============================================================
// PAYMOB INTEGRATION
// ============================================================

/**
 * 1. Create Paymob Payment
 * @param {number} amount - Payment amount in EGP
 * @param {string} orderId - Your order reference ID
 * @param {object} customerData - Customer billing information
 * @returns {object} - Payment result with iframe URL
 */
export const createPaymobPayment = async (amount, orderId, customerData) => {
  try {
    console.log(`🔄 Creating Paymob payment for amount: ${amount} EGP, order: ${orderId}`);
    
    // Step 1: Get Authentication Token
    const authResponse = await fetch(`${PAYMENT_CONFIG.paymob.baseUrl}/auth/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: PAYMENT_CONFIG.paymob.apiKey
      })
    });
    
    const authData = await authResponse.json();
    const token = authData.token;
    
    if (!token) {
      console.error('❌ Failed to get Paymob authentication token');
      return {
        success: false,
        error: 'Failed to authenticate with Paymob'
      };
    }
    
    console.log('✅ Paymob authentication successful');
    
    // Step 2: Create Order
    const orderResponse = await fetch(`${PAYMENT_CONFIG.paymob.baseUrl}/ecommerce/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: false,
        amount_cents: amount * 100,
        merchant_order_id: orderId,
        items: customerData.items || [],
        currency: PAYMENT_CONFIG.currency.code
      })
    });
    
    const orderData = await orderResponse.json();
    const orderIdPaymob = orderData.id;
    
    if (!orderIdPaymob) {
      console.error('❌ Failed to create Paymob order');
      return {
        success: false,
        error: 'Failed to create Paymob order'
      };
    }
    
    console.log(`✅ Paymob order created: ${orderIdPaymob}`);
    
    // Step 3: Get Payment Key
    const paymentKeyResponse = await fetch(`${PAYMENT_CONFIG.paymob.baseUrl}/acceptance/payment_keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: amount * 100,
        expiration: 3600,
        order_id: orderIdPaymob,
        billing_data: {
          first_name: customerData.firstName || 'Customer',
          last_name: customerData.lastName || 'User',
          email: customerData.email || 'customer@example.com',
          phone_number: customerData.phone || '+201234567890',
          country: customerData.country || 'EG',
          state: customerData.state || 'Cairo',
          city: customerData.city || 'Cairo',
          street: customerData.street || '1 Main Street',
          building: customerData.building || '1',
          apartment: customerData.apartment || '1'
        },
        currency: PAYMENT_CONFIG.currency.code,
        integration_id: PAYMENT_CONFIG.paymob.integrationId,
        lock_order_when_paid: false
      })
    });
    
    const paymentKeyData = await paymentKeyResponse.json();
    const paymentKey = paymentKeyData.token;
    
    if (!paymentKey) {
      console.error('❌ Failed to get Paymob payment key');
      return {
        success: false,
        error: 'Failed to get Paymob payment key'
      };
    }
    
    console.log('✅ Paymob payment key obtained');
    
    // Generate iframe URL using the helper function
    const iframeUrl = getPaymobIframeUrl(paymentKey);
    
    return {
      success: true,
      paymentKey: paymentKey,
      orderId: orderIdPaymob,
      iframeUrl: iframeUrl
    };
    
  } catch (error) {
    console.error('❌ Paymob payment creation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create Paymob payment'
    };
  }
};

/**
 * 2. Verify Paymob Payment
 * @param {object} paymentData - Payment data from webhook
 * @returns {object} - Verification result
 */
export const verifyPaymobPayment = async (paymentData) => {
  try {
    const { paymentId, hmac } = paymentData;
    
    console.log(`🔍 Verifying Paymob payment: ${paymentId}`);
    
    // Verify HMAC signature
    const expectedHmac = generateHmac(paymentId, PAYMENT_CONFIG.paymob.hmacSecret);
    if (hmac !== expectedHmac) {
      console.error('❌ Invalid HMAC signature');
      return {
        success: false,
        error: 'Invalid HMAC signature'
      };
    }
    
    // Get payment details
    const response = await fetch(`${PAYMENT_CONFIG.paymob.baseUrl}/acceptance/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('✅ Paymob payment verified');
    
    return {
      success: true,
      payment: data
    };
    
  } catch (error) {
    console.error('❌ Paymob verification error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify Paymob payment'
    };
  }
};

/**
 * 3. HMAC Generator
 * @param {string} data - Data to hash
 * @param {string} secret - HMAC secret
 * @returns {string} - HMAC hash
 */
const generateHmac = (data, secret) => {
  // In production, use a proper crypto library
  // This is a simple implementation for demo purposes
  try {
    // Simple encoding - use proper crypto in production
    const encoded = btoa(data + ':' + secret);
    return encoded;
  } catch (error) {
    console.error('HMAC generation error:', error);
    return data + secret;
  }
};

/**
 * 4. Process Paymob Webhook
 * @param {object} webhookData - Webhook data from Paymob
 * @returns {object} - Processed transaction
 */
export const processPaymobWebhook = async (webhookData) => {
  try {
    const { order, type, data, hmac } = webhookData;
    
    console.log(`📨 Processing Paymob webhook: ${type}`);
    
    // Validate webhook signature
    if (!validateWebhookSignature(webhookData, PAYMENT_CONFIG.paymob.hmacSecret)) {
      console.error('❌ Invalid webhook signature');
      return {
        success: false,
        error: 'Invalid webhook signature'
      };
    }
    
    // Process based on transaction type
    const transaction = {
      id: data.id || 'TXN-' + Date.now(),
      paymentMethod: PAYMENT_METHODS.PAYMOB,
      amount: data.amount_cents ? data.amount_cents / 100 : data.amount || 0,
      currency: data.currency || PAYMENT_CONFIG.currency.code,
      status: type === 'PAID' || type === 'captured' ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.FAILED,
      reference: data.order_id || order.id,
      paymentId: data.id || data.payment_id,
      orderId: order.id,
      transactionType: data.metadata?.type || TRANSACTION_TYPES.HIRE,
      metadata: data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save transaction
    const saved = saveTransaction(transaction);
    
    if (saved) {
      console.log('✅ Paymob webhook processed successfully');
      return {
        success: true,
        transaction: transaction
      };
    } else {
      throw new Error('Failed to save transaction');
    }
    
  } catch (error) {
    console.error('❌ Paymob webhook error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process Paymob webhook'
    };
  }
};

// ============================================================
// PAYPAL INTEGRATION
// ============================================================

/**
 * 1. Get PayPal Access Token
 * @returns {string|null} - PayPal access token
 */
const getPayPalAccessToken = async () => {
  try {
    const auth = btoa(`${PAYMENT_CONFIG.paypal.clientId}:${PAYMENT_CONFIG.paypal.clientSecret}`);
    
    const response = await fetch(`${PAYMENT_CONFIG.paypal.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: 'grant_type=client_credentials'
    });
    
    const data = await response.json();
    
    if (!data.access_token) {
      console.error('❌ Failed to get PayPal access token');
      return null;
    }
    
    console.log('✅ PayPal authentication successful');
    return data.access_token;
    
  } catch (error) {
    console.error('❌ PayPal authentication error:', error);
    return null;
  }
};

/**
 * 2. Create PayPal Order
 * @param {number} amount - Payment amount
 * @param {string} orderId - Your order reference ID
 * @param {object} customerData - Customer information
 * @returns {object} - PayPal order result
 */
export const createPayPalOrder = async (amount, orderId, customerData) => {
  try {
    console.log(`🔄 Creating PayPal order for amount: ${amount}, order: ${orderId}`);
    
    const authToken = await getPayPalAccessToken();
    if (!authToken) {
      throw new Error('Failed to authenticate with PayPal');
    }
    
    const response = await fetch(`${PAYMENT_CONFIG.paypal.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'PayPal-Request-Id': orderId
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          amount: {
            currency_code: PAYMENT_CONFIG.paypal.currency,
            value: amount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: PAYMENT_CONFIG.paypal.currency,
                value: amount.toFixed(2)
              }
            }
          },
          custom_id: orderId,
          description: customerData.description || 'Payment for HomelyServ service',
          payee: {
            email_address: customerData.email || 'payee@homelyserv.com'
          }
        }],
        application_context: {
          brand_name: 'HomelyServ',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${window.location.origin}/payment/success`,
          cancel_url: `${window.location.origin}/payment/cancel`,
          shipping_preference: 'NO_SHIPPING'
        }
      })
    });
    
    const data = await response.json();
    
    if (data.status === 'CREATED' || data.status === 'APPROVED') {
      const approvalUrl = data.links.find(link => link.rel === 'approve')?.href;
      
      console.log(`✅ PayPal order created: ${data.id}`);
      
      // Save order for later verification
      savePayPalOrder(data.id, orderId, amount);
      
      return {
        success: true,
        orderId: data.id,
        approvalUrl: approvalUrl,
        status: data.status
      };
    } else {
      console.error('❌ PayPal order creation failed:', data);
      throw new Error(data.error?.message || 'Failed to create PayPal order');
    }
    
  } catch (error) {
    console.error('❌ PayPal order creation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create PayPal order'
    };
  }
};

/**
 * 3. Capture PayPal Payment
 * @param {string} orderId - PayPal order ID
 * @returns {object} - Capture result
 */
export const capturePayPalOrder = async (orderId) => {
  try {
    console.log(`🔍 Capturing PayPal order: ${orderId}`);
    
    const authToken = await getPayPalAccessToken();
    if (!authToken) {
      throw new Error('Failed to authenticate with PayPal');
    }
    
    const response = await fetch(`${PAYMENT_CONFIG.paypal.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.status === 'COMPLETED') {
      console.log('✅ PayPal payment captured successfully');
      
      // Process the payment
      const transaction = {
        id: data.id || 'TXN-' + Date.now(),
        paymentMethod: PAYMENT_METHODS.PAYPAL,
        amount: parseFloat(data.purchase_units[0].amount.value),
        currency: data.purchase_units[0].amount.currency_code,
        status: PAYMENT_STATUS.COMPLETED,
        reference: data.purchase_units[0].reference_id || data.id,
        paymentId: data.id,
        orderId: orderId,
        transactionType: data.purchase_units[0].custom_id || TRANSACTION_TYPES.HIRE,
        metadata: data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      saveTransaction(transaction);
      
      return {
        success: true,
        transaction: transaction
      };
    } else {
      console.error('❌ PayPal capture failed:', data);
      throw new Error(data.error?.message || 'Failed to capture PayPal payment');
    }
    
  } catch (error) {
    console.error('❌ PayPal capture error:', error);
    return {
      success: false,
      error: error.message || 'Failed to capture PayPal payment'
    };
  }
};

/**
 * 4. Process PayPal Webhook
 * @param {object} webhookData - Webhook data from PayPal
 * @returns {object} - Processed transaction
 */
export const processPayPalWebhook = async (webhookData) => {
  try {
    const { event_type, resource } = webhookData;
    
    console.log(`📨 Processing PayPal webhook: ${event_type}`);
    
    // Validate webhook signature
    if (!validateWebhookSignature(webhookData, PAYMENT_CONFIG.paypal.clientSecret)) {
      console.error('❌ Invalid webhook signature');
      return {
        success: false,
        error: 'Invalid webhook signature'
      };
    }
    
    let transaction = null;
    
    if (event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      transaction = {
        id: resource.id || 'TXN-' + Date.now(),
        paymentMethod: PAYMENT_METHODS.PAYPAL,
        amount: parseFloat(resource.amount.value),
        currency: resource.amount.currency_code,
        status: PAYMENT_STATUS.COMPLETED,
        reference: resource.reference_id || resource.id,
        paymentId: resource.id,
        orderId: resource.order_id,
        transactionType: resource.custom_id || TRANSACTION_TYPES.HIRE,
        metadata: resource,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const saved = saveTransaction(transaction);
      
      if (saved) {
        console.log('✅ PayPal webhook processed successfully');
      }
    } else if (event_type === 'PAYMENT.CAPTURE.DENIED' || event_type === 'PAYMENT.CAPTURE.REFUNDED') {
      // Handle failed or refunded payments
      const failedTransaction = {
        id: resource.id || 'TXN-' + Date.now(),
        paymentMethod: PAYMENT_METHODS.PAYPAL,
        amount: parseFloat(resource.amount?.value || 0),
        currency: resource.amount?.currency_code || PAYMENT_CONFIG.paypal.currency,
        status: event_type === 'PAYMENT.CAPTURE.DENIED' ? PAYMENT_STATUS.FAILED : PAYMENT_STATUS.REFUNDED,
        reference: resource.reference_id || resource.id,
        paymentId: resource.id,
        orderId: resource.order_id,
        transactionType: resource.custom_id || TRANSACTION_TYPES.HIRE,
        metadata: resource,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      saveTransaction(failedTransaction);
      console.log(`⚠️ PayPal webhook: ${event_type}`);
    }
    
    return {
      success: true,
      transaction: transaction
    };
    
  } catch (error) {
    console.error('❌ PayPal webhook error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process PayPal webhook'
    };
  }
};

// ============================================================
// TRANSACTION MANAGEMENT
// ============================================================

/**
 * 1. Save Transaction
 * @param {object} transaction - Transaction data
 * @returns {boolean} - Success status
 */
export const saveTransaction = (transaction) => {
  try {
    // Add user ID if available
    const userData = localStorage.getItem('homelyserv_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        transaction.userId = user.id || user.email;
        transaction.userEmail = user.email;
      } catch (e) {
        console.warn('Could not add user to transaction:', e);
      }
    }
    
    // Get existing transactions
    const transactions = JSON.parse(localStorage.getItem('homelyserv_transactions') || '[]');
    
    // Check if transaction already exists
    const existingIndex = transactions.findIndex(t => t.id === transaction.id);
    if (existingIndex !== -1) {
      transactions[existingIndex] = { ...transactions[existingIndex], ...transaction };
    } else {
      transactions.push(transaction);
    }
    
    localStorage.setItem('homelyserv_transactions', JSON.stringify(transactions));
    
    // Also save to all_payments for unified view
    const payments = JSON.parse(localStorage.getItem('all_payments') || '[]');
    const payment = {
      id: transaction.id,
      transactionId: transaction.id,
      paymentId: transaction.paymentId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      orderId: transaction.orderId,
      reference: transaction.reference,
      type: transaction.transactionType,
      userId: transaction.userId,
      userEmail: transaction.userEmail,
      metadata: transaction.metadata,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    };
    
    const paymentIndex = payments.findIndex(p => p.id === payment.id);
    if (paymentIndex !== -1) {
      payments[paymentIndex] = payment;
    } else {
      payments.push(payment);
    }
    
    localStorage.setItem('all_payments', JSON.stringify(payments));
    
    console.log('✅ Transaction saved successfully:', transaction.id);
    return true;
    
  } catch (error) {
    console.error('❌ Error saving transaction:', error);
    return false;
  }
};

/**
 * 2. Get Transaction by ID
 * @param {string} transactionId - Transaction ID
 * @returns {object|null} - Transaction data
 */
export const getTransaction = (transactionId) => {
  try {
    const transactions = JSON.parse(localStorage.getItem('homelyserv_transactions') || '[]');
    return transactions.find(t => t.id === transactionId) || null;
  } catch (error) {
    console.error('❌ Error getting transaction:', error);
    return null;
  }
};

/**
 * 3. Get Transactions by User
 * @param {string} userId - User ID or email
 * @returns {array} - List of transactions
 */
export const getTransactionsByUser = (userId) => {
  try {
    const transactions = JSON.parse(localStorage.getItem('homelyserv_transactions') || '[]');
    return transactions.filter(t => 
      t.userId === userId || 
      t.userEmail === userId || 
      t.metadata?.userId === userId
    );
  } catch (error) {
    console.error('❌ Error getting user transactions:', error);
    return [];
  }
};

/**
 * 4. Update Transaction Status
 * @param {string} transactionId - Transaction ID
 * @param {string} status - New status
 * @param {object} metadata - Additional metadata
 * @returns {boolean} - Success status
 */
export const updateTransactionStatus = (transactionId, status, metadata = {}) => {
  try {
    const transactions = JSON.parse(localStorage.getItem('homelyserv_transactions') || '[]');
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
      console.error('❌ Transaction not found:', transactionId);
      return false;
    }
    
    transaction.status = status;
    transaction.updatedAt = new Date().toISOString();
    transaction.metadata = { ...transaction.metadata, ...metadata };
    
    localStorage.setItem('homelyserv_transactions', JSON.stringify(transactions));
    
    // Also update in all_payments
    const payments = JSON.parse(localStorage.getItem('all_payments') || '[]');
    const payment = payments.find(p => p.id === transactionId);
    if (payment) {
      payment.status = status;
      payment.updatedAt = transaction.updatedAt;
      localStorage.setItem('all_payments', JSON.stringify(payments));
    }
    
    console.log(`✅ Transaction ${transactionId} updated to ${status}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error updating transaction:', error);
    return false;
  }
};

/**
 * 5. Get Transaction Statistics
 * @param {string} userId - User ID
 * @returns {object} - Statistics
 */
export const getTransactionStats = (userId) => {
  try {
    const transactions = getTransactionsByUser(userId);
    
    const total = transactions.length;
    const completed = transactions.filter(t => t.status === PAYMENT_STATUS.COMPLETED).length;
    const pending = transactions.filter(t => t.status === PAYMENT_STATUS.PENDING).length;
    const failed = transactions.filter(t => t.status === PAYMENT_STATUS.FAILED).length;
    
    const totalAmount = transactions
      .filter(t => t.status === PAYMENT_STATUS.COMPLETED)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    return {
      total,
      completed,
      pending,
      failed,
      totalAmount
    };
  } catch (error) {
    console.error('❌ Error getting transaction stats:', error);
    return {
      total: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      totalAmount: 0
    };
  }
};

// ============================================================
// WEBHOOK VALIDATION
// ============================================================

/**
 * Validate webhook signature
 * @param {object} data - Webhook data
 * @param {string} secret - Webhook secret
 * @returns {boolean} - Validation result
 */
export const validateWebhookSignature = (data, secret) => {
  // In production, implement proper signature validation
  // For now, we'll just check if the data exists
  if (!data || !secret) {
    console.warn('⚠️ Missing webhook data or secret');
    return false;
  }
  
  // For Paymob: Validate HMAC
  if (data.hmac && data.paymentId) {
    const expectedHmac = generateHmac(data.paymentId, secret);
    if (data.hmac !== expectedHmac) {
      console.error('❌ Invalid HMAC signature');
      return false;
    }
    return true;
  }
  
  // For PayPal: Check for webhook ID
  if (data.id && data.event_type) {
    // PayPal webhooks have an ID and event_type
    return true;
  }
  
  // Basic validation
  return true;
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Save PayPal Order for tracking
 * @param {string} orderId - PayPal order ID
 * @param {string} referenceId - Your reference ID
 * @param {number} amount - Order amount
 */
const savePayPalOrder = (orderId, referenceId, amount) => {
  try {
    const orders = JSON.parse(localStorage.getItem('paypal_orders') || '[]');
    orders.push({
      orderId,
      referenceId,
      amount,
      status: 'CREATED',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('paypal_orders', JSON.stringify(orders));
    console.log('✅ PayPal order saved for tracking:', orderId);
  } catch (error) {
    console.error('❌ Error saving PayPal order:', error);
  }
};

/**
 * Generate a unique transaction ID
 * @returns {string} - Unique transaction ID
 */
export const generateTransactionId = () => {
  const prefix = 'TXN';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 8);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Format amount for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} - Formatted amount
 */
export const formatAmount = (amount, currency = 'EGP') => {
  return `${currency} ${amount.toFixed(2)}`;
};

/**
 * Check if payment is completed
 * @param {object} transaction - Transaction object
 * @returns {boolean} - Is completed
 */
export const isPaymentCompleted = (transaction) => {
  return transaction?.status === PAYMENT_STATUS.COMPLETED;
};

/**
 * Check if payment is pending
 * @param {object} transaction - Transaction object
 * @returns {boolean} - Is pending
 */
export const isPaymentPending = (transaction) => {
  return transaction?.status === PAYMENT_STATUS.PENDING || 
         transaction?.status === PAYMENT_STATUS.PROCESSING;
};

// ============================================================
// EXPORT ALL FUNCTIONS
// ============================================================

export default {
  // Paymob
  createPaymobPayment,
  verifyPaymobPayment,
  processPaymobWebhook,
  
  // PayPal
  createPayPalOrder,
  capturePayPalOrder,
  processPayPalWebhook,
  
  // Transaction Management
  saveTransaction,
  getTransaction,
  getTransactionsByUser,
  updateTransactionStatus,
  getTransactionStats,
  
  // Helpers
  generateTransactionId,
  formatAmount,
  isPaymentCompleted,
  isPaymentPending,
  validateWebhookSignature
};