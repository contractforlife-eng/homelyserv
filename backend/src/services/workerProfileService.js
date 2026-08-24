// Canonical WorkerProfile creation for newly-created Worker accounts.
//
// WorkerProfile ownership is always derived from the validated User record.
// This helper is intentionally idempotent and never updates an existing
// profile.
import prisma from '../lib/prisma.js';

const DEFAULT_PROFILE = {
  category: '',
  experienceYears: 0,
  expectedSalary: 0,
  availability: 'available',
  activelyLooking: false,
  workType: 'full-time',
  bioAr: '',
  bioEn: '',
  skills: [],
  profilePhotoUrl: '',
  docStatus: 'pending',
  ratingAvg: 0,
  ratingCount: 0,
  isVisible: true
};

const getUserId = (user) => String(user?.id || user?._id || '');

/**
 * Ensure one canonical WorkerProfile exists for a validated Worker User.
 * Existing profiles are returned unchanged. The optional visibility override
 * is for tightly-scoped internal role-transition callers only.
 */
export const ensureWorkerProfile = async (user, { db = prisma, isVisible = true } = {}) => {
  if (user?.role !== 'WORKER') {
    throw new Error('WorkerProfile creation requires a WORKER user');
  }

  const userId = getUserId(user);
  if (!userId) {
    throw new Error('WorkerProfile creation requires a user id');
  }

  const existingProfile = await db.workerProfile.findUnique({
    where: { userId }
  });
  if (existingProfile) return existingProfile;

  const data = {
    ...DEFAULT_PROFILE,
    userId,
    category: typeof user.desiredJob === 'string' ? user.desiredJob : '',
    profilePhotoUrl: user.profileImage || '',
    isVisible
  };

  try {
    return await db.workerProfile.create({ data });
  } catch (error) {
    // A concurrent caller may win the unique userId race. Return that
    // canonical record rather than creating or updating a duplicate.
    if (error?.code === 'P2002') {
      const concurrentProfile = await db.workerProfile.findUnique({
        where: { userId }
      });
      if (concurrentProfile) return concurrentProfile;
    }
    throw error;
  }
};

export default ensureWorkerProfile;
