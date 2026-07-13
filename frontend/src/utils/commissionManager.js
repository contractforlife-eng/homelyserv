// src/utils/commissionManager.js
export const COMMISSION_RATE = 0.10; // 10%

// ============================================================
// ✅ التحقق الفعلي من الدفع
// ============================================================
export const verifyPayment = (offerId, workerId) => {
  try {
    // 1. التحقق من قائمة المدفوعات المسجلة
    const paidOffers = JSON.parse(localStorage.getItem('commission_paid_offers') || '[]');
    const payment = paidOffers.find(p => p.offerId === offerId && p.workerId === workerId);
    
    if (!payment) {
      return { 
        verified: false, 
        message: 'No payment found for this offer',
        code: 'NOT_FOUND'
      };
    }
    
    if (payment.status !== 'paid') {
      return { 
        verified: false, 
        message: 'Payment not completed',
        code: 'NOT_COMPLETED'
      };
    }
    
    // 2. التحقق من صحة تاريخ الدفع (الصلاحية 30 يوم)
    const paymentDate = new Date(payment.paidAt);
    const now = new Date();
    const daysDiff = (now - paymentDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 30) {
      return { 
        verified: false, 
        message: 'Payment has expired (30 days limit)',
        code: 'EXPIRED'
      };
    }
    
    return { 
      verified: true, 
      payment: payment,
      message: 'Payment verified successfully',
      code: 'VERIFIED'
    };
    
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { 
      verified: false, 
      message: 'Verification error',
      code: 'ERROR'
    };
  }
};

// ============================================================
// ✅ تسجيل الدفع الفعلي مع التحقق من عدم التكرار
// ============================================================
export const markCommissionPaid = (offerId, workerId, amount, transactionId) => {
  try {
    // التحقق من عدم وجود دفع مسبق
    const paidOffers = JSON.parse(localStorage.getItem('commission_paid_offers') || '[]');
    const exists = paidOffers.some(p => p.offerId === offerId && p.workerId === workerId);
    
    if (exists) {
      console.warn('⚠️ Commission already paid for this offer');
      return { 
        success: false, 
        message: 'Payment already exists for this offer',
        code: 'DUPLICATE'
      };
    }
    
    // إنشاء سجل دفع جديد
    const paymentRecord = {
      offerId,
      workerId,
      amount,
      transactionId: transactionId || 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      paidAt: new Date().toISOString(),
      status: 'paid',
      verified: true
    };
    
    paidOffers.push(paymentRecord);
    localStorage.setItem('commission_paid_offers', JSON.stringify(paidOffers));
    
    console.log('✅ Commission marked as paid:', paymentRecord);
    
    // حفظ إيصال الدفع
    saveReceipt(paymentRecord);
    
    return { 
      success: true, 
      payment: paymentRecord,
      message: 'Payment recorded successfully',
      code: 'SUCCESS'
    };
    
  } catch (error) {
    console.error('Error marking commission paid:', error);
    return { 
      success: false, 
      message: 'Error recording payment',
      code: 'ERROR'
    };
  }
};

// ============================================================
// ✅ حفظ إيصال الدفع
// ============================================================
const saveReceipt = (payment) => {
  try {
    const receipt = {
      id: 'REC-' + Date.now(),
      offerId: payment.offerId,
      workerId: payment.workerId,
      amount: payment.amount,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt,
      status: 'completed'
    };
    
    const receipts = JSON.parse(localStorage.getItem('commission_receipts') || '[]');
    receipts.push(receipt);
    localStorage.setItem('commission_receipts', JSON.stringify(receipts));
    
    console.log('✅ Receipt saved:', receipt);
  } catch (error) {
    console.error('Error saving receipt:', error);
  }
};

// ============================================================
// ✅ التحقق من حالة الدفع (للعرض)
// ============================================================
export const checkCommissionPaid = (offerId, workerId) => {
  const result = verifyPayment(offerId, workerId);
  return result.verified;
};

export const getCommissionAmount = (totalAmount) => {
  return Math.round(totalAmount * COMMISSION_RATE);
};