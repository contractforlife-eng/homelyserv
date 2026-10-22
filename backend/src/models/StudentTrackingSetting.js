import mongoose from 'mongoose';

const studentTrackingSettingSchema = new mongoose.Schema(
  {
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    activationState: {
      type: String,
      enum: ['DISABLED', 'AWAITING_AGE_SAFEGUARD', 'AWAITING_NATIVE_VERIFICATION', 'ACTIVE', 'PAUSED'],
      default: 'DISABLED'
    },
    collectionEnabled: { type: Boolean, default: false },
    consentVersion: { type: String, default: null },
    consentAt: { type: Date, default: null },
    activatedAt: { type: Date, default: null },
    pausedAt: { type: Date, default: null },
    disabledReason: { type: String, default: 'NOT_ACTIVATED', maxlength: 80 },
    ageSafeguardStatus: {
      type: String,
      enum: ['REQUIRED', 'VERIFIED_ADULT', 'GUARDIAN_APPROVED'],
      default: 'REQUIRED'
    },
    reportedPermissionStatus: {
      type: String,
      enum: ['UNSUPPORTED', 'NOT_REQUESTED', 'DENIED', 'GRANTED_WHILE_IN_USE', 'GRANTED_BACKGROUND'],
      default: 'NOT_REQUESTED'
    },
    nativePermissionVerifiedAt: { type: Date, default: null },
    nativePublicKey: { type: String, default: null, select: false, maxlength: 2048 },
    nativeKeyRegisteredAt: { type: Date, default: null },
    activationChallengeHash: { type: String, default: null, select: false },
    activationChallengeExpiresAt: { type: Date, default: null, select: false },
    guardianApprovedAt: { type: Date, default: null },
    guardianApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    permissionReportedAt: { type: Date, default: null },
    platform: { type: String, enum: ['web', 'android', 'ios', 'unknown'], default: 'unknown' },
    timeZone: { type: String, default: 'Africa/Cairo', maxlength: 64 },
    lastReportedAt: { type: Date, default: null }
  },
  { timestamps: true, collection: 'student_tracking_settings' }
);

export default mongoose.models.StudentTrackingSetting
  || mongoose.model('StudentTrackingSetting', studentTrackingSettingSchema);
