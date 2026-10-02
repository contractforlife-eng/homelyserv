// frontend/src/constants/teacherTaxonomy.js

export const TEACHER_SUBJECTS = Object.freeze([
  { value: 'mathematics', labelKey: 'teacherTaxonomy.subjects.mathematics' },
  { value: 'physics', labelKey: 'teacherTaxonomy.subjects.physics' },
  { value: 'chemistry', labelKey: 'teacherTaxonomy.subjects.chemistry' },
  { value: 'biology', labelKey: 'teacherTaxonomy.subjects.biology' },
  { value: 'science', labelKey: 'teacherTaxonomy.subjects.science' },
  { value: 'arabic', labelKey: 'teacherTaxonomy.subjects.arabic' },
  { value: 'english', labelKey: 'teacherTaxonomy.subjects.english' },
  { value: 'french', labelKey: 'teacherTaxonomy.subjects.french' },
  { value: 'german', labelKey: 'teacherTaxonomy.subjects.german' },
  { value: 'spanish', labelKey: 'teacherTaxonomy.subjects.spanish' },
  { value: 'italian', labelKey: 'teacherTaxonomy.subjects.italian' },
  { value: 'history', labelKey: 'teacherTaxonomy.subjects.history' },
  { value: 'geography', labelKey: 'teacherTaxonomy.subjects.geography' },
  { value: 'philosophy', labelKey: 'teacherTaxonomy.subjects.philosophy' },
  { value: 'psychology', labelKey: 'teacherTaxonomy.subjects.psychology' },
  { value: 'computer_science', labelKey: 'teacherTaxonomy.subjects.computer_science' },
  { value: 'programming', labelKey: 'teacherTaxonomy.subjects.programming' },
  { value: 'economics', labelKey: 'teacherTaxonomy.subjects.economics' },
  { value: 'accounting', labelKey: 'teacherTaxonomy.subjects.accounting' },
  { value: 'business_studies', labelKey: 'teacherTaxonomy.subjects.business_studies' },
  { value: 'music', labelKey: 'teacherTaxonomy.subjects.music' },
  { value: 'art', labelKey: 'teacherTaxonomy.subjects.art' },
  { value: 'quran_studies', labelKey: 'teacherTaxonomy.subjects.quran_studies' },
  { value: 'other', labelKey: 'teacherTaxonomy.subjects.other' }
]);

export const TEACHING_LEVELS = Object.freeze([
  { value: 'early_childhood', labelKey: 'teacherTaxonomy.levels.early_childhood' },
  { value: 'primary', labelKey: 'teacherTaxonomy.levels.primary' },
  { value: 'preparatory', labelKey: 'teacherTaxonomy.levels.preparatory' },
  { value: 'secondary', labelKey: 'teacherTaxonomy.levels.secondary' },
  { value: 'high_school', labelKey: 'teacherTaxonomy.levels.high_school' },
  { value: 'university', labelKey: 'teacherTaxonomy.levels.university' },
  { value: 'adult_education', labelKey: 'teacherTaxonomy.levels.adult_education' },
  { value: 'all_levels', labelKey: 'teacherTaxonomy.levels.all_levels' }
]);

export const TEACHING_METHODS = Object.freeze([
  { value: 'online', labelKey: 'teacherTaxonomy.methods.online' },
  { value: 'in_person', labelKey: 'teacherTaxonomy.methods.in_person' },
  { value: 'both', labelKey: 'teacherTaxonomy.methods.both' }
]);

export default {
  TEACHER_SUBJECTS,
  TEACHING_LEVELS,
  TEACHING_METHODS
};
