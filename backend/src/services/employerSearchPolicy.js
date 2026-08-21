const hasMeaningfulValue = (value) => String(value || '').trim().length > 0;

export const isIntentionalWorkerSearch = ({
  query,
  category,
  location,
  minRating,
  minExperience,
  availability,
  maxHourlyRateActive,
  language,
} = {}) => {
  const hasQuery = hasMeaningfulValue(query);
  const hasCategory = hasMeaningfulValue(category) && String(category).trim().toLowerCase() !== 'all';
  const hasLocation = hasMeaningfulValue(location) && String(location).trim().toLowerCase() !== 'all';
  const hasRating = Number(minRating) > 0;
  const hasExperience = Number(minExperience) > 0;
  const hasAvailability = hasMeaningfulValue(availability) && String(availability).trim().toLowerCase() !== 'all';
  const hasRate = maxHourlyRateActive === true || String(maxHourlyRateActive).toLowerCase() === 'true';
  const hasLanguage = hasMeaningfulValue(language) && String(language).trim().toLowerCase() !== 'all';

  return hasQuery || hasCategory || hasLocation || hasRating || hasExperience
    || hasAvailability || hasRate || hasLanguage;
};
