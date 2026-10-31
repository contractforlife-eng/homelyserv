import mongoose from 'mongoose';

const pushOutboxItemSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      default: 'SYSTEM',
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
      default: 'system',
    },
    data: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour default expiration
      index: true,
    },
    nextRetryAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lockedAt: {
      type: Date,
      default: null,
      index: true,
    },
    lockedBy: {
      type: String,
      default: null,
    },
    lockClaimToken: {
      type: String,
      default: null,
      index: true,
    },
    deviceStates: [
      {
        deviceId: String,
        token: String,
        status: {
          type: String,
          enum: ['pending', 'sent', 'failed', 'invalid_token'],
          default: 'pending',
        },
        error: String,
        sentAt: Date,
      },
    ],
    lastError: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for lock-acquisition & worker queue querying
pushOutboxItemSchema.index({ status: 1, nextRetryAt: 1, lockedAt: 1 });
// Enforce unique notificationId to prevent double-enqueueing
pushOutboxItemSchema.index({ notificationId: 1 }, { unique: true });

const PushOutbox =
  mongoose.models.PushOutbox || mongoose.model('PushOutbox', pushOutboxItemSchema);

export default PushOutbox;
