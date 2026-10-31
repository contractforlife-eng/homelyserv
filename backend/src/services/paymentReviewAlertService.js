import User from '../models/User.js';
import { createNotification, NOTIFICATION_TYPES, PRIORITIES } from './notificationService.js';

export const ADMIN_PAYMENT_REVIEW_NOTIFICATION_TYPE = 'ADMIN_PAYMENT_REVIEW_REQUIRED';

const safeId = (value) => String(value || 'unknown').slice(-8);

export const isCanonicalAdminReviewPayment = (payment) => (
  payment?.status === 'pending'
  && payment?.fulfillmentStatus === 'pending'
  && payment?.manualReviewState === 'pending_verification'
);

export const buildAdminPaymentReviewAlert = (payment) => ({
  type: ADMIN_PAYMENT_REVIEW_NOTIFICATION_TYPE,
  title: 'Payment Requires Review',
  message: 'A new payment is waiting for verification.',
  priority: PRIORITIES.HIGH,
  entityType: 'PAYMENT',
  entityId: String(payment.id),
  link: '/admin/payments',
  data: {
    paymentReview: 'required',
    paymentId: String(payment.id),
    purpose: String(payment.purpose || ''),
    paymentMethod: String(payment.paymentMethod || ''),
    orderId: String(payment.orderId || ''),
  },
});

/**
 * Best-effort delivery for one authoritative transition into Admin review.
 * Enqueues in-app notification via central createNotification pipeline, which
 * automatically queues native push delivery via PushOutbox (no duplicate sends).
 */
export const notifyAdminsForPaymentReview = async (payment, dependencies = {}) => {
  if (!isCanonicalAdminReviewPayment(payment)) {
    return { notified: 0, skipped: true };
  }

  console.info(`[PAYMENT-REVIEW] entered payment=${safeId(payment.id)} purpose=${payment.purpose || 'UNKNOWN'} provider=${payment.paymentMethod || 'UNKNOWN'}`);

  try {
    const findAdmins = dependencies.findAdmins || (async () => User.find({ role: 'ADMIN', isSuspended: { $ne: true } }).select('_id'));
    const createAdminNotification = dependencies.createNotification || createNotification;
    const admins = await findAdmins();
    const alert = buildAdminPaymentReviewAlert(payment);
    console.info(`[PAYMENT-REVIEW] eligible-admins payment=${safeId(payment.id)} count=${admins.length}`);

    await Promise.allSettled(admins.map(async (admin) => {
      const adminId = String(admin._id);
      const notification = await createAdminNotification(adminId, {
        ...alert,
        type: NOTIFICATION_TYPES.ADMIN_PAYMENT_REVIEW_REQUIRED || alert.type,
      });
      console.info(`[PAYMENT-REVIEW] in-app notification payment=${safeId(payment.id)} admin=${safeId(adminId)} created=${notification ? 'YES' : 'NO'}`);
    }));

    return { notified: admins.length, skipped: false };
  } catch (error) {
    console.error('[PAYMENT-REVIEW] Admin alert delivery failed:', error?.code || error?.name || 'unknown');
    return { notified: 0, skipped: false };
  }
};
