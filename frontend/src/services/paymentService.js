// src/services/paymentService.js
// Complete Payment Service with Backend Integration

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/payments`
  : 'http://localhost:5000/api/payments';

// ============================================================
// PAYMENT INTENT - Calls Backend
// ============================================================

/**
 * Create Payment Intent via Backend
 * @param {object} paymentData - Payment data
 * @returns {object} - Payment result
 */
export const createPaymentIntent = async (paymentData) => {
  try {
    console.log('📤 Creating payment intent via backend:', paymentData);

    // Get authentication token
    const token = localStorage.getItem('homelyserv_token') ||
                  (localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage'))?.state?.token : null);

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/create-payment-intent`, {
      method: 'POST',
      headers,
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Payment creation failed');
    }

    console.log('✅ Payment intent created:', data);
    return data;
  } catch (error) {
    console.error('❌ Payment intent error:', error);
    throw error;
  }
};

// ============================================================
// PAYMOB INTEGRATION - Via Backend
// ============================================================

/**
 * 1. Create Paymob Payment (via Backend)
 * @param {number} amount - Payment amount in EGP
 * @param {string} orderId - Your order reference ID
 * @param {object} customerData - Customer billing information
 * @returns {object} - Payment result with iframe URL
 */
export const createPaymobPayment = async (amount, orderId, customerData) => {
  console.log(`🔄 Creating Paymob payment via backend for: ${amount} EGP`);
  
  return createPaymentIntent({
    amount,
    paymentMethod: 'paymob',
    userEmail: customerData?.email,
    workerName: customerData?.firstName + ' ' + customerData?.lastName,
    userId: customerData?.userId,
    workerId: customerData?.workerId,
    jobTitle: customerData?.jobTitle,
    employerId: customerData?.employerId,
    employerName: customerData?.employerName,
    hireId: customerData?.hireId,
    phone: customerData?.phone
  });
};

/**
 * 2. Verify Paymob Payment (via Backend)
 * @param {object} paymentData - Payment data from webhook
 * @returns {object} - Verification result
 */
export const verifyPaymobPayment = async (paymentData) => {
  try {
    const { paymentId } = paymentData;
    console.log(`🔍 Verifying Paymob payment: ${paymentId}`);
    
    const response = await fetch(`${API_BASE}/status/${paymentId}`);
    const data = await response.json();
    
    if (data.success && data.payment) {
      console.log('✅ Paymob payment verified');
      return {
        success: true,
        payment: data.payment
      };
    } else {
      return {
        success: false,
        error: 'Payment not found'
      };
    }
  } catch (error) {
    console.error('❌ Paymob verification error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify Paymob payment'
    };
  }
};

/**
 * 3. Process Paymob Webhook (via Backend)
 * @param {object} webhookData - Webhook data from Paymob
 * @returns {object} - Processed transaction
 */
export const processPaymobWebhook = async (webhookData) => {
  try {
    console.log('📨 Processing Paymob webhook via backend');
    
    const response = await fetch(`${API_BASE}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Paymob webhook error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process Paymob webhook'
    };
  }
};

// ============================================================
// PAYPAL INTEGRATION - Via Backend
// ============================================================

/**
 * 1. Create PayPal Order (via Backend)
 * @param {number} amount - Payment amount
 * @param {string} orderId - Your order reference ID
 * @param {object} customerData - Customer information
 * @returns {object} - PayPal order result
 */
export const createPayPalOrder = async (amount, orderId, customerData) => {
  console.log(`🔄 Creating PayPal order via backend for: ${amount}`);
  
  return createPaymentIntent({
    amount,
    paymentMethod: 'paypal',
    userEmail: customerData?.email,
    workerName: customerData?.firstName + ' ' + customerData?.lastName,
    userId: customerData?.userId,
    workerId: customerData?.workerId,
    jobTitle: customerData?.jobTitle,
    employerId: customerData?.employerId,
    employerName: customerData?.employerName,
    hireId: customerData?.hireId
  });
};

/**
 * 2. Capture PayPal Payment (via Backend)
 * @param {string} orderId - PayPal order ID
 * @returns {object} - Capture result
 */
export const capturePayPalOrder = async (orderId) => {
  try {
    console.log(`🔍 Capturing PayPal order via backend: ${orderId}`);
    
    const response = await fetch(`${API_BASE}/capture-paypal/${orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ PayPal capture error:', error);
    return {
      success: false,
      error: error.message || 'Failed to capture PayPal payment'
    };
  }
};

/**
 * 3. Process PayPal Webhook (via Backend)
 * @param {object} webhookData - Webhook data from PayPal
 * @returns {object} - Processed transaction
 */
export const processPayPalWebhook = async (webhookData) => {
  try {
    console.log('📨 Processing PayPal webhook via backend');
    
    const response = await fetch(`${API_BASE}/paypal-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ PayPal webhook error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process PayPal webhook'
    };
  }
};

// ============================================================
// TRANSACTION MANAGEMENT (DEPRECATED - Use backend API instead)
// The following localStorage functions are deprecated.
// Use the backend API functions: getUserPayments, getPaymentStatus, completePayment
// ============================================================

export const saveTransaction = (transaction) => {
  try {
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
    
    const transactions = JSON.parse(localStorage.getItem('homelyserv_transactions') || '[]');
    
    const existingIndex = transactions.findIndex(t => t.id === transaction.id);
    if (existingIndex !== -1) {
      transactions[existingIndex] = { ...transactions[existingIndex], ...transaction };
    } else {
      transactions.push(transaction);
    }
    
    localStorage.setItem('homelyserv_transactions', JSON.stringify(transactions));
    
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

export const getTransaction = (transactionId) => {
  try {
    const transactions = JSON.parse(localStorage.getItem('homelyserv_transactions') || '[]');
    return transactions.find(t => t.id === transactionId) || null;
  } catch (error) {
    console.error('❌ Error getting transaction:', error);
    return null;
  }
};

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

export const getTransactionStats = (userId) => {
  try {
    const transactions = getTransactionsByUser(userId);
    
    const total = transactions.length;
    const completed = transactions.filter(t => t.status === 'completed' || t.status === 'COMPLETED').length;
    const pending = transactions.filter(t => t.status === 'pending' || t.status === 'PENDING').length;
    const failed = transactions.filter(t => t.status === 'failed' || t.status === 'FAILED').length;
    
    const totalAmount = transactions
      .filter(t => t.status === 'completed' || t.status === 'COMPLETED')
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
// HELPER FUNCTIONS
// ============================================================

export const validateWebhookSignature = (data, secret) => {
  if (!data || !secret) {
    console.warn('⚠️ Missing webhook data or secret');
    return false;
  }
  return true;
};

export const generateTransactionId = () => {
  const prefix = 'TXN';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 8);
  return `${prefix}-${timestamp}-${random}`;
};

export const formatAmount = (amount, currency = 'EGP') => {
  return `${currency} ${amount.toFixed(2)}`;
};

export const isPaymentCompleted = (transaction) => {
  return transaction?.status === 'completed' || transaction?.status === 'COMPLETED';
};

export const isPaymentPending = (transaction) => {
  return transaction?.status === 'pending' || transaction?.status === 'PENDING' || 
         transaction?.status === 'processing' || transaction?.status === 'PROCESSING';
};

// ============================================================
// COMPLETE PAYMENT (via Backend)
// ============================================================

export const completePayment = async (orderId, userId) => {
  try {
    const response = await fetch(`${API_BASE}/complete-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, userId })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error completing payment:', error);
    throw error;
  }
};

export const getPaymentStatus = async (paymentId) => {
  try {
    const response = await fetch(`${API_BASE}/status/${paymentId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error getting payment status:', error);
    throw error;
  }
};

export const getUserPayments = async (userId) => {
  try {
    const response = await fetch(`${API_BASE}/user/${userId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error getting user payments:', error);
    throw error;
  }
};

// ============================================================
// EXPORT ALL FUNCTIONS
// ============================================================

export default {
  createPaymentIntent,
  completePayment,
  getPaymentStatus,
  getUserPayments,
  createPaymobPayment,
  verifyPaymobPayment,
  processPaymobWebhook,
  createPayPalOrder,
  capturePayPalOrder,
  processPayPalWebhook,
  saveTransaction,
  getTransaction,
  getTransactionsByUser,
  updateTransactionStatus,
  getTransactionStats,
  generateTransactionId,
  formatAmount,
  isPaymentCompleted,
  isPaymentPending,
  validateWebhookSignature
};