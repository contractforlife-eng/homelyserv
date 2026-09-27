// backend/src/models/DoctorVerificationAudit.js
// ============================================================
// DOCTOR VERIFICATION AUDIT TRAIL
// ============================================================
// Records every administrative verification decision for Doctor profiles.
// Immutable from normal Doctor UI; only ADMIN/SUPPORT can create records.
//
// Tracks:
// - Doctor being verified
// - Verification type (phone, email, identity, experience, certificates, profile)
// - Previous and new status
// - Reviewer (ADMIN/SUPPORT) identity
// - Timestamp
// - Rejection reason if applicable
// ============================================================
import mongoose from 'mongoose';

const doctorVerificationAuditSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    verificationType: {
      type: String,
      enum: ['PHONE', 'EMAIL', 'IDENTITY_DOCUMENT', 'WORK_EXPERIENCE', 'CERTIFICATES_LICENSES', 'PROFILE'],
      required: true,
      index: true
    },
    previousStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'],
      required: true
    },
    newStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'],
      required: true
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reviewerRole: {
      type: String,
      // Only ADMIN (Co-Admin) and SUPPORT (Sup-Admin) hold equal Doctor
      // verification authority. SUPPORT_HELPER (Sup-Help) is READ-ONLY and
      // can therefore never appear here.
      enum: ['ADMIN', 'SUPPORT'],
      required: true
    },
    rejectionReason: {
      type: String,
      default: null,
      maxlength: 1000
    },
    notes: {
      type: String,
      default: null,
      maxlength: 1000
    }
  },
  {
    collection: 'doctor_verification_audit',
    timestamps: true
  }
);

// Compound index for reviewing a doctor's verification history
doctorVerificationAuditSchema.index({ doctorId: 1, createdAt: -1 });

// Compound index for reviewer activity tracking
doctorVerificationAuditSchema.index({ reviewerId: 1, createdAt: -1 });

// ============================================================
// IMMUTABILITY
// ------------------------------------------------------------
// An audit record is append-only. Once a verification decision has been
// written it must never be mutated or removed, so the history of Doctor
// trust decisions cannot be rewritten after the fact. There is no update
// or delete code path in the application; these hooks make that a
// database-level guarantee rather than a convention.
// ============================================================
const IMMUTABLE_OPERATION_ERROR = 'Doctor verification audit records are immutable and cannot be modified or deleted';

const rejectMutation = (...args) => {
  const error = new Error(IMMUTABLE_OPERATION_ERROR);
  const next = args.find((arg) => typeof arg === 'function');
  if (next) return next(error);
  throw error;
};

doctorVerificationAuditSchema.pre('updateOne', rejectMutation);
doctorVerificationAuditSchema.pre('updateMany', rejectMutation);
doctorVerificationAuditSchema.pre('findOneAndUpdate', rejectMutation);
doctorVerificationAuditSchema.pre('findOneAndReplace', rejectMutation);
doctorVerificationAuditSchema.pre('replaceOne', rejectMutation);
doctorVerificationAuditSchema.pre('deleteOne', rejectMutation);
doctorVerificationAuditSchema.pre('deleteMany', rejectMutation);
doctorVerificationAuditSchema.pre('findOneAndDelete', rejectMutation);

const DoctorVerificationAudit = mongoose.models.DoctorVerificationAudit || mongoose.model('DoctorVerificationAudit', doctorVerificationAuditSchema);

export { IMMUTABLE_OPERATION_ERROR };

export default DoctorVerificationAudit;