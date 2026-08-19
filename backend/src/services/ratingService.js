// backend/src/services/ratingService.js
// ============================================================
// RATING SERVICE — secure two-way (Employer→Worker, Worker→Employer)
// rating core. All identity and direction are derived server-side;
// the client never controls reviewer/reviewee/direction.
//
// Review records are the authoritative source of truth. The cached
// ratingAvg/ratingCount on WorkerProfile (EMPLOYER_TO_WORKER) and
// EmployerProfile (WORKER_TO_EMPLOYER) are recomputed on every write
// from the authoritative Review collection.
//
// Identity rule (critical):
//   - revieweeUserId / reviewerUserId are canonical User.id values.
//   - WorkerProfile.id is NEVER stored as the reviewee identity. It is
//     only resolved server-side to derive the Worker's canonical User.id
//     and to update the WorkerProfile aggregate.
// ============================================================
import prisma from '../lib/prisma.js';
import { WORKER_EARNING_STATUS } from './workerEarningService.js';

export const REVIEW_DIRECTION = {
  EMPLOYER_TO_WORKER: 'EMPLOYER_TO_WORKER',
  WORKER_TO_EMPLOYER: 'WORKER_TO_EMPLOYER',
};

export class RatingError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'RatingError';
    this.status = status;
    this.code = code;
  }
}

const CUSTOMER_ROLES = new Set(['EMPLOYER', 'WORKER']);
const isObjectId = (value) => typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);

// Parse and validate the numeric integer rating in [1,5].
// Never clamps, never coerces a decimal/invalid value into an integer.
export function parseRating(raw) {
  if (raw === null || raw === undefined) {
    throw new RatingError(400, 'RATING_REQUIRED', 'A rating value is required');
  }
  if (typeof raw === 'string') {
    throw new RatingError(400, 'RATING_INVALID_TYPE', 'Rating must be a number');
  }
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    throw new RatingError(400, 'RATING_INVALID', 'Rating must be a valid number');
  }
  if (!Number.isInteger(raw)) {
    throw new RatingError(400, 'RATING_NOT_INTEGER', 'Rating must be a whole number between 1 and 5');
  }
  if (raw < 1 || raw > 5) {
    throw new RatingError(400, 'RATING_OUT_OF_RANGE', 'Rating must be between 1 and 5');
  }
  return raw;
}

// Pure eligibility check. Returns a machine reason or null when eligible.
// Reads hire/offer/worker-earning state only; never mutates.
export function getIneligibilityReason(hire, offer, hasEarnedPeriod) {
  if (!hire) return 'HIRE_NOT_FOUND';
  if (hire.status !== 'active') return 'HIRE_NOT_ACTIVE';
  if (hire.paymentStatus !== 'completed') return 'PAYMENT_NOT_CONFIRMED';
  if (!hire.offerId) return 'OFFER_LINK_MISSING';
  if (!offer) return 'OFFER_NOT_FOUND';
  if (!hasEarnedPeriod) return 'WORK_PERIOD_NOT_CONFIRMED';
  return null;
}

// Resolve server-authoritative direction + identities for the requester.
// Never trusts any identity fields from the request body.
async function resolveRatingContext({ hire, role, userId, db }) {
  let direction;
  let reviewerUserId;
  let revieweeUserId;
  let revieweeProfileId; // WorkerProfile.id (only for EMPLOYER_TO_WORKER aggregation)

  if (role === 'EMPLOYER') {
    if (String(hire.employerId) !== String(userId)) {
      throw new RatingError(403, 'NOT_HIRE_OWNER', 'You are not the employer for this hire');
    }
    // Worker identity is derived from the Hire's workerId → WorkerProfile → User.id.
    const workerProfile = await db.workerProfile.findUnique({
      where: { id: String(hire.workerId) },
    });
    if (!workerProfile) {
      throw new RatingError(404, 'WORKER_PROFILE_NOT_FOUND', 'Worker profile not found for this hire');
    }
    direction = REVIEW_DIRECTION.EMPLOYER_TO_WORKER;
    reviewerUserId = String(userId);
    revieweeUserId = String(workerProfile.userId); // canonical Worker User.id
    revieweeProfileId = String(workerProfile.id);
  } else {
    // WORKER: resolve the authenticated user's own WorkerProfile.
    const workerProfile = await db.workerProfile.findUnique({
      where: { userId: String(userId) },
    });
    if (!workerProfile) {
      throw new RatingError(403, 'WORKER_PROFILE_MISSING', 'Worker profile not found');
    }
    if (String(workerProfile.id) !== String(hire.workerId)) {
      throw new RatingError(403, 'NOT_HIRE_WORKER', 'You are not the worker for this hire');
    }
    direction = REVIEW_DIRECTION.WORKER_TO_EMPLOYER;
    reviewerUserId = String(userId);
    revieweeUserId = String(hire.employerId);
  }

  // Self-rating protection (also guards corrupted/legacy Hire data).
  if (String(reviewerUserId) === String(revieweeUserId)) {
    throw new RatingError(403, 'SELF_RATING', 'You cannot rate yourself');
  }

  return { direction, reviewerUserId, revieweeUserId, revieweeProfileId };
}

// Recompute cached aggregate for a reviewee from authoritative reviews.
async function recomputeAggregate(tx, { revieweeUserId, direction, profileModel, profileWhere }) {
  const ratingCount = await tx.review.count({
    where: { revieweeUserId, direction },
  });
  const avgResult = await tx.review.aggregate({
    where: { revieweeUserId, direction },
    _avg: { rating: true },
  });
  const ratingAvg = ratingCount > 0 ? Math.round((avgResult._avg.rating || 0) * 100) / 100 : 0;
  await tx[profileModel].update({
    where: profileWhere,
    data: { ratingAvg, ratingCount },
  });
}

