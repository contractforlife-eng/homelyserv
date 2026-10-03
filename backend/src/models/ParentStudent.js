// backend/src/models/ParentStudent.js
// ============================================================
// PARENT-STUDENT MODEL (PHASE 10)
//
// Represents the educational link between a parent/guardian account
// (WORKER or EMPLOYER) and an independent child (STUDENT).
//
// LIFECYCLE / STATUSES:
// - PENDING:   Request sent by parentUserId. Awaiting student confirmation.
// - ACTIVE:    Approved by studentUserId. Parent educational access granted.
// - REJECTED:  Declined by studentUserId.
// - ENDED:     Terminated by either party.
//
// INTEGRITY & SECURITY:
// - parentUserId must have role WORKER or EMPLOYER.
// - studentUserId must have role STUDENT.
// - Compound unique index on [parentUserId, studentUserId] prevents duplicate links.
// - Self-linking is prohibited (parentUserId !== studentUserId).
// ============================================================
import mongoose from 'mongoose';

export const PARENT_STUDENT_STATUSES = Object.freeze(['PENDING', 'ACTIVE', 'REJECTED', 'ENDED']);

const parentStudentSchema = new mongoose.Schema(
  {
    parentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    studentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    relationshipStatus: {
      type: String,
      enum: PARENT_STUDENT_STATUSES,
      default: 'PENDING',
      index: true
    },
    relationshipType: {
      type: String,
      enum: ['PARENT', 'GUARDIAN', 'FAMILY'],
      default: 'PARENT'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: {
      type: Date,
      default: null
    },
    endedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'parent_students'
  }
);

// Compound unique index preventing duplicate pairs
parentStudentSchema.index({ parentUserId: 1, studentUserId: 1 }, { unique: true });

// Secondary index for fast lookup of active children per parent
parentStudentSchema.index({ parentUserId: 1, relationshipStatus: 1 });

// Secondary index for fast lookup of parent requests per student
parentStudentSchema.index({ studentUserId: 1, relationshipStatus: 1 });

const ParentStudent = mongoose.models.ParentStudent || mongoose.model('ParentStudent', parentStudentSchema);

export default ParentStudent;
