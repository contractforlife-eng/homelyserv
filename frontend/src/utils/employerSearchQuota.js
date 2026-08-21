export const isSearchLimitResponse = (error) => (
  error?.response?.status === 403
  && String(error.response?.data?.message || '').includes('Daily search limit reached')
);

export const getSearchLimitState = (response, previous = {}) => ({
  ...previous,
  count: response?.searchCount ?? 3,
  limit: response?.searchLimit || 3,
  remaining: 0,
  isPremium: response?.isPremium || false,
  limitReached: true,
});

export const shouldShowWorkerDiscovery = (searchLimitState = {}) => (
  searchLimitState.isPremium === true || searchLimitState.limitReached !== true
);

export const hasEmployerSearchAccountChanged = (previousUserKey, currentUserKey) => (
  Boolean(previousUserKey && currentUserKey && previousUserKey !== currentUserKey)
);
