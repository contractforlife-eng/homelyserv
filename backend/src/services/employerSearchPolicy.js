import { resolveCanonicalJobLabel } from './jobLabelResolver.js';

const hasMeaningfulValue = (value) => String(value || '').trim().length > 0;
const escapeRegExp = (value) => String(value).replace(/[\^$.*+?()[\]{}|]/g, '\\$&');

export const buildWorkerTextSearchFilter = (query) => {
  const escapedQuery = escapeRegExp(query);
  const clauses = [
    { fullName: { $regex: escapedQuery, $options: 'i' } },
    { bio: { $regex: escapedQuery, $options: 'i' } },
    { skills: { $in: [new RegExp(escapedQuery, 'i')] } },
    { desiredJob: { $regex: escapedQuery, $options: 'i' } }
  ];

  const canonicalJob = resolveCanonicalJobLabel(query);
  if (canonicalJob) {
    clauses.push({
      desiredJob: {
        $regex: '^' + escapeRegExp(canonicalJob) + '$',
        $options: 'i'
      }
    });
  }

  return { $or: clauses };
};

export const buildCanonicalJobFilter = (category) => {
  const rawCategory = String(category || '').trim();
  if (!rawCategory || rawCategory.toLowerCase() === 'all') return null;

  const canonicalCategory = rawCategory.toLowerCase().replace(/\s+/g, '_');
  const pattern = canonicalCategory
    .split('_')
    .filter(Boolean)
    .map(escapeRegExp)
    .join('[_ ]+');

  return {
    desiredJob: {
      $regex: '^' + pattern + '$',
      $options: 'i'
    }
  };
};

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
