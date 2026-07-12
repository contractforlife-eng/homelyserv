// src/utils/commissionManager.js
export const COMMISSION_RATE = 0.10; // 10%

export const checkCommissionPaid = (offerId, workerId) => {
  try {
    const paidOffers = JSON.parse(localStorage.getItem('commission_paid_offers') || '[]');
    return paidOffers.some(p => p.offerId === offerId && p.workerId === workerId);
  } catch (error) {
    console.error('Error checking commission:', error);
    return false;
  }
};

export const markCommissionPaid = (offerId, workerId, amount) => {
  try {
    const paidOffers = JSON.parse(localStorage.getItem('commission_paid_offers') || '[]');
    const exists = paidOffers.some(p => p.offerId === offerId && p.workerId === workerId);
    if (!exists) {
      paidOffers.push({
        offerId,
        workerId,
        amount,
        paidAt: new Date().toISOString(),
        status: 'paid'
      });
      localStorage.setItem('commission_paid_offers', JSON.stringify(paidOffers));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error marking commission paid:', error);
    return false;
  }
};

export const getCommissionAmount = (totalAmount) => {
  return totalAmount * COMMISSION_RATE;
};