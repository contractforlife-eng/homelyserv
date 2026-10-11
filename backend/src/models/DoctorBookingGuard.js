// backend/src/models/DoctorBookingGuard.js
// ============================================================
// DOCTOR BOOKING GUARD (Phase 5A — transaction-based booking guard)
//
// ONE document per doctor, whose _id IS the doctor's User ObjectId.
//
// This is deliberately NOT a lock: there is no owner, no lease, no TTL and
// no cleanup hook, so nothing can expire while a transaction is active.
// Inside a MongoDB transaction the document serves only as a write-conflict
// serialization point: the FIRST operation of every guarded booking
// transaction is a `$inc` on this document (see
// services/doctorBookingGuard.js), so two concurrent bookings for the same
// doctor serialize on WiredTiger's write lock and the loser restarts on a
// fresh snapshot that already includes the winner's committed appointment.
//
// Guard documents are created on demand by preSeedGuard() OUTSIDE the
// transaction — never at import time.
// ============================================================
import mongoose from 'mongoose';

const doctorBookingGuardSchema = new mongoose.Schema(
  {
    // _id is the doctor's User id. Declared explicitly as ObjectId so the
    // guard filter `{ _id: doctorId }` casts consistently with every other
    // doctorId query in the booking paths.
    _id: {
      type: mongoose.Schema.Types.ObjectId
    },
    // Monotonic counter of guarded booking attempts for this doctor. The
    // $inc is what makes the transactional guard update a genuine write
    // (the conflict participation point) even when nothing else changes.
    // Useful for observability only.
    seq: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    collection: 'doctor_booking_guards'
  }
);

// Registration follows the repository convention. The built-in unique _id
// is the only index required — no TTL, no extra index, no hooks.
const DoctorBookingGuard =
  mongoose.models.DoctorBookingGuard ||
  mongoose.model('DoctorBookingGuard', doctorBookingGuardSchema);

export default DoctorBookingGuard;
