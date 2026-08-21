import prisma from '../lib/prisma.js';

/**
 * Phase 1 only records the request. It deliberately does not alter the user
 * or any related business data.
 */
export const createOrReuseAccountDeletionRequest = async (userId, db = prisma) => {
  if (!userId) {
    throw new Error('Authenticated user id is required');
  }

  const normalizedUserId = String(userId);
  const existing = await db.accountDeletionRequest.findUnique({
    where: { userId: normalizedUserId }
  });

  if (existing) {
    return { request: existing, reused: true };
  }

  try {
    const request = await db.accountDeletionRequest.create({
      data: {
        userId: normalizedUserId,
        status: 'pending'
      }
    });

    return { request, reused: false };
  } catch (error) {
    // The unique userId constraint makes concurrent/retried requests safe.
    if (error?.code === 'P2002') {
      const concurrentRequest = await db.accountDeletionRequest.findUnique({
        where: { userId: normalizedUserId }
      });

      if (concurrentRequest) {
        return { request: concurrentRequest, reused: true };
      }
    }

    throw error;
  }
};

export const serializeAccountDeletionRequest = (request) => ({
  id: request.id,
  status: request.status,
  requestedAt: request.requestedAt
});
