// backend/src/models/StudentFriendship.js
// ============================================================
// STUDENT FRIENDSHIP MODEL
//
// Represents peer relationships between HomelyServ students.
//
// LIFECYCLE / STATE MACHINE:
// - PENDING:   Request sent by requesterUserId. Awaiting recipient review.
// - ACCEPTED:  Accepted by recipientUserId. Mutual communication permitted.
// - REJECTED:  Declined by recipientUserId.
// - BLOCKED:   Blocked by a participant.
//
// CONSTRAINTS & SECURITY:
// - userLow / userHigh: Deterministic sorted pair of [requesterUserId, recipientUserId]
//   guaranteeing a unique compound index prevents duplicate reverse relationships
//   between the same two users regardless of who initiated it.
// - No self-relationships (requesterUserId !== recipientUserId).
// - Both users must reference User (role: STUDENT).
// - An accepted friendship persists independently once established.
// ============================================================
import mongoose from 'mongoose';

export const FRIENDSHIP_STATUSES = Object.freeze(['PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED']);

const studentFriendshipSchema = new mongoose.Schema(
  {
    requesterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Canonical sorted pair IDs for strict bidirectional uniqueness
    userLow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userHigh: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: FRIENDSHIP_STATUSES,
      default: 'PENDING',
      index: true
    },
    sourceGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherGroup',
      default: null,
      index: true
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Enforce unique pair between two users
studentFriendshipSchema.index({ userLow: 1, userHigh: 1 }, { unique: true });
studentFriendshipSchema.index({ requesterUserId: 1, status: 1 });
studentFriendshipSchema.index({ recipientUserId: 1, status: 1 });

// Pre-validate hook to assign userLow/userHigh deterministically
studentFriendshipSchema.pre('validate', function (next) {
  if (this.requesterUserId && this.recipientUserId) {
    const s1 = String(this.requesterUserId);
    const s2 = String(this.recipientUserId);
    if (s1 === s2) {
      return next(new Error('Cannot create friendship with oneself'));
    }
    if (s1 < s2) {
      this.userLow = this.requesterUserId;
      this.userHigh = this.recipientUserId;
    } else {
      this.userLow = this.recipientUserId;
      this.userHigh = this.requesterUserId;
    }
  }
  next();
});

const StudentFriendship = mongoose.model('StudentFriendship', studentFriendshipSchema);
export default StudentFriendship;
