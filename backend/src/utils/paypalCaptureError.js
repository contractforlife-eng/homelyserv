const TERMINAL_ISSUES = new Set([
  'COMPLIANCE_VIOLATION',
  'MAX_NUMBER_OF_PAYMENT_ATTEMPTS_EXCEEDED',
  'PAYEE_ACCOUNT_RESTRICTED',
  'PAYEE_ACCOUNT_LOCKED_OR_CLOSED',
  'PAYEE_ACCOUNT_INVALID',
  'PAYER_ACCOUNT_RESTRICTED',
  'PAYER_ACCOUNT_LOCKED_OR_CLOSED',
  'PAYER_CANNOT_PAY',
  'PAYEE_BLOCKED_TRANSACTION',
  'CURRENCY_NOT_SUPPORTED',
]);

export const getPayPalIssueCodes = (errorData) => (
  (errorData?.details || []).map((detail) => detail?.issue).filter(Boolean)
);

export const classifyPayPalCaptureError = ({ errorData, httpStatus, hasResponse = true } = {}) => {
  const issues = getPayPalIssueCodes(errorData);
  const code = issues[0] || errorData?.name || 'PAYPAL_CAPTURE_FAILED';

  if (code === 'ORDER_ALREADY_CAPTURED') {
    return { code, category: 'VERIFY_EXISTING_CAPTURE', retryable: false, newOrderRequired: false };
  }
  if (code === 'ORDER_NOT_APPROVED') {
    return { code, category: 'BUYER_ACTION', retryable: true, newOrderRequired: false };
  }
  if (code === 'REDIRECT_PAYER_FOR_ALTERNATE_FUNDING') {
    return { code, category: 'BUYER_ACTION', retryable: false, newOrderRequired: true };
  }
  if (TERMINAL_ISSUES.has(code)) {
    return { code, category: 'TERMINAL', retryable: false, newOrderRequired: true };
  }

  const transient = !hasResponse || httpStatus === 408 || httpStatus === 429 || httpStatus >= 500;
  return transient
    ? { code, category: 'TRANSIENT', retryable: true, newOrderRequired: false }
    : { code, category: 'TERMINAL', retryable: false, newOrderRequired: true };
};

export default classifyPayPalCaptureError;
