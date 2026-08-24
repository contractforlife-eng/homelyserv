// Normalize the server-authoritative Premium status response for presentation.
// This helper never grants Premium; the backend response remains authoritative.
export const normalizePremiumStatus = (response, now = new Date()) => {
  const subscription = response?.subscription || null;
  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  const active = response?.isPremium === true
    && response?.active !== false
    && subscription?.status === 'active'
    && endDate instanceof Date
    && !Number.isNaN(endDate.getTime())
    && endDate >= now;

  return {
    isPremium: active,
    active,
    subscription: active ? subscription : null,
  };
};
