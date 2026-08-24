import { normalizePremiumStatus } from './premiumStatus.js';

export const createUnknownPremiumState = (userId = null) => ({
  userId: userId == null ? null : String(userId),
  known: false,
  isPremium: null,
  subscription: null,
});

export const createInitialPremiumState = (userId, user) => {
  const known = typeof user?.isPremium === 'boolean';
  return {
    userId: userId == null ? null : String(userId),
    known,
    isPremium: known ? user.isPremium : null,
    subscription: null,
  };
};

export const preservePremiumStateForUser = (current, userId, user) => {
  const normalizedUserId = userId == null ? null : String(userId);
  if (current?.userId === normalizedUserId && current.known === true) return current;
  return createInitialPremiumState(normalizedUserId, user);
};

export const applyCanonicalPremiumState = (userId, response) => {
  const normalized = normalizePremiumStatus(response);
  return {
    userId: userId == null ? null : String(userId),
    known: true,
    isPremium: normalized.isPremium,
    subscription: normalized.subscription,
  };
};
