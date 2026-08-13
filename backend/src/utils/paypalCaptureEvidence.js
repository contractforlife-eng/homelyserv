export class PayPalEvidenceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'PayPalEvidenceError';
    this.code = code;
  }
}

const assertMoney = (money, expected, label) => {
  if (
    money?.currency_code !== expected.currency
    || String(money?.value ?? '') !== expected.amount
  ) {
    throw new PayPalEvidenceError('PAYPAL_MONEY_MISMATCH', `${label} amount/currency mismatch`);
  }
};

const findPurchaseUnit = (providerOrder, purchaseUnitReference) => (
  providerOrder?.purchase_units?.find((unit) => unit.reference_id === purchaseUnitReference)
);

export const verifyPayPalApprovalEvidence = ({ providerOrder, orderId, purchaseUnitReference, expected }) => {
  if (!orderId || providerOrder?.id !== orderId) {
    throw new PayPalEvidenceError('PAYPAL_ORDER_IDENTITY_MISMATCH', 'PayPal order identity mismatch');
  }
  const purchaseUnit = findPurchaseUnit(providerOrder, purchaseUnitReference);
  if (!purchaseUnit) {
    throw new PayPalEvidenceError('PAYPAL_PURCHASE_UNIT_MISMATCH', 'PayPal purchase-unit identity mismatch');
  }
  assertMoney(purchaseUnit.amount, expected, 'PayPal order');
  return { orderId: providerOrder.id, purchaseUnitId: purchaseUnit.reference_id };
};

// Both POST capture and GET completed-order responses expose authoritative
// captured money at purchase_units[].payments.captures[].amount. Order-level
// purchaseUnit.amount is deliberately not required here because the fresh
// capture representation may omit it; approval evidence was verified before
// capture, and capture evidence is the monetary authority after capture.
export const verifyPayPalCaptureEvidence = ({ providerOrder, orderId, purchaseUnitReference, expected }) => {
  if (!orderId || providerOrder?.id !== orderId) {
    throw new PayPalEvidenceError('PAYPAL_ORDER_IDENTITY_MISMATCH', 'PayPal order identity mismatch');
  }
  const purchaseUnit = findPurchaseUnit(providerOrder, purchaseUnitReference);
  if (!purchaseUnit) {
    throw new PayPalEvidenceError('PAYPAL_PURCHASE_UNIT_MISMATCH', 'PayPal purchase-unit identity mismatch');
  }
  if (providerOrder.status !== 'COMPLETED') {
    throw new PayPalEvidenceError('PAYPAL_ORDER_NOT_COMPLETED', 'PayPal order is not completed');
  }
  const capture = purchaseUnit.payments?.captures?.find((item) => item.status === 'COMPLETED');
  if (!capture?.id) {
    throw new PayPalEvidenceError('PAYPAL_CAPTURE_MISSING', 'PayPal completed capture evidence is missing');
  }
  assertMoney(capture.amount, expected, 'PayPal capture');
  return {
    orderId: providerOrder.id,
    purchaseUnitId: purchaseUnit.reference_id,
    captureId: capture.id,
    captureStatus: capture.status,
    amount: String(capture.amount.value),
    currency: capture.amount.currency_code,
  };
};

export default verifyPayPalCaptureEvidence;
