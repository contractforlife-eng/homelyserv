// backend/src/services/doctorBookingGuard.js
// ============================================================
// TRANSACTION-BASED DOCTOR BOOKING GUARD — reusable foundation (Phase 5A)
//
// PUBLIC API (everything the Phase 5B integrations need):
//   - preSeedGuard(doctorId)              idempotent guard creation, run
//                                         OUTSIDE any transaction.
//   - withDoctorBookingTransaction(opts, run)
//                                         one booking critical section:
//       seed -> session.withTransaction(
//                 $inc guard  ->  overlap re-read  ->  run(session)
//               )
//   - BookingConflictError                409 (overlap / duplicate key)
//   - BookingGuardUnavailableError        503 (guard missing / seed failed)
//
// TRANSACTION ORDERING (the correctness core):
//   1. The `$inc` guard update is the FIRST operation of every transaction
//      and deliberately uses NO upsert: an absent guard must fail closed,
//      never be created silently inside the transaction.
//      (Mongoose 9 findOneAndUpdate returns `ResultDoc | null` — null if
//      and only if no document matched — so a null guard aborts the call.)
//   2. The shared overlap re-read runs INSIDE the same transaction with the
//      SAME session, AFTER the guard write, on the transaction's snapshot.
//      A losing concurrent booking therefore restarts on a fresh snapshot
//      that already sees the winner's committed appointment.
//   3. Only then does run(session) execute — it must perform ONLY database
//      writes (appointment insert; guest ClinicPatient find/create), all
//      with the session passed in.
//
// RETRY POLICY — label-driven only, never a manual replay:
//   - TransientTransactionError and UnknownTransactionCommitResult retries
//     are handled exclusively by the driver inside session.withTransaction().
//     This module never re-runs the booking callback on its own, and never
//     wraps the callback in a generic retry loop.
//   - If the driver still reports UnknownTransactionCommitResult when it
//     gives up, the outcome is AMBIGUOUS: the original error is tagged
//     (statusCode 503, commitOutcome 'UNKNOWN') with its labels and cause
//     preserved, and is NEVER replayed — callers must not claim the booking
//     definitely succeeded or definitely failed.
//   - Duplicate-key (11000) raised inside the transaction maps to a 409
//     conflict with the original error kept as `cause`. Application errors
//     that already carry a `statusCode` (overlap conflicts, guard missing,
//     validation) pass through untouched. Nothing else is retried here.
//
// STRICTLY OUTSIDE THE TRANSACTION (Phase 5B caller responsibility):
//   notifications, Socket.IO emits, Prisma writes, populate() and HTTP
//   response construction — only AFTER withDoctorBookingTransaction()
//   resolves, i.e. after a successful commit.
// ============================================================
import mongoose from 'mongoose';
import DoctorBookingGuard from '../models/DoctorBookingGuard.js';
import { findOverlappingAppointments } from '../controllers/doctorAppointmentController.js';

// ------------------------------------------------------------
// Errors — repository convention: Error instances carrying `statusCode`
// (same shape as the salary-settlement conflict errors).
// ------------------------------------------------------------
export class BookingConflictError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'BookingConflictError';
    this.statusCode = 409;
    this.code = 'BOOKING_CONFLICT';
  }
}

export class BookingGuardUnavailableError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'BookingGuardUnavailableError';
    this.statusCode = 503;
    this.code = 'BOOKING_GUARD_UNAVAILABLE';
  }
}

// ------------------------------------------------------------
// Internal helpers
// ------------------------------------------------------------
const hasErrorLabel = (error, label) => {
  if (!error) return false;
  if (typeof error.hasErrorLabel === 'function') {
    return error.hasErrorLabel(label);
  }
  return Array.isArray(error.errorLabels) && error.errorLabels.includes(label);
};

