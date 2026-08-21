const MANUAL_PAYMENT_METHOD_IDS = new Set(['vodafone_cash', 'instapay']);

// The provider-capability response describes automated gateways only. Manual
// methods remain visible independently, while Paymob stays explicitly hidden.
export const getVisiblePaymentMethods = (methods, availableProviderIds) => (
  methods.filter(({ id }) => {
    if (id === 'paymob') return false;
    if (MANUAL_PAYMENT_METHOD_IDS.has(id)) return true;
    if (id === 'paypal') {
      return availableProviderIds === null || availableProviderIds.includes('paypal');
    }
    return false;
  })
);
