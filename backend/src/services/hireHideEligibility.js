export const UNRESOLVED_PAYMENT_STATUSES = Object.freeze([
  'pending',
  'processing',
  'pending_verification',
]);

export const isUnresolvedLinkedPayment = (payment) => {
  const status = String(payment?.status || '').toLowerCase();
  if (UNRESOLVED_PAYMENT_STATUSES.includes(status)) return true;

  return status === 'completed' &&
    String(payment?.fulfillmentStatus || '').toLowerCase() !== 'fulfilled';
};

export const isTerminatedHire = (hire) =>
  String(hire?.status || '').toLowerCase() === 'terminated';

export const canHideTerminatedHire = (hire, linkedPayments = []) =>
  isTerminatedHire(hire) && !linkedPayments.some(isUnresolvedLinkedPayment);
