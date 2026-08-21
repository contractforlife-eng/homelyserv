import prisma from '../lib/prisma.js';
import { canContactWorker } from './paymentAuthService.js';

const STAFF_ROLES = new Set(['ADMIN', 'SUPPORT']);

export const EMPLOYER_PROFILE_PUBLIC_FIELDS = [
  '_id', 'fullName', 'profileImage', 'companyName', 'website', 'bio',
  'location', 'countryCode', 'countryName', 'language', 'role', 'createdAt'
];

export const EMPLOYER_PROFILE_CONTACT_FIELDS = ['email', 'phone'];

const normalizeRole = (role) => String(role || '').trim().toUpperCase();

/**
 * Authorize a read-only Employer profile view without changing the existing
 * chat/payment authorization rules. Contact fields are exposed only for the
 * employer themselves or a Worker with the existing paid relationship.
 */
export const authorizeEmployerProfileView = async ({
  requesterId,
  requesterRole,
  targetUserId,
  targetRole,
  db = prisma,
}) => {
  const requester = normalizeRole(requesterRole);
  const target = normalizeRole(targetRole);

  if (target !== 'EMPLOYER') {
    return { allowed: false, exposeContact: false, reason: 'EMPLOYER_PROFILE_REQUIRED' };
  }

  if (STAFF_ROLES.has(requester)) {
    return { allowed: true, exposeContact: false, reason: 'STAFF_ACCESS' };
  }

  if (requester === 'EMPLOYER') {
    const allowed = String(requesterId) === String(targetUserId);
    return {
      allowed,
      exposeContact: allowed,
      reason: allowed ? 'OWN_PROFILE' : 'EMPLOYER_SELF_ONLY',
    };
  }

  if (requester === 'WORKER') {
    const workerProfile = await db.workerProfile.findUnique({
      where: { userId: String(requesterId) },
      select: { id: true },
    });

    const allowed = workerProfile
      ? await canContactWorker(String(targetUserId), workerProfile.id, db)
      : false;

    return {
      allowed,
      exposeContact: allowed,
      reason: allowed ? 'PAID_RELATIONSHIP' : 'PAID_RELATIONSHIP_REQUIRED',
    };
  }

  return { allowed: false, exposeContact: false, reason: 'ROLE_NOT_ALLOWED' };
};
