const MANUAL_PAYMENT_METHOD_IDS = new Set(['vodafone_cash', 'instapay']);

// The provider-capability response describes automated gateways only. Manual
// methods remain visible independently, while Paymob stays explicitly hidden.
export const getVisiblePaymentMethods = (methods, availableProviderIds, {
  showEgyptianManualMethods = true,
  bankTransferAvailable = null,
} = {}) => (
  methods.filter(({ id }) => {
    if (id === 'paymob') return false;
    if (MANUAL_PAYMENT_METHOD_IDS.has(id)) return showEgyptianManualMethods;
    if (id === 'paypal') {
      return availableProviderIds === null || availableProviderIds.includes('paypal');
    }
    if (id === 'bank_transfer') return bankTransferAvailable !== false;
    return false;
  })
);
