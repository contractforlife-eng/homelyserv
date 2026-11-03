// backend/src/services/actionNotificationReconciliationService.js
// ============================================================
// DURABLE RECOVERY FOR REQUIRED ACTIONS NOTIFICATIONS
// Scans for saved required actions that have not yet had their notification
// handed off to the notification / PushOutbox pipeline (notificationHandedOff !== true).
// Reconciles them without duplicate notifications using atomic marking.
// ============================================================
import prisma from '../lib/prisma.js';
import { createNotification, NOTIFICATION_TYPES } from './notificationService.js';
import { enqueuePushOutbox } from './pushOutboxService.js';

let reconciliationTimer = null;

export const reconcilePendingActionNotifications = async (options = {}) => {
  const prismaClient = options.prisma || prisma;
  const createNotif = options.createNotification || createNotification;
  const enqueuePush = options.enqueuePushOutbox || enqueuePushOutbox;

  let totalChecked = 0;
  let totalRecovered = 0;

  try {
    // Find applications that have at least one requiredAction with notificationHandedOff !== true
    const rawResult = await prismaClient.$runCommandRaw({
      find: 'job_applications',
      filter: {
        'requiredActions.notificationHandedOff': { $ne: true },
      },
      limit: 50,
    });

    const docs = rawResult?.cursor?.firstBatch || [];
    totalChecked = docs.length;

    for (const doc of docs) {
      const appId = String(doc._id?.$oid || doc._id);
      const workerId = String(doc.workerId?.$oid || doc.workerId);
      const jobPostId = String(doc.jobPostId?.$oid || doc.jobPostId);
      const actions = Array.isArray(doc.requiredActions) ? doc.requiredActions : [];

      for (const action of actions) {
        if (action.notificationHandedOff === true) continue;

        // Fetch job post title if available
        let jobTitle = null;
        try {
          const jobPost = await prismaClient.jobPost.findUnique({
            where: { id: jobPostId },
            select: { jobTitle: true },
          });
          jobTitle = jobPost?.jobTitle || null;
        } catch {}

        const eventKey = `job_app_action:${appId}:${action.id}`;

        try {
          const notif = await createNotif(workerId, {
            type: NOTIFICATION_TYPES.SYSTEM,
            title: 'Action Required for Job Application',
            message: `New required action for your job application${jobTitle ? `: ${jobTitle}` : ''}`,
            entityType: 'JOB_APPLICATION',
            entityId: appId,
            link: `/worker/offers?applicationId=${appId}&actionId=${action.id}`,
            eventKey,
            enqueuePush: false, // Managed explicitly below
            data: {
              applicationId: appId,
              actionId: action.id,
              jobPostId,
            },
          });

          if (notif) {
            // Guarantee that the PushOutbox entry exists for that same notification ID before marking handoff complete
            try {
              await enqueuePush(workerId, notif);
            } catch (pushErr) {
              console.error(`[ActionNotificationReconciliation] Failed to enqueue PushOutbox for action ${action.id}:`, pushErr.message);
              // Do NOT mark handoff complete if push outbox enqueue failed; allow next pass to retry
              continue;
            }

            // Atomically mark this specific action's notificationHandedOff = true
            await prismaClient.$runCommandRaw({
              update: 'job_applications',
              updates: [
                {
                  q: {
                    _id: { $oid: appId },
                    'requiredActions.id': action.id,
                  },
                  u: {
                    $set: {
                      'requiredActions.$.notificationHandedOff': true,
                      'requiredActions.$.notificationId': notif.id,
                      'requiredActions.$.notificationHandedOffAt': new Date().toISOString(),
                    },
                  },
                },
              ],
            });
            totalRecovered++;
          }
        } catch (dispatchErr) {
          console.error(`[ActionNotificationReconciliation] Failed to recover action ${action.id}:`, dispatchErr.message);
        }
      }
    }
  } catch (err) {
    console.error('[ActionNotificationReconciliation] Reconciliation pass error:', err.message);
  }

  return { checked: totalChecked, recovered: totalRecovered };
};

export const startActionNotificationReconciliationWorker = (intervalMs = 60 * 1000) => {
  if (reconciliationTimer || process.env.NODE_ENV === 'test') return reconciliationTimer;

  const run = () =>
    reconcilePendingActionNotifications().catch((err) => {
      console.error('[ActionNotificationReconciliationWorker] Error during pass:', err.message);
    });

  reconciliationTimer = setInterval(run, intervalMs);
  reconciliationTimer.unref?.();
  run();

  return reconciliationTimer;
};

export const stopActionNotificationReconciliationWorker = () => {
  if (reconciliationTimer) {
    clearInterval(reconciliationTimer);
    reconciliationTimer = null;
  }
};
