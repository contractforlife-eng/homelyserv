// src/utils/commissionManager.js
export const COMMISSION_RATE = 0.10;

// ============================================================
// ✅ التحقق الفعلي من الدفع
// ============================================================
export const verifyPayment = (offerId, workerId) => {
  try {
    console.log(`🔍 Verifying payment for offer: ${offerId}, worker: ${workerId}`);
    
    const paidOffers = JSON.parse(localStorage.getItem('commission_paid_offers') || '[]');
    console.log('📋 Paid offers in localStorage:', paidOffers);
    
    const payment = paidOffers.find(p => p.offerId === offerId && p.workerId === workerId);
    
    if (!payment) {
      console.log('❌ No payment found');
      return { verified: false, message: 'No payment found' };
    }
    
    console.log('✅ Payment found:', payment);
    return { 
      verified: true, 
      payment: payment,
      message: 'Payment verified'
    };
    
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { verified: false, message: 'Verification error' };
  }
};

// ============================================================
// ✅ تسجيل الدفع الفعلي
// ============================================================
export const markCommissionPaid = (offerId, workerId, amount, transactionId) => {
  try {
    console.log(`💳 Recording payment: ${offerId}, ${workerId}`);
    
    const paidOffers = JSON.parse(localStorage.getItem('commission_paid_offers') || '[]');
    
    // التحقق من عدم التكرار
    const exists = paidOffers.some(p => p.offerId === offerId && p.workerId === workerId);
    if (exists) {
      console.warn('⚠️ Payment already exists');
      return { success: false, message: 'Payment already exists' };
    }
    
    // تسجيل الدفع
    const paymentRecord = {
      offerId,
      workerId,
      amount,
      transactionId: transactionId || 'TXN-' + Date.now(),
      paidAt: new Date().toISOString(),
      status: 'paid'
    };
    
    paidOffers.push(paymentRecord);
    localStorage.setItem('commission_paid_offers', JSON.stringify(paidOffers));
    
    console.log('✅ Payment recorded:', paymentRecord);
    console.log('📋 All paid offers:', paidOffers);
    
    // حفظ إيصال
    saveReceipt(paymentRecord);
    
    return { success: true, payment: paymentRecord };
    
  } catch (error) {
    console.error('Error:', error);
    return { success: false, message: 'Error recording payment' };
  }
};

const saveReceipt = (payment) => {
  try {
    const receipts = JSON.parse(localStorage.getItem('commission_receipts') || '[]');
    receipts.push({
      id: 'REC-' + Date.now(),
      offerId: payment.offerId,
      workerId: payment.workerId,
      amount: payment.amount,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt,
      status: 'completed'
    });
    localStorage.setItem('commission_receipts', JSON.stringify(receipts));
    console.log('✅ Receipt saved');
  } catch (error) {
    console.error('Error saving receipt:', error);
  }
};

export const checkCommissionPaid = (offerId, workerId) => {
  const result = verifyPayment(offerId, workerId);
  return result.verified;
};

export const getCommissionAmount = (totalAmount) => {
  return Math.round(totalAmount * COMMISSION_RATE);
};

export const COMMISSION_RATE = 0.10;;

export const getWorkerEarnings = (totalAmount) => {
  return totalAmount - getCommissionAmount(totalAmount);
};export const getCommissionHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('commission_paid_offers') || '[]');
  } catch (error) {
    console.error('Error fetching commission history:', error);
    return [];
  }
};export const clearCommissionHistory = () => {
  try {
    localStorage.removeItem('commission_paid_offers');
    localStorage.removeItem('commission_receipts');
    console.log('🧹 Commission history cleared');
    return { success: true };
  } catch (error) {
    console.error('Error clearing history:', error);
    return { success: false, message: 'Error clearing history' };
  }
};export const getReceipts = () => {
  try {
    return JSON.parse(localStorage.getItem('commission_receipts') || '[]');
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return [];
  }
};const verifyPayment = (offerId, workerId) => {
  const paidOffers = JSON.parse(localStorage.getItem('commission_paid_offers') || '[]');
  const payment = paidOffers.find(p => p.offerId === offerId && p.workerId === workerId);
  return {
    verified: !!payment,
    payment
  };
};export const getCommissionStats = () => {
  const paidOffers = JSON.parse(localStorage.getItem('commission_paid_offers') || '[]');
  const totalCommission = paidOffers.reduce((sum, p) => sum + (p.amount * COMMISSION_RATE), 0);
  return {
    totalOffers: paidOffers.length,
    totalCommission: Math.round(totalCommission)
  };
};export const getWorkerTotalEarnings = (workerId) => {
  const paidOffers = JSON.parse(localStorage.getItem('commission_paid_offers') || '[]');
  const workerOffers = paidOffers.filter(p => p.workerId === workerId);
  const totalEarnings = workerOffers.reduce((sum, p) => sum + (p.amount - (p.amount * COMMISSION_RATE)), 0);
  return Math.round(totalEarnings);
};