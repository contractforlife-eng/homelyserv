import User from '../models/User.js';
import { createNotification, NOTIFICATION_TYPES, PRIORITIES } from './notificationService.js';
import { sendPushToUser } from './fcmService.js';

export const ADMIN_PAYMENT_REVIEW_NOTIFICATION_TYPE = 'ADMIN_PAYMENT_REVIEW_REQUIRED';

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
 * Callers must invoke this only after creation succeeds or an atomic guarded
 * transition reports one modified Payment. Delivery failures never affect the
 * Payment lifecycle.
 */
export const notifyAdminsForPaymentReview = async (payment, dependencies = {}) => {
  if (!isCanonicalAdminReviewPayment(payment)) {
    return { notified: 0, skipped: true };
  }

  try {
    const findAdmins = dependencies.findAdmins || (async () => User.find({ role: 'ADMIN', isSuspended: { $ne: true } }).select('_id'));
    const createAdminNotification = dependencies.createNotification || createNotification;
    const sendAdminPush = dependencies.sendPushToUser || sendPushToUser;
    const admins = await findAdmins();
    const alert = buildAdminPaymentReviewAlert(payment);

    await Promise.allSettled(admins.map(async (admin) => {
      const adminId = String(admin._id);
      await createAdminNotification(adminId, {
        ...alert,
        type: NOTIFICATION_TYPES.ADMIN_PAYMENT_REVIEW_REQUIRED || alert.type,
      });
      await sendAdminPush(adminId, {
        title: alert.title,
        body: alert.message,
        data: alert.data,
        channelId: 'payments',
      });
    }));

    return { notified: admins.length, skipped: false };
  } catch (error) {
    console.error('[PAYMENT-REVIEW] Admin alert delivery failed:', error?.code || error?.message || 'unknown error');
    return { notified: 0, skipped: false };
  }
};
