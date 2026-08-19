// backend/src/services/ratingService.test.js
// ============================================================
// Focused backend tests for the two-way rating core. Follows the
// node:test + injected mock-db pattern used across the repo
// (see paymentAuthService.test.js). No real database is touched.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  submitRating,
  getRatingStatus,
  parseRating,
  getIneligibilityReason,
  RatingError,
  REVIEW_DIRECTION,
} from './ratingService.js';

const ids = {
  employer: '111111111111111111111111',
  worker: '222222222222222222222222',
  workerProfile: '333333333333333333333333',
  admin: '444444444444444444444444',
  support: '555555555555555555555555',
  hire: '666666666666666666666666',
  offer: '777777777777777777777777',
  employerProfile: '888888888888888888888888',
  otherWorkerProfile: '999999999999999999999999',
  otherWorker: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  otherEmployer: 'bbbbbbbbbbbbbbbbbbbbbbbb',
};

let reviewCounter = 0;
const tick = () => new Promise((resolve) => setImmediate(resolve));

// In-memory mock db that enforces the @@unique([hireId, reviewerUserId,
// direction]) constraint at create time (simulating MongoDB/P2002) and
// rolls back side effects if an interactive transaction throws.
function makeDb(opts = {}) {
  const {
    hireStatus = 'active',
    paymentStatus = 'completed',
    offerId = ids.offer,
    offerStatus = 'completed',
    hireWorkerProfileId = ids.workerProfile,
    hireWorkerUserId = ids.worker,
    employerId = ids.employer,
    missingOffer = false,
    employerProfilePresent = true,
    preExisting = [], // [{ hireId, reviewerUserId, direction }]
    requesterWorkerProfileId = null,
    requesterWorkerUserId = ids.worker,
    extraHires = [], // [{ id, workerProfileId, employerId, offerId, offerStatus, hireStatus, paymentStatus, missingOffer }]
    forceCreateConflict = false,
    workerEarnings = [], // [{ hireId, status }]
  } = opts;

  const workerProfiles = {
    [hireWorkerProfileId]: { id: hireWorkerProfileId, userId: hireWorkerUserId, ratingAvg: 0, ratingCount: 0 },
  };
  if (requesterWorkerProfileId && requesterWorkerProfileId !== hireWorkerProfileId) {
    workerProfiles[requesterWorkerProfileId] = {
      id: requesterWorkerProfileId,
      userId: requesterWorkerUserId,
      ratingAvg: 0,
      ratingCount: 0,
    };
  }
  extraHires.forEach((eh) => {
    if (!workerProfiles[eh.workerProfileId]) {
      workerProfiles[eh.workerProfileId] = {
        id: eh.workerProfileId,
        userId: eh.workerUserId || ids.otherWorker,
        ratingAvg: 0,
        ratingCount: 0,
      };
    }
  });

  const employerProfiles = employerProfilePresent
    ? { [ids.employerProfile]: { id: ids.employerProfile, userId: employerId, ratingAvg: 0, ratingCount: 0 } }
    : {};

  const primaryHire = {
    id: ids.hire,
    workerId: hireWorkerProfileId,
    employerId,
    offerId: missingOffer ? null : offerId,
    status: hireStatus,
    paymentStatus,
  };
  const offerMap = {};
  if (!missingOffer) offerMap[offerId] = { id: offerId, status: offerStatus };
  const hireMap = { [ids.hire]: primaryHire };
  extraHires.forEach((eh) => {
    const m = eh.missingOffer ?? false;
    hireMap[eh.id] = {
      id: eh.id,
      workerId: eh.workerProfileId,
      employerId: eh.employerId,
      offerId: m ? null : eh.offerId,
      status: eh.hireStatus ?? 'active',
      paymentStatus: eh.paymentStatus ?? 'completed',
    };
    if (!m) offerMap[eh.offerId] = { id: eh.offerId, status: eh.offerStatus ?? 'completed' };
  });

  const reviews = preExisting.map((r) => ({ id: `seed-${reviewCounter++}`, ...r }));

  const workerEarningsList = opts.workerEarnings
    ? opts.workerEarnings
    : [
        { hireId: ids.hire, status: 'EARNED' },
        ...extraHires.map((eh) => ({ hireId: eh.id, status: 'EARNED' })),
      ];

  // Per-transaction uncommitted write buffer stack (simulates isolated
  // MongoDB transactions: a rolled-back transaction discards only its own
  // writes, and concurrent transactions don't clobber each other).
  const bufferStack = [];
  const currentBuffer = () => (bufferStack.length ? bufferStack[bufferStack.length - 1] : null);
  const visibleReviews = () => {
    const buf = currentBuffer();
    return buf ? buf.concat(reviews) : reviews;
  };

  const db = {
    hire: {
      findUnique: async ({ where }) => (hireMap[where.id] ? { ...hireMap[where.id] } : null),
    },
    offer: {
      findUnique: async ({ where }) => (offerMap[where.id] ? { ...offerMap[where.id] } : null),
    },
    workerProfile: {
      findUnique: async ({ where }) => {
        if (where.id && workerProfiles[where.id]) return { ...workerProfiles[where.id] };
        if (where.userId) {
          const found = Object.values(workerProfiles).find((p) => p.userId === where.userId);
          return found ? { ...found } : null;
        }
        return null;
      },
      update: async ({ where, data }) => {
        const p = workerProfiles[where.id];
        if (!p) return null;
        p.ratingAvg = data.ratingAvg;
        p.ratingCount = data.ratingCount;
        return { ...p };
      },
    },
    employerProfile: {
      findUnique: async ({ where }) => {
        const found = Object.values(employerProfiles).find((p) => p.userId === where.userId);
        return found ? { ...found } : null;
      },
      update: async ({ where, data }) => {
        const p = employerProfiles[where.id];
        if (!p) return null;
        p.ratingAvg = data.ratingAvg;
        p.ratingCount = data.ratingCount;
        return { ...p };
      },
      upsert: async ({ where, update, create }) => {
        const existing = Object.values(employerProfiles).find((p) => p.userId === where.userId);
        if (existing) {
          Object.assign(existing, update);
          return { ...existing };
        }
        const created = {
          id: `ep-${Date.now()}-${Math.random()}`,
          ...create,
          ratingAvg: 0,
          ratingCount: 0,
        };
        employerProfiles[created.id] = created;
        return { ...created };
      },
    },
    workerEarning: {
      findFirst: async ({ where }) => {
        await tick();
        return (
          workerEarningsList.find((we) => {
            if (where.hireId && we.hireId !== where.hireId) return false;
            if (where.status && we.status !== where.status) return false;
            return true;
          }) || null
        );
      },
    },
    review: {
      findFirst: async ({ where }) => {
        await tick();
        return visibleReviews().find((r) =>
          r.hireId === where.hireId &&
          r.reviewerUserId === where.reviewerUserId &&
          r.direction === where.direction
        ) || null;
      },
      create: async ({ data }) => {
        await tick();
        // Simulate the DB unique-constraint violation (P2002) firing even
        // when the friendly pre-check passed (the concurrent-race case).
        if (forceCreateConflict) {
          const err = new Error('Unique constraint failed');
          err.code = 'P2002';
          throw err;
        }
        const dup = visibleReviews().find((r) =>
          r.hireId === data.hireId &&
          r.reviewerUserId === data.reviewerUserId &&
          r.direction === data.direction
        );
        if (dup) {
          const err = new Error('Unique constraint failed');
          err.code = 'P2002';
          throw err;
        }
        const created = { id: `r-${reviewCounter++}`, ...data };
        (currentBuffer() || reviews).push(created);
        return { ...created };
      },
      count: async ({ where }) =>
        visibleReviews().filter(
          (r) => r.revieweeUserId === where.revieweeUserId && r.direction === where.direction
        ).length,
      aggregate: async ({ where, _avg }) => {
        const matches = visibleReviews().filter(
          (r) => r.revieweeUserId === where.revieweeUserId && r.direction === where.direction
        );
        const rating = _avg?.rating
          ? matches.reduce((s, r) => s + r.rating, 0) / (matches.length || 1)
          : null;
        return { _avg: { rating: matches.length ? rating : null } };
      },
    },
    $transaction: async (fn) => {
      const buffer = [];
      bufferStack.push(buffer);
      try {
        const result = await fn(db);
        buffer.forEach((r) => reviews.push(r)); // commit
        return result;
      } finally {
        bufferStack.pop();
      }
    },
  };

  db._state = { reviews, workerProfiles, employerProfiles };
  return db;
}

const okEmployer = () => ({ hireId: ids.hire, rating: 5, userId: ids.employer, role: 'EMPLOYER' });
const okWorker = () => ({ hireId: ids.hire, rating: 4, userId: ids.worker, role: 'WORKER' });

// ============================================================
// VALIDATION (#1-#8)
// ============================================================
test('parseRating accepts 1 and 5', () => {
  assert.equal(parseRating(1), 1);
  assert.equal(parseRating(5), 5);
});

test('parseRating rejects 0', () => {
  assert.throws(() => parseRating(0), (e) => e instanceof RatingError && e.status === 400);
});

test('parseRating rejects 6', () => {
  assert.throws(() => parseRating(6), (e) => e instanceof RatingError && e.status === 400);
});

test('parseRating rejects 4.5', () => {
  assert.throws(() => parseRating(4.5), (e) => e instanceof RatingError && e.status === 400);
});

test('parseRating rejects missing/undefined', () => {
  assert.throws(() => parseRating(undefined), (e) => e.status === 400);
});

test('parseRating rejects null', () => {
  assert.throws(() => parseRating(null), (e) => e.status === 400);
});

test('parseRating rejects strings', () => {
  assert.throws(() => parseRating('4'), (e) => e.status === 400);
  assert.throws(() => parseRating('4.5'), (e) => e.status === 400);
});

test('parseRating rejects NaN and objects/arrays', () => {
  assert.throws(() => parseRating(NaN), (e) => e.status === 400);
  assert.throws(() => parseRating({}), (e) => e.status === 400);
  assert.throws(() => parseRating([]), (e) => e.status === 400);
});

// ============================================================
// EMPLOYER → WORKER (#9-#16)
// ============================================================
test('valid Employer + qualifying Hire + completed Offer succeeds', async () => {
  const db = makeDb();
  const res = await submitRating(okEmployer(), db);
  assert.equal(res.direction, REVIEW_DIRECTION.EMPLOYER_TO_WORKER);
  assert.equal(db._state.reviews.length, 1);
});

test('Worker reviewee is derived from hire.workerId → WorkerProfile.userId', async () => {
  const db = makeDb();
  const res = await submitRating(okEmployer(), db);
  const created = db._state.reviews[0];
  assert.equal(created.revieweeUserId, ids.worker);
  assert.equal(res.review.revieweeUserId, ids.worker);
});

test('Employer own User.id is NOT used as the Worker reviewee', async () => {
  const db = makeDb();
  await submitRating(okEmployer(), db);
  const created = db._state.reviews[0];
  assert.notEqual(created.revieweeUserId, ids.employer);
});

test('unrelated Employer is rejected with 403', async () => {
  const db = makeDb({ employerId: ids.employer });
  await assert.rejects(
    submitRating({ hireId: ids.hire, rating: 5, userId: ids.otherEmployer, role: 'EMPLOYER' }, db),
    (e) => e instanceof RatingError && e.status === 403 && e.code === 'NOT_HIRE_OWNER'
  );
});

test('missing EARNED work period blocks rating', async () => {
  const db = makeDb({ workerEarnings: [] });
  await assert.rejects(submitRating(okEmployer(), db), (e) => e.status === 403);
});

test('paymentStatus completed is accepted with EARNED period', async () => {
  const db = makeDb({ paymentStatus: 'completed' });
  const res = await submitRating(okEmployer(), db);
  assert.equal(res.direction, REVIEW_DIRECTION.EMPLOYER_TO_WORKER);
});

test('wrong Hire EARNED period does not qualify this Hire', async () => {
  const db = makeDb({
    workerEarnings: [{ hireId: 'cccccccccccccccccccccccc', status: 'EARNED' }],
  });
  await assert.rejects(submitRating(okEmployer(), db), (e) => e.status === 403);
});

test('Employer→Worker submit succeeds with EARNED period', async () => {
  const db = makeDb({ workerEarnings: [{ hireId: ids.hire, status: 'EARNED' }] });
  const res = await submitRating(okEmployer(), db);
  assert.equal(res.direction, REVIEW_DIRECTION.EMPLOYER_TO_WORKER);
  assert.equal(db._state.reviews.length, 1);
});

test('Worker→Employer submit succeeds with EARNED period', async () => {
  const db = makeDb({ workerEarnings: [{ hireId: ids.hire, status: 'EARNED' }] });
  const res = await submitRating(okWorker(), db);
  assert.equal(res.direction, REVIEW_DIRECTION.WORKER_TO_EMPLOYER);
  assert.equal(db._state.reviews.length, 1);
});

test('unpaid Hire rejected', async () => {
  const db = makeDb({ paymentStatus: 'pending' });
  await assert.rejects(submitRating(okEmployer(), db), (e) => e.status === 403);
});

test('missing offerId rejected', async () => {
  const db = makeDb({ missingOffer: true });
  await assert.rejects(submitRating(okEmployer(), db), (e) => e.status === 403);
});

test('terminated Hire rejected', async () => {
  const db = makeDb({ hireStatus: 'terminated' });
  await assert.rejects(submitRating(okEmployer(), db), (e) => e.status === 403);
});

test('nonexistent Hire returns 404', async () => {
  const db = makeDb();
  await assert.rejects(
    submitRating({ hireId: 'deadbeefdeadbeefdeadbeef', rating: 5, userId: ids.employer, role: 'EMPLOYER' }, db),
    (e) => e.status === 404
  );
});

// ============================================================
// WORKER → EMPLOYER (#17-#22)
// ============================================================
test('authenticated Worker must own hire.workerId', async () => {
  const db = makeDb();
  const res = await submitRating(okWorker(), db);
  assert.equal(res.direction, REVIEW_DIRECTION.WORKER_TO_EMPLOYER);
});

test('Worker→Employer reviewee is derived from hire.employerId', async () => {
  const db = makeDb();
  await submitRating(okWorker(), db);
  const created = db._state.reviews[0];
  assert.equal(created.revieweeUserId, ids.employer);
});

test('unrelated Worker is rejected with 403', async () => {
  const db = makeDb({
    hireWorkerProfileId: ids.otherWorkerProfile,
    hireWorkerUserId: ids.otherWorker,
    requesterWorkerProfileId: ids.workerProfile,
    requesterWorkerUserId: ids.worker,
  });
  await assert.rejects(
    submitRating({ hireId: ids.hire, rating: 4, userId: ids.worker, role: 'WORKER' }, db),
    (e) => e instanceof RatingError && e.status === 403 && e.code === 'NOT_HIRE_WORKER'
  );
});

test('Worker can only ever produce WORKER_TO_EMPLOYER (forged direction ignored)', async () => {
  const db = makeDb();
  const res = await submitRating(okWorker(), db);
  assert.equal(res.review.direction, REVIEW_DIRECTION.WORKER_TO_EMPLOYER);
});

test('Employer can only ever produce EMPLOYER_TO_WORKER (forged direction ignored)', async () => {
  const db = makeDb();
  const res = await submitRating(okEmployer(), db);
  assert.equal(res.review.direction, REVIEW_DIRECTION.EMPLOYER_TO_WORKER);
});

test('forged revieweeUserId is ignored; server-derived identity used', async () => {
  const db = makeDb();
  await submitRating(okEmployer(), db);
  const created = db._state.reviews[0];
  // reviewee must be the worker's canonical User.id, never the employer's id
  // nor any forged value supplied by a client.
  assert.equal(created.reviewerUserId, ids.employer);
  assert.equal(created.revieweeUserId, ids.worker);
  assert.notEqual(created.revieweeUserId, ids.employer);
});

// ============================================================
// DUPLICATES / RACE (#23-#28)
// ============================================================
test('same Employer rating same Hire twice → second returns 409', async () => {
  const db = makeDb();
  await submitRating(okEmployer(), db);
  await assert.rejects(submitRating(okEmployer(), db), (e) => e.status === 409);
});

test('same Worker rating same Hire twice → second returns 409', async () => {
  const db = makeDb();
  await submitRating(okWorker(), db);
  await assert.rejects(submitRating(okWorker(), db), (e) => e.status === 409);
});

test('Employer→Worker and Worker→Employer on same Hire both succeed', async () => {
  const db = makeDb();
  await submitRating(okEmployer(), db);
  const res = await submitRating(okWorker(), db);
  assert.equal(res.direction, REVIEW_DIRECTION.WORKER_TO_EMPLOYER);
  assert.equal(db._state.reviews.length, 2);
});

test('same reviewer on a different Hire can rate again', async () => {
  const db = makeDb({
    extraHires: [{
      id: 'cccccccccccccccccccccccc',
      workerProfileId: ids.workerProfile,
      employerId: ids.employer,
      offerId: 'ccccccccccccccccccccccccoff',
      offerStatus: 'completed',
    }],
  });
  await submitRating(okEmployer(), db);
  const res = await submitRating(
    { hireId: 'cccccccccccccccccccccccc', rating: 3, userId: ids.employer, role: 'EMPLOYER' },
    db
  );
  assert.equal(res.review.hireId, 'cccccccccccccccccccccccc');
  assert.equal(db._state.reviews.length, 2);
});

test('concurrent duplicate same-direction requests cannot create two records', async () => {
  // The friendly pre-check (findFirst) can be raced by two concurrent
  // requests. The authoritative guard is the DB @@unique constraint, which
  // surfaces as a P2002. We force that path here: the pre-check passes (no
  // existing review), then create hits the unique violation. The service must
  // convert it to a safe 409 and roll back so no duplicate record is written.
  const db = makeDb({ forceCreateConflict: true });
  await assert.rejects(submitRating(okEmployer(), db), (e) => e.status === 409);
  assert.equal(db._state.reviews.length, 0);
});

test('duplicate failure does not increment ratingCount twice', async () => {
  const db = makeDb();
  await submitRating(okEmployer(), db);
  await assert.rejects(submitRating(okEmployer(), db), (e) => e.status === 409);
  assert.equal(db._state.workerProfiles[ids.workerProfile].ratingCount, 1);
});

// ============================================================
// AGGREGATES (#29-#34)
// ============================================================
test('first Worker rating → avg correct, count = 1', async () => {
  const db = makeDb();
  await submitRating(okEmployer(), db);
  const p = db._state.workerProfiles[ids.workerProfile];
  assert.equal(p.ratingAvg, 5);
  assert.equal(p.ratingCount, 1);
});

test('multiple Worker ratings → avg and count correct', async () => {
  const db = makeDb({
    extraHires: [{
      id: 'dddddddddddddddddddddddd',
      workerProfileId: ids.workerProfile,
      employerId: ids.otherEmployer,
      offerId: 'ddddddddddddddddddddddddoff',
      offerStatus: 'completed',
    }],
  });
  // Two employers rate the same worker on two hires.
  await submitRating(okEmployer(), db);
  await submitRating(
    { hireId: 'dddddddddddddddddddddddd', rating: 3, userId: ids.otherEmployer, role: 'EMPLOYER' },
    db
  );
  const p = db._state.workerProfiles[ids.workerProfile];
  assert.equal(p.ratingCount, 2);
  assert.equal(p.ratingAvg, 4); // (5+3)/2
});

test('first Employer rating → avg correct, count = 1', async () => {
  const db = makeDb();
  await submitRating(okWorker(), db);
  const p = db._state.employerProfiles[ids.employerProfile];
  assert.equal(p.ratingAvg, 4);
  assert.equal(p.ratingCount, 1);
});

test('multiple Employer ratings → avg and count correct', async () => {
  const db = makeDb({
    extraHires: [{
      id: 'eeeeeeeeeeeeeeeeeeeeeeee',
      workerProfileId: ids.otherWorkerProfile,
      employerId: ids.employer,
      offerId: 'eeeeeeeeeeeeeeeeeeeeeeeeoff',
      offerStatus: 'completed',
    }],
  });
  await submitRating(okWorker(), db);
  await submitRating(
    { hireId: 'eeeeeeeeeeeeeeeeeeeeeeee', rating: 2, userId: ids.otherWorker, role: 'WORKER' },
    db
  );
  const p = db._state.employerProfiles[ids.employerProfile];
  assert.equal(p.ratingCount, 2);
  assert.equal(p.ratingAvg, 3); // (4+2)/2
});

test('missing EmployerProfile is created safely and Worker→Employer rating succeeds', async () => {
  const db = makeDb({ employerProfilePresent: false });
  const res = await submitRating(okWorker(), db);
  assert.equal(res.direction, REVIEW_DIRECTION.WORKER_TO_EMPLOYER);
  assert.equal(db._state.reviews.length, 1);
  const profiles = Object.values(db._state.employerProfiles);
  assert.equal(profiles.length, 1);
  assert.equal(profiles[0].ratingCount, 1);
  assert.equal(profiles[0].ratingAvg, 4);
});

test('duplicate Review does not corrupt aggregate', async () => {
  const db = makeDb();
  await submitRating(okEmployer(), db);
  await assert.rejects(submitRating(okEmployer(), db), (e) => e.status === 409);
  const p = db._state.workerProfiles[ids.workerProfile];
  assert.equal(p.ratingCount, 1);
  assert.equal(p.ratingAvg, 5);
});

// ============================================================
// SECURITY (#35-#41)
// ============================================================
test('ADMIN cannot rate', async () => {
  const db = makeDb();
  await assert.rejects(
    submitRating({ hireId: ids.hire, rating: 5, userId: ids.admin, role: 'ADMIN' }, db),
    (e) => e.status === 403
  );
});

test('SUPPORT cannot rate', async () => {
  const db = makeDb();
  await assert.rejects(
    submitRating({ hireId: ids.hire, rating: 5, userId: ids.support, role: 'SUPPORT' }, db),
    (e) => e.status === 403
  );
});

test('unauthenticated (no/unknown role) cannot rate', async () => {
  const db = makeDb();
  await assert.rejects(
    submitRating({ hireId: ids.hire, rating: 5, userId: ids.employer, role: undefined }, db),
    (e) => e.status === 403
  );
});

test('self-rating is rejected', async () => {
  // Corrupted Hire data: WorkerProfile.userId equals the Employer User.id.
  const db = makeDb({ hireWorkerUserId: ids.employer });
  await assert.rejects(submitRating(okEmployer(), db), (e) => e.code === 'SELF_RATING');
});

// ============================================================
// RATING STATUS READ (#25 support)
// ============================================================
test('rating-status reports canRate true and hasRated false for eligible hire', async () => {
  const db = makeDb();
  const status = await getRatingStatus({ hireId: ids.hire, userId: ids.employer, role: 'EMPLOYER' }, db);
  assert.equal(status.canRate, true);
  assert.equal(status.hasRated, false);
  assert.equal(status.direction, REVIEW_DIRECTION.EMPLOYER_TO_WORKER);
});

test('rating-status reports hasRated true after a rating exists', async () => {
  const db = makeDb();
  await submitRating(okEmployer(), db);
  const status = await getRatingStatus({ hireId: ids.hire, userId: ids.employer, role: 'EMPLOYER' }, db);
  assert.equal(status.hasRated, true);
  assert.equal(status.canRate, false);
});

test('rating-status denies requesters who do not belong to the Hire', async () => {
  const db = makeDb();
  await assert.rejects(
    getRatingStatus({ hireId: ids.hire, userId: ids.otherEmployer, role: 'EMPLOYER' }, db),
    (e) => e.status === 403
  );
});

test('rating-status reports canRate false when work period is not EARNED', async () => {
  const db = makeDb({ workerEarnings: [] });
  const status = await getRatingStatus({ hireId: ids.hire, userId: ids.employer, role: 'EMPLOYER' }, db);
  assert.equal(status.canRate, false);
  assert.equal(status.reason, 'WORK_PERIOD_NOT_CONFIRMED');
});

test('rating-status reports canRate true for eligible hire with EARNED period', async () => {
  const db = makeDb({ workerEarnings: [{ hireId: ids.hire, status: 'EARNED' }] });
  const status = await getRatingStatus({ hireId: ids.hire, userId: ids.employer, role: 'EMPLOYER' }, db);
  assert.equal(status.canRate, true);
  assert.equal(status.reason, null);
});

test('rating-status reports canRate false for missing offer', async () => {
  const db = makeDb({ missingOffer: true });
  const status = await getRatingStatus({ hireId: ids.hire, userId: ids.employer, role: 'EMPLOYER' }, db);
  assert.equal(status.canRate, false);
  assert.equal(status.reason, 'OFFER_LINK_MISSING');
});

// ============================================================
// getIneligibilityReason unit checks
// ============================================================
test('getIneligibilityReason flags ineligible states', () => {
  assert.equal(getIneligibilityReason(
    { status: 'active', paymentStatus: 'completed', offerId: ids.offer },
    { status: 'completed' },
    true
  ), null);
  assert.equal(getIneligibilityReason(
    { status: 'offer_sent', paymentStatus: 'completed', offerId: ids.offer },
    { status: 'completed' },
    true
  ), 'HIRE_NOT_ACTIVE');
  assert.equal(getIneligibilityReason(
    { status: 'active', paymentStatus: 'pending', offerId: ids.offer },
    { status: 'completed' },
    true
  ), 'PAYMENT_NOT_CONFIRMED');
  assert.equal(getIneligibilityReason(
    { status: 'active', paymentStatus: 'completed', offerId: null },
    null,
    false
  ), 'OFFER_LINK_MISSING');
  assert.equal(getIneligibilityReason(
    { status: 'active', paymentStatus: 'completed', offerId: ids.offer },
    null,
    true
  ), 'OFFER_NOT_FOUND');
  assert.equal(getIneligibilityReason(
    { status: 'active', paymentStatus: 'completed', offerId: ids.offer },
    { status: 'accepted' },
    false
  ), 'WORK_PERIOD_NOT_CONFIRMED');
});
