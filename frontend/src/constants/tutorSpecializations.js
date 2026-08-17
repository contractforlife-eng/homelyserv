// frontend/src/constants/tutorSpecializations.js
// Canonical Tutor Specialization constants and legacy compatibility map.

export const TUTOR_SPECIALIZATIONS = Object.freeze([
  { value: 'history', labelKey: 'tutorSpecializations.history' },
  { value: 'math', labelKey: 'tutorSpecializations.math' },
  { value: 'social_studies', labelKey: 'tutorSpecializations.social_studies' },
  { value: 'physics', labelKey: 'tutorSpecializations.physics' },
  { value: 'chemistry', labelKey: 'tutorSpecializations.chemistry' },
  { value: 'biology', labelKey: 'tutorSpecializations.biology' },
  { value: 'german', labelKey: 'tutorSpecializations.german' },
  { value: 'french', labelKey: 'tutorSpecializations.french' },
  { value: 'english', labelKey: 'tutorSpecializations.english' },
  { value: 'arabic', labelKey: 'tutorSpecializations.arabic' },
  { value: 'religion', labelKey: 'tutorSpecializations.religion' },
  { value: 'islamic_studies', labelKey: 'tutorSpecializations.islamic_studies' },
  { value: 'fiqh', labelKey: 'tutorSpecializations.fiqh' },
  { value: 'sharia', labelKey: 'tutorSpecializations.sharia' },
  { value: 'azhar', labelKey: 'tutorSpecializations.azhar' },
  { value: 'primary_all_subjects', labelKey: 'tutorSpecializations.primary_all_subjects' },
  { value: 'preparatory_all_subjects', labelKey: 'tutorSpecializations.preparatory_all_subjects' },
  { value: 'science', labelKey: 'tutorSpecializations.science' },
  { value: 'psychology', labelKey: 'tutorSpecializations.psychology' },
  { value: 'economics', labelKey: 'tutorSpecializations.economics' },
  { value: 'statistics', labelKey: 'tutorSpecializations.statistics' },
  { value: 'financial_literacy', labelKey: 'tutorSpecializations.financial_literacy' },
  { value: 'physical_education', labelKey: 'tutorSpecializations.physical_education' },
  { value: 'sociology', labelKey: 'tutorSpecializations.sociology' },
  { value: 'philosophy', labelKey: 'tutorSpecializations.philosophy' },
  { value: 'logic', labelKey: 'tutorSpecializations.logic' },
  { value: 'geology_environmental_science', labelKey: 'tutorSpecializations.geology_environmental_science' },
  { value: 'spanish', labelKey: 'tutorSpecializations.spanish' },
  { value: 'italian', labelKey: 'tutorSpecializations.italian' },
  { value: 'chinese', labelKey: 'tutorSpecializations.chinese' },
  { value: 'japanese', labelKey: 'tutorSpecializations.japanese' },
  { value: 'hindi', labelKey: 'tutorSpecializations.hindi' },
  { value: 'korean', labelKey: 'tutorSpecializations.korean' },
  { value: 'other', labelKey: 'tutorSpecializations.other' },
]);

const LEGACY_ALIAS_MAP = Object.freeze({
  english: ['english', 'English', 'ENGLISH', 'English teacher', 'english teacher'],
  math: ['math', 'Math', 'MATH', 'Mathematics', 'mathematics'],
  physics: ['physics', 'Physics', 'PHYSICS'],
  chemistry: ['chemistry', 'Chemistry', 'CHEMISTRY'],
  biology: ['biology', 'Biology', 'BIOLOGY'],
  science: ['science', 'Science', 'SCIENCE'],
  german: ['german', 'German', 'GERMAN'],
  french: ['french', 'French', 'FRENCH'],
  arabic: ['arabic', 'Arabic', 'ARABIC', 'Arabic language', 'arabic language'],
  history: ['history', 'History', 'HISTORY'],
  social_studies: ['social studies', 'Social Studies', 'SOCIAL STUDIES'],
  religion: ['religion', 'Religion', 'RELIGION'],
  islamic_studies: ['islamic studies', 'Islamic Studies', 'ISLAMIC STUDIES'],
  psychology: ['psychology', 'Psychology', 'PSYCHOLOGY'],
  economics: ['economics', 'Economics', 'ECONOMICS'],
  statistics: ['statistics', 'Statistics', 'STATISTICS'],
  sociology: ['sociology', 'Sociology', 'SOCIOLOGY'],
  philosophy: ['philosophy', 'Philosophy', 'PHILOSOPHY'],
  primary_all_subjects: ['primary all subjects', 'Primary All Subjects', 'PRIMARY ALL SUBJECTS', 'all subjects primary', 'All Subjects Primary'],
  preparatory_all_subjects: ['preparatory all subjects', 'Preparatory All Subjects', 'PREPARATORY ALL SUBJECTS', 'all subjects preparatory', 'All Subjects Preparatory'],
  physical_education: ['physical education', 'Physical Education', 'PHYSICAL EDUCATION', 'PE', 'pe'],
  logic: ['logic', 'Logic', 'LOGIC'],
  spanish: ['spanish', 'Spanish', 'SPANISH'],
  italian: ['italian', 'Italian', 'ITALIAN'],
  chinese: ['chinese', 'Chinese', 'CHINESE'],
  japanese: ['japanese', 'Japanese', 'JAPANESE'],
  hindi: ['hindi', 'Hindi', 'HINDI'],
  korean: ['korean', 'Korean', 'KOREAN'],
});

const buildLegacyIndex = () => {
  const index = new Map();
  for (const [canonical, aliases] of Object.entries(LEGACY_ALIAS_MAP)) {
    for (const alias of aliases) {
      index.set(alias.toLowerCase().trim(), canonical);
    }
  }
  return index;
};

const LEGACY_INDEX = buildLegacyIndex();

export const resolveTutorSpecialization = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (LEGACY_INDEX.has(lower)) {
    return LEGACY_INDEX.get(lower);
  }
  if (TUTOR_SPECIALIZATIONS.some(opt => opt.value === trimmed)) {
    return trimmed;
  }
  return null;
};

export const getTutorSpecializationLabel = (value, t) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const canonical = resolveTutorSpecialization(trimmed);
  if (canonical) {
    const option = TUTOR_SPECIALIZATIONS.find(opt => opt.value === canonical);
    if (option && t) {
      return t(option.labelKey, trimmed);
    }
    return trimmed;
  }
  return trimmed;
};