// Classify — never retry — an error surfaced by session.withTransaction().
// The original error object is preserved whenever a `statusCode` is attached
// to it, so driver labels and the cause chain survive intact.
const classifyTransactionError = (error) => {
  if (!error) return error;

  // Commit-phase ambiguity: the driver already exhausted its own commit
  // retries. Tag only — keep labels/cause — and NEVER replay the callback.
  if (hasErrorLabel(error, 'UnknownTransactionCommitResult')) {
    if (typeof error.statusCode !== 'number') error.statusCode = 503;
    error.commitOutcome = 'UNKNOWN';
    return error;
  }

  // Duplicate key raised inside the transaction (e.g. a unique index hit
  // during the insert) is a plain conflict — surfaced as 409, never retried.
  if (error.code === 11000) {
    return new BookingConflictError('A conflicting booking record already exists', {
      cause: error
    });
  }

  // Errors that already carry a statusCode (BookingConflictError,
  // BookingGuardUnavailableError, callback-level 409s/400s) pass through.
  if (typeof error.statusCode === 'number') return error;

  // The driver exhausted its TransientTransactionError retries: the
  // transaction was never committed, so a later client retry is safe.
  // Keep the original error (labels preserved) and map it to 503.
  if (hasErrorLabel(error, 'TransientTransactionError')) {
    if (typeof error.statusCode !== 'number') error.statusCode = 503;
    return error;
  }

  // Validation, authorization, cast, network and any other error surface
  // unchanged — this module never retries them.
  return error;
};

// ------------------------------------------------------------
// preSeedGuard — OUTSIDE the transaction.
// Guarantees the guard document exists before the transactional `$inc`.
// ------------------------------------------------------------
export const preSeedGuard = async (doctorId) => {
  try {
    await DoctorBookingGuard.updateOne(
      { _id: doctorId },
      { $setOnInsert: { seq: 0 } },
      { upsert: true }
    );
  } catch (error) {
    // E11000 means a concurrent seeder inserted the same _id first: the
    // guard exists, so this race is success. NOTHING else is swallowed —
    // any other seeding failure fails closed with 503 (cause preserved).
    if (error?.code !== 11000) {
      throw new BookingGuardUnavailableError('Booking guard could not be prepared', {
        cause: error
      });
    }
  }
};

// ------------------------------------------------------------
// withDoctorBookingTransaction — the guarded critical section.
//
//   opts.doctorId  doctor's User id (ObjectId)
//   opts.startsAt  requested window start (Date)
//   opts.endsAt    requested window end (Date)
//   run(session)   caller's insert step; MUST pass `session` to every
//                  query/write and MUST NOT perform side effects
//
// Returns run()'s value after a successful commit. Throws:
//   BookingConflictError            overlapping live appointment (409)
//   BookingGuardUnavailableError    guard missing / seed failed (503)
//   original error, possibly tagged 503 (driver-labeled exhaustion)
// ------------------------------------------------------------
export const withDoctorBookingTransaction = async ({ doctorId, startsAt, endsAt }, run) => {
  // (1) Guard guaranteed to exist BEFORE the transaction starts.
  await preSeedGuard(doctorId);

  const session = await mongoose.startSession();
  try {
    // (2) Driver-managed, label-driven retries live inside withTransaction().
    // The callback below must not swallow errors (driver requirement) —
    // everything thrown here propagates to the driver/classifier.
    return await session.withTransaction(async () => {
      // (3) FIRST transaction operation: a real $inc against the existing
      // guard document. No upsert — fail closed if the guard is absent.
      const guard = await DoctorBookingGuard.findOneAndUpdate(
        { _id: doctorId },
        { $inc: { seq: 1 } },
        { session }
      );
      if (!guard) {
        // findOneAndUpdate: null <=> no document matched <=> guard missing.
        throw new BookingGuardUnavailableError('Booking guard document is unavailable');
      }

      // (4) Overlap re-check INSIDE the transaction, same session, taken
      // AFTER the guard write so a losing booking cannot miss the winner's
      // committed appointment.
      const overlaps = await findOverlappingAppointments(doctorId, startsAt, endsAt, session);
      if (Array.isArray(overlaps) && overlaps.length > 0) {
        throw new BookingConflictError(
          'This appointment overlaps with an existing appointment for this doctor'
        );
      }

      // (5) Caller's insert step — the only place appointments (and guest
      // ClinicPatients) are created, always with this session.
      return await run(session);
    });
  } catch (error) {
    throw classifyTransactionError(error);
  } finally {
    // (6) Session cleanup on success, conflict, and failure alike.
    await session.endSession();
  }
};
