const ARABIC_ALIAS_MAP = {
  tutor: [
    'مدرس',
    'معلم',
    'مدرس خصوصي',
  ],
  cook: [
    'طباخ',
    'طباخه',
    'طباخة',
  ],
  driver: [
    'سائق',
    'سواق',
  ],
  nanny: [
    'مربية اطفال',
    'مربيه اطفال',
    'مربية أطفال',
    'مربيه أطفال',
    'اطفال',
    'أطفال',
    'مربية طفل',
    'مربيه طفل',
    'مربية طفلة',
    'مربيه طفله',
  ],
  portrait_painter: [
    'رسام',
    'نقاش',
    'خطاط',
  ],
  elderly_caregiver: [
    'جليس مسنين',
    'جليسه مسنين',
    'جليسة مسنين',
    'ممرض رعايه مسنين',
    'ممرض رعاية مسنين',
    'مسن',
    'مسنين',
    'رعاية مسنين',
    'رعايه مسنين',
  ],
};

const normalizeArabic = (input) => {
  if (typeof input !== 'string') return '';

  let text = input.trim();

  text = text.replace(/\s+/g, ' ');

  text = text.replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '');

  text = text.replace(/[أإآ]/g, 'ا');
  text = text.replace(/ى/g, 'ي');

  return text;
};

export const resolveArabicJobAlias = (input) => {
  const normalized = normalizeArabic(input);
  if (!normalized) return null;

  for (const [canonical, aliases] of Object.entries(ARABIC_ALIAS_MAP)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeArabic(alias);
      if (normalized === normalizedAlias) {
        return canonical;
      }
    }
  }

  return null;
};
