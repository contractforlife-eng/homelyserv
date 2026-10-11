// backend/src/routes/doctorBookingGuard.test.js
// ============================================================
// PHASE 5A — transaction-based doctor booking guard (unit tests)
//
// Lives under src/routes/ because `npm test` discovers
// `node --test src/routes/*.test.js` (see backend/package.json).
//
// HONESTY NOTE — what these tests do NOT prove: they are stub-based unit
// tests with a fake session and no database. They verify ordering, session
// propagation, fail-closed checks, error classification and cleanup. They
// do NOT establish real MongoDB transaction concurrency, snapshot
// isolation, or write-conflict behaviour (that needs a later integration
// matrix against a replica set).
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorBookingGuard from '../models/DoctorBookingGuard.js';
import { findOverlappingAppointments } from '../controllers/doctorAppointmentController.js';
import {
  withDoctorBookingTransaction,
  preSeedGuard,
  BookingConflictError,
  BookingGuardUnavailableError
} from '../services/doctorBookingGuard.js';

const DOCTOR_ID = '507f1f77bcf86cd799439111';
const STARTS_AT = new Date('2030-01-06T09:00:00.000Z');
const ENDS_AT = new Date('2030-01-06T09:30:00.000Z');

// Saved originals — restored in finally so later suites are unaffected.
const origGuardUpdateOne = DoctorBookingGuard.updateOne;
const origGuardFindOneAndUpdate = DoctorBookingGuard.findOneAndUpdate;
const origApptFind = DoctorAppointment.find;
const origStartSession = mongoose.startSession;

const state = {};
const resetState = () => {
  state.order = [];
  state.seedError = null;
  state.guardNull = false;
  state.guardCall = null;
  state.overlaps = [];
  state.overlapSessionRecorder = { value: undefined };
  state.runCalls = 0;
};

let session;
const resetSession = () => {
  session = {
    txnCalls: 0,
    endCalls: 0,
    async withTransaction(fn) {
      this.txnCalls += 1;
      return await fn();
    },
    async endSession() {
      this.endCalls += 1;
    }
  };
};

const makeOverlapQuery = (recorder, results) => ({
  session(s) {
    recorder.value = s;
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(results).then(resolve, reject);
  }
});

const makeLabeledError = (label, message = 'driver failure') => {
  const err = new Error(message);
  err.hasErrorLabel = (candidate) => candidate === label;
  return err;
};

test('Doctor booking guard — Phase 5A foundation', async (t) => {
  try {
    // ---- Installed stubs (models + session; no database anywhere) ----
    DoctorBookingGuard.updateOne = async () => {
      state.order.push('seed');
      if (state.seedError) {
        const error = state.seedError;
        state.seedError = null;
        throw error;
      }
      return { acknowledged: true, matchedCount: 1, upsertedCount: 0 };
    };
    DoctorBookingGuard.findOneAndUpdate = async (filter, update, options) => {
      state.order.push('guard');
      state.guardCall = { filter, update, options };
      if (state.guardNull) return null;
      return { _id: filter._id, seq: (update?.$inc?.seq || 0) };
    };
    DoctorAppointment.find = () => {
      state.order.push('overlap');
      return makeOverlapQuery(state.overlapSessionRecorder, state.overlaps);
    };
    mongoose.startSession = async () => {
      state.order.push('startSession');
      return session;
    };

    const runFlow = (extra) =>
      withDoctorBookingTransaction(
        { doctorId: DOCTOR_ID, startsAt: STARTS_AT, endsAt: ENDS_AT },
        async (s) => {
          state.order.push('run');
          state.runCalls += 1;
          assert.equal(s, session, 'run() must receive the transaction session');
          if (extra?.throwError) throw extra.throwError;
          return extra?.returnValue ?? 'ran';
        }
      );

    await t.test('1. seed -> guard -> overlap ordering, same session, no in-txn upsert', async () => {
      resetState();
      resetSession();
      const returnValue = await runFlow({ returnValue: 'created' });

      assert.equal(returnValue, 'created', "run()'s value is returned after commit");
      assert.deepEqual(
        state.order,
        ['seed', 'startSession', 'guard', 'overlap', 'run'],
        'seed is outside the txn; guard write precedes overlap read and run()'
      );
      assert.ok(
        state.guardCall.update.$inc && typeof state.guardCall.update.$inc.seq === 'number',
        'guard update must be a real $inc write'
      );
      assert.equal(state.guardCall.options.upsert, undefined, 'no upsert inside the transaction');
      assert.equal(state.guardCall.options.session, session, 'guard write gets the session');
      assert.equal(state.overlapSessionRecorder.value, session, 'overlap gets the same session');
      assert.equal(session.txnCalls, 1);
      assert.equal(session.endCalls, 1, 'session ended on success');
    });

    await t.test('2. missing guard fails closed: 503, no overlap, no run, no appointment', async () => {
      resetState();
      resetSession();
      state.guardNull = true;

      const error = await runFlow().then(() => null, (e) => e);
      assert.ok(error instanceof BookingGuardUnavailableError);
      assert.equal(error.statusCode, 503);
      assert.equal(error.code, 'BOOKING_GUARD_UNAVAILABLE');
      assert.equal(state.runCalls, 0, 'run() never executes — no appointment created');
      assert.ok(!state.order.includes('overlap'), 'overlap read never runs without a guard');
      assert.equal(session.endCalls, 1, 'session ended on failure');
    });

    await t.test('3. duplicate-key seeding is treated as concurrent-seed success', async () => {
      resetState();
      resetSession();
      const dup = new Error('E11000 duplicate key error');
      dup.code = 11000;
      state.seedError = dup;

      await assert.doesNotReject(() => preSeedGuard(DOCTOR_ID), 'E11000 seed resolves');

      state.seedError = dup;
      const result = await runFlow({ returnValue: 'ok' });
      assert.equal(result, 'ok', 'flow proceeds after a lost seed race');
      assert.equal(state.runCalls, 1);
    });

    await t.test('4. non-duplicate seeding failure fails closed, session never starts', async () => {
      resetState();
      resetSession();
      const boom = new Error('network unreachable');
      state.seedError = boom;

      const error = await runFlow().then(() => null, (e) => e);
      assert.ok(error instanceof BookingGuardUnavailableError);
      assert.equal(error.statusCode, 503);
      assert.equal(error.cause, boom, 'original cause preserved');
      assert.ok(!state.order.includes('startSession'), 'no transaction without a guard seed');
      assert.equal(session.endCalls, 0, 'nothing to clean up');
    });

    await t.test('5. overlap conflict -> 409, callback invoked exactly once (no retry)', async () => {
      resetState();
      resetSession();
      state.overlaps = [{ _id: 'existing-appointment' }];

      const error = await runFlow().then(() => null, (e) => e);
      assert.ok(error instanceof BookingConflictError);
      assert.equal(error.statusCode, 409);
      assert.equal(error.code, 'BOOKING_CONFLICT');
      assert.equal(state.runCalls, 0, 'run() never executes on conflict');
      assert.equal(session.txnCalls, 1, 'the transaction callback is not blindly retried');
      assert.equal(session.endCalls, 1, 'session ended after conflict');
    });

    await t.test('6. duplicate-key (11000) from callback -> 409 with cause, once', async () => {
      resetState();
      resetSession();
      const dup = new Error('E11000 duplicate key error');
      dup.code = 11000;

      const error = await runFlow({ throwError: dup }).then(() => null, (e) => e);
      assert.ok(error instanceof BookingConflictError, 'mapped to a conflict, not a 500');
      assert.equal(error.statusCode, 409);
      assert.equal(error.cause, dup, 'original duplicate-key error preserved as cause');
      assert.equal(state.runCalls, 1, 'no manual replay of the booking callback');
      assert.equal(session.txnCalls, 1);
      assert.equal(session.endCalls, 1);
    });

    await t.test('7. UnknownTransactionCommitResult -> tagged 503/UNKNOWN, never replayed', async () => {
      resetState();
      resetSession();
      const ambiguous = makeLabeledError('UnknownTransactionCommitResult', 'commit reply lost');

      const error = await runFlow({ throwError: ambiguous }).then(() => null, (e) => e);
      assert.equal(error, ambiguous, 'original error object kept — labels and message intact');
      assert.equal(error.statusCode, 503, 'fail closed without claiming success or failure');
      assert.equal(error.commitOutcome, 'UNKNOWN', 'outcome explicitly indeterminate');
      assert.ok(error.hasErrorLabel('UnknownTransactionCommitResult'), 'label preserved');
      assert.equal(state.runCalls, 1, 'the booking callback is NEVER manually replayed');
      assert.equal(session.txnCalls, 1, 'no extra transaction was started');
      assert.equal(session.endCalls, 1);
    });

    await t.test('8. TransientTransactionError exhaustion -> tagged 503, no manual loop', async () => {
      resetState();
      resetSession();
      const transient = new Error('write conflict');
      transient.errorLabels = ['TransientTransactionError']; // array-form labels

      const error = await runFlow({ throwError: transient }).then(() => null, (e) => e);
      assert.equal(error, transient, 'original error kept with its labels');
      assert.equal(error.statusCode, 503, 'safe-to-retry signal — transaction never committed');
      assert.equal(state.runCalls, 1, 'no generic retry loop around the callback');
      assert.equal(session.txnCalls, 1);
      assert.equal(session.endCalls, 1);
    });

    await t.test('9. untagged errors pass through untouched, callback once', async () => {
      resetState();
      resetSession();
      const plain = new Error('invalid appointment data');

      const error = await runFlow({ throwError: plain }).then(() => null, (e) => e);
      assert.equal(error, plain, 'no wrapping, no statusCode invented');
      assert.equal(state.runCalls, 1, 'arbitrary errors are never retried');
      assert.equal(session.endCalls, 1);
    });

    await t.test('10. overlap helper: 3-arg callers unchanged, 4-arg joins the session', async () => {
      resetState();
      const recorder = { value: undefined };
      DoctorAppointment.find = () => makeOverlapQuery(recorder, []);

      const withoutSession = await findOverlappingAppointments(DOCTOR_ID, STARTS_AT, ENDS_AT);
      assert.deepEqual(withoutSession, [], 'legacy three-argument call still resolves');
      assert.equal(recorder.value, undefined, 'no session attached for legacy callers');

      const fakeSession = { marker: 'txn-session' };
      const withSession = await findOverlappingAppointments(
        DOCTOR_ID,
        STARTS_AT,
        ENDS_AT,
        fakeSession
      );
      assert.deepEqual(withSession, []);
      assert.equal(recorder.value, fakeSession, 'session passed to the query when supplied');
    });
  } finally {
    // Restore every stubbed original so subsequent suites are unaffected.
    DoctorBookingGuard.updateOne = origGuardUpdateOne;
    DoctorBookingGuard.findOneAndUpdate = origGuardFindOneAndUpdate;
    DoctorAppointment.find = origApptFind;
    mongoose.startSession = origStartSession;
  }
});
