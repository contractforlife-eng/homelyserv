export const formatExperienceDisplay = (value) => {
  if (value == null) return '';
  const displayValue = String(value).trim();
  if (!displayValue) return '';

  const withoutTrailingUnit = displayValue.replace(/\s+years?$/i, '').trim();
  if (!/^\d+(?:\.\d+)?$/.test(withoutTrailingUnit)) return displayValue;

  return `${withoutTrailingUnit} ${Number(withoutTrailingUnit) === 1 ? 'year' : 'years'}`;
};
