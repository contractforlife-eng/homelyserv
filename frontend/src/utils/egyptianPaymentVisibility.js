// Legacy accounts may lack countryCode. Preserve their existing manual-method
// presentation until a reviewed account-data migration exists.
export const canShowEgyptianManualPaymentMethods = (user) => {
  const countryCode = typeof user?.countryCode === 'string'
    ? user.countryCode.trim().toUpperCase()
    : '';

  return !countryCode || countryCode === 'EG';
};
