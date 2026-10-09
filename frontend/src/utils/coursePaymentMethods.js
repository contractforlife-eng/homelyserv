// frontend/src/utils/coursePaymentMethods.js
// ============================================================
// COURSE PAYMENT METHOD CAPABILITY & VISIBILITY HELPERS
// ============================================================
// Evaluates which payment methods should be presented to students
// for purchasing a paid recorded course.
// Server-authoritative: Manual payments (Vodafone Cash, InstaPay)
// are available when course currency is 'EGP'.
// PayPal is available when returned in backend providers.
// ============================================================

export const getCoursePaymentMethods = ({
  currency = 'EGP',
  backendProviders = [],
} = {}) => {
  const normCurrency = String(currency || '').trim().toUpperCase();
  const availableProviderIds = Array.isArray(backendProviders)
    ? backendProviders.map((p) => (typeof p === 'string' ? p : p.provider)).filter(Boolean)
    : [];

  const methods = [];

  // PayPal: only if advertised as available by the backend for this course
  const paypalAvailable = availableProviderIds.includes('paypal');
  if (paypalAvailable) {
    methods.push({
      id: 'paypal',
      nameKey: 'studentCourses.paypalName',
      descKey: 'studentCourses.paypalDesc',
      type: 'gateway',
    });
  }

  // Egyptian manual methods (Vodafone Cash, InstaPay):
  // Supported by backend manual payment route specifically for EGP course purchases
  if (normCurrency === 'EGP') {
    methods.push({
      id: 'vodafone_cash',
      nameKey: 'studentCourses.vodafoneCashName',
      descKey: 'studentCourses.vodafoneCashDesc',
      type: 'manual',
    });
    methods.push({
      id: 'instapay',
      nameKey: 'studentCourses.instapayName',
      descKey: 'studentCourses.instapayDesc',
      type: 'manual',
    });
  }

  return methods;
};
