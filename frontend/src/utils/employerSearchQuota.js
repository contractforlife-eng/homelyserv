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

export const hasMeaningfulEmployerSearchFilters = ({
  query,
  location,
  minRating,
  minExperience,
  availability,
  maxHourlyRateActive,
  language,
} = {}) => (
  Boolean(String(query || '').trim())
  || Boolean(location && location !== 'All Locations' && location !== 'all')
  || Number(minRating) > 0
  || Number(minExperience) > 0
  || (availability && availability !== 'all')
  || maxHourlyRateActive === true
  || String(language || '').toLowerCase() !== 'all' && Boolean(language)
);
