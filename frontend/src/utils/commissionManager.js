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