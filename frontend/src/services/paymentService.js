import api from '../utils/api';
import useAuthStore from '../store/authStore';

export const createPaymentIntent = async (paymentData) => {
  const response = await api.post('/api/payments/create-payment-intent', paymentData);
  return response.data;
};

export const fetchCommissionProviders = async (hireId) => {
  const response = await api.get('/api/payments/providers', {
    params: { purpose: 'COMMISSION', hireId },
  });
  return response.data;
};

// PURPOSE is the backend's explicit discriminator (PAYMENT_PURPOSES in
// backend/src/config/subscription.js): SUBSCRIPTION or COMMISSION. The
// backend is authoritative for amounts — a SUBSCRIPTION intent is priced by
// the user's role and a COMMISSION intent by the hire's server-derived total.
export const createPaymobPayment = async (amount, orderId, customerData, options = {}) => {
  return createPaymentIntent({
    amount: Number(amount),
    paymentMethod: 'paymob',
    purpose: options.purpose || 'COMMISSION',
    plan: options.plan,
    userEmail: customerData?.email || 'employer@example.com',
    workerName: customerData?.firstName + ' ' + customerData?.lastName || customerData?.workerName || 'Worker',
    userId: customerData?.userId,
    workerId: customerData?.workerId,
    jobTitle: customerData?.jobTitle || 'Service',
    employerId: customerData?.employerId,
    employerName: customerData?.employerName || 'Employer',
    hireId: customerData?.hireId,
    offerId: customerData?.offerId,
    phone: customerData?.phone || '+201234567890',
    description: customerData?.description || `Payment for ${customerData?.jobTitle || 'service'}`
  });
};

export const verifyPaymobPayment = async (paymentData) => {
  try {
    const { paymentId } = paymentData;
    const response = await api.get(`/api/payments/status/${paymentId}`);
    if (response.data.success && response.data.payment) {
      return {
        success: true,
        payment: response.data.payment
      };
    }
    return {
      success: false,
      error: 'Payment not found'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to verify Paymob payment'
    };
  }
};

export const processPaymobWebhook = async (webhookData) => {
  try {
    const response = await api.post('/api/payments/webhook', webhookData);
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to process Paymob webhook'
    };
  }
};

export const createPayPalOrder = async (amount, orderId, customerData, options = {}) => {
  return createPaymentIntent({
    amount: Number(amount),
    paymentMethod: 'paypal',
    purpose: options.purpose || 'COMMISSION',
    plan: options.plan,
    userEmail: customerData?.email || 'employer@example.com',
    workerName: customerData?.firstName + ' ' + customerData?.lastName || customerData?.workerName || 'Worker',
    userId: customerData?.userId,
    workerId: customerData?.workerId,
    jobTitle: customerData?.jobTitle || 'Service',
    employerId: customerData?.employerId,
    employerName: customerData?.employerName || 'Employer',
    hireId: customerData?.hireId,
    offerId: customerData?.offerId,
    description: customerData?.description || `Payment for ${customerData?.jobTitle || 'service'}`
  });
};

export const capturePayPalOrder = async (orderId) => {
  try {
    const response = await api.post(`/api/payments/capture-paypal/${orderId}`);
    return response.data;
  } catch (error) {
    const classified = error.response?.data;
    if (classified && typeof classified.retryable === 'boolean') return classified;
    throw error;
  }
};

export const isTerminalPayPalCaptureResult = (result) => (
  result?.success === false && result?.retryable === false
);

export const processPayPalWebhook = async (webhookData) => {
  const response = await api.post('/api/payments/paypal-webhook', webhookData);
  return response.data;
};

export const saveTransaction = (transaction) => {
  try {
    const user = useAuthStore.getState().user;
    if (user) {
      try {
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
      paymentId: transaction.paymentId || transaction.id,
      amount: transaction.amount,
      currency: transaction.currency || 'EGP',
      status: transaction.status || 'completed',
      paymentMethod: transaction.paymentMethod,
      orderId: transaction.orderId,
      reference: transaction.reference,
      type: transaction.transactionType || 'payment',
      userId: transaction.userId,
      userEmail: transaction.userEmail,
      metadata: transaction.metadata,
      createdAt: transaction.createdAt || new Date().toISOString(),
      updatedAt: transaction.updatedAt || new Date().toISOString()
    };
    
    const paymentIndex = payments.findIndex(p => p.id === payment.id);
    if (paymentIndex !== -1) {
      payments[paymentIndex] = payment;
    } else {
      payments.push(payment);
    }
    
    localStorage.setItem('all_payments', JSON.stringify(payments));
    
    return true;
  } catch (error) {
    console.error('Error saving transaction:', error);
    return false;
  }
};

export const getTransaction = (transactionId) => {
  try {
    const transactions = JSON.parse(localStorage.getItem('homelyserv_transactions') || '[]');
    return transactions.find(t => t.id === transactionId) || null;
  } catch (error) {
    console.error('Error getting transaction:', error);
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
    console.error('Error getting user transactions:', error);
    return [];
  }
};

export const updateTransactionStatus = (transactionId, status, metadata = {}) => {
  try {
    const transactions = JSON.parse(localStorage.getItem('homelyserv_transactions') || '[]');
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
      console.error('Transaction not found:', transactionId);
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
    
    return true;
  } catch (error) {
    console.error('Error updating transaction:', error);
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
    console.error('Error getting transaction stats:', error);
    return {
      total: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      totalAmount: 0
    };
  }
};

export const validateWebhookSignature = (data, secret) => {
  if (!data || !secret) {
    console.warn('Missing webhook data or secret');
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

export const getPaymentStatus = async (paymentId) => {
  const response = await api.get(`/api/payments/status/${paymentId}`);
  return response.data;
};

export const getUserPayments = async (userId) => {
  const response = await api.get(`/api/payments/user/${userId}`);
  return response.data;
};

// Read-only: fetch the REAL subscription status from the backend (MongoDB).
// The backend ensureSubscription() is the single source of truth — the frontend
// only reads/reflects it, never creates it.
export const fetchSubscriptionStatus = async () => {
  const response = await api.get('/api/payments/subscription-status');
  return response.data;
};

export const verifyPayment = async (transactionId, orderId) => {
  const response = await api.post('/api/payments/verify', { transactionId, orderId });
  return response.data;
};

const paymentService = {
  createPaymentIntent,
  getPaymentStatus,
  getUserPayments,
  verifyPayment,
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

export default paymentService;