// Submit a rating for a Hire. `db` defaults to Prisma and may be injected
// (tests pass a mock). Throws RatingError on any failure; never returns a
// partial success.
export async function submitRating({ hireId, rating, userId, role }, db = prisma) {
  const parsedRating = parseRating(rating);

  const normalizedRole = String(role || '').toUpperCase();
  if (!CUSTOMER_ROLES.has(normalizedRole)) {
    throw new RatingError(403, 'ROLE_NOT_ALLOWED', 'Only employers and workers may submit ratings');
  }

  if (!isObjectId(hireId)) {
    throw new RatingError(404, 'HIRE_NOT_FOUND', 'Hire not found');
  }

  const hire = await db.hire.findUnique({ where: { id: String(hireId) } });
  if (!hire) {
    throw new RatingError(404, 'HIRE_NOT_FOUND', 'Hire not found');
  }

  const offer = hire.offerId
    ? await db.offer.findUnique({ where: { id: String(hire.offerId) } })
    : null;

  const hasEarnedPeriod = hire.offerId
    ? !!(await db.workerEarning.findFirst({
        where: {
          hireId: String(hire.id),
          status: WORKER_EARNING_STATUS.EARNED,
        },
      }))
    : false;

  const ineligibleReason = getIneligibilityReason(hire, offer, hasEarnedPeriod);
  if (ineligibleReason) {
    const status = ineligibleReason === 'HIRE_NOT_FOUND' ? 404 : 403;
    throw new RatingError(status, ineligibleReason, 'This hire is not eligible for rating');
  }

  const ctx = await resolveRatingContext({ hire, role: normalizedRole, userId, db });

  // Friendly pre-check (the DB unique constraint is authoritative against races).
  const existing = await db.review.findFirst({
    where: {
      hireId: String(hireId),
      reviewerUserId: ctx.reviewerUserId,
      direction: ctx.direction,
    },
  });
  if (existing) {
    throw new RatingError(409, 'REVIEW_EXISTS', 'You have already rated this hire');
  }

  try {
    return await db.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          hireId: String(hireId),
          reviewerUserId: ctx.reviewerUserId,
          revieweeUserId: ctx.revieweeUserId,
          direction: ctx.direction,
          rating: parsedRating,
        },
      });

      if (ctx.direction === REVIEW_DIRECTION.EMPLOYER_TO_WORKER) {
        await recomputeAggregate(tx, {
          revieweeUserId: ctx.revieweeUserId,
          direction: ctx.direction,
          profileModel: 'workerProfile',
          profileWhere: { id: ctx.revieweeProfileId },
        });
      } else {
        const employerProfile = await tx.employerProfile.upsert({
  where: { userId: ctx.revieweeUserId },
  update: {},
  create: {
    userId: ctx.revieweeUserId,
    companyName: '',
    companyLogo: '',
    companyPhotos: [],
    companyWebsite: '',
    companySize: '',
    industry: '',
    description: '',
    address: '',
  },
});
        await recomputeAggregate(tx, {
          revieweeUserId: ctx.revieweeUserId,
          direction: ctx.direction,
          profileModel: 'employerProfile',
          profileWhere: { id: employerProfile.id },
        });
      }

      return { review, direction: ctx.direction };
    });
  } catch (error) {
    if (error instanceof RatingError) throw error;
    // Prisma unique constraint violation (@@unique). Convert to safe 409.
    if (error && error.code === 'P2002') {
      throw new RatingError(409, 'REVIEW_EXISTS', 'You have already rated this hire');
    }
    throw error;
  }
}

// Read-only rating status for the authenticated requester on a Hire.
// Derives direction server-side, verifies requester belongs to the Hire,
// and reports whether they can currently rate and whether they already did.
export async function getRatingStatus({ hireId, userId, role }, db = prisma) {
  const normalizedRole = String(role || '').toUpperCase();
  if (!CUSTOMER_ROLES.has(normalizedRole)) {
    throw new RatingError(403, 'ROLE_NOT_ALLOWED', 'Only employers and workers may view rating status');
  }
  if (!isObjectId(hireId)) {
    throw new RatingError(404, 'HIRE_NOT_FOUND', 'Hire not found');
  }

  const hire = await db.hire.findUnique({ where: { id: String(hireId) } });
  if (!hire) {
    throw new RatingError(404, 'HIRE_NOT_FOUND', 'Hire not found');
  }

  // Verify the requester belongs to this Hire.
  let direction;
  let reviewerUserId;
  try {
    const ctx = await resolveRatingContext({ hire, role: normalizedRole, userId, db });
    direction = ctx.direction;
    reviewerUserId = ctx.reviewerUserId;
  } catch (error) {
    if (error instanceof RatingError) {
      throw new RatingError(403, error.code, 'You do not belong to this hire');
    }
    throw error;
  }

  const offer = hire.offerId
    ? await db.offer.findUnique({ where: { id: String(hire.offerId) } })
    : null;

  const hasEarnedPeriod = hire.offerId
    ? !!(await db.workerEarning.findFirst({
        where: {
          hireId: String(hire.id),
          status: WORKER_EARNING_STATUS.EARNED,
        },
      }))
    : false;

  const ineligibleReason = getIneligibilityReason(hire, offer, hasEarnedPeriod);

  const existing = await db.review.findFirst({
    where: { hireId: String(hireId), reviewerUserId, direction },
  });

  const canRate = !ineligibleReason && !existing;
  return {
    success: true,
    canRate,
    hasRated: Boolean(existing),
    direction,
    reason: ineligibleReason || null,
  };
}
