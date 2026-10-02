// backend/src/constants/teacherTaxonomy.js
// Canonical Teacher Subjects, Levels, and Teaching Methods.

export const CANONICAL_TEACHER_SUBJECTS = Object.freeze([
  'mathematics',
  'physics',
  'chemistry',
  'biology',
  'science',
  'arabic',
  'english',
  'french',
  'german',
  'spanish',
  'italian',
  'history',
  'geography',
  'philosophy',
  'psychology',
  'computer_science',
  'programming',
  'economics',
  'accounting',
  'business_studies',
  'music',
  'art',
  'quran_studies',
  'other'
]);

export const CANONICAL_TEACHING_LEVELS = Object.freeze([
  'early_childhood',
  'primary',
  'preparatory',
  'secondary',
  'high_school',
  'university',
  'adult_education',
  'all_levels'
]);

export const CANONICAL_TEACHING_METHODS = Object.freeze([
  'online',
  'in_person',
  'both'
]);

export const isCanonicalTeacherSubject = (val) =>
  typeof val === 'string' && CANONICAL_TEACHER_SUBJECTS.includes(val);

export const isCanonicalTeachingLevel = (val) =>
  typeof val === 'string' && CANONICAL_TEACHING_LEVELS.includes(val);

export const isCanonicalTeachingMethod = (val) =>
  typeof val === 'string' && CANONICAL_TEACHING_METHODS.includes(val);

export default {
  CANONICAL_TEACHER_SUBJECTS,
  CANONICAL_TEACHING_LEVELS,
  CANONICAL_TEACHING_METHODS,
  isCanonicalTeacherSubject,
  isCanonicalTeachingLevel,
  isCanonicalTeachingMethod
};
