// frontend/src/utils/materialsValidation.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatFileSize } from './fileDownload.js';
import { STUDENT_TRANSLATIONS } from '../i18n/studentTranslations.js';
import { TEACHER_TRANSLATIONS } from '../i18n/teacherTranslations.js';

test('formatFileSize formats byte units accurately', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(500), '500 B');
  assert.equal(formatFileSize(1024), '1.0 KB');
  assert.equal(formatFileSize(1024 * 1024 * 5.5), '5.5 MB');
  assert.equal(formatFileSize(1024 * 1024 * 10), '10.0 MB');
});

test('Student translations contain all required PDF materials keys in all 6 languages', () => {
  const languages = ['en', 'ar', 'fr', 'ru', 'tr', 'de'];
  const requiredStudentCourseKeys = [
    'materialsTitle',
    'materialsEmpty',
    'downloadMaterialBtn',
    'downloadingMaterial',
    'downloadError',
    'enrollToDownload',
    'materialsCount'
  ];
  const requiredStudentLessonKeys = [
    'materialsTitle',
    'materialsSubtitle',
    'materialsEmpty',
    'downloadMaterialBtn',
    'downloadingMaterial',
    'downloadError'
  ];

  for (const lang of languages) {
    const studentCourses = STUDENT_TRANSLATIONS[lang]?.studentCourses;
    assert.ok(studentCourses, `Missing studentCourses in language: ${lang}`);
    for (const key of requiredStudentCourseKeys) {
      assert.ok(
        typeof studentCourses[key] === 'string' && studentCourses[key].trim().length > 0,
        `Missing or empty key studentCourses.${key} in language: ${lang}`
      );
    }

    const studentLessons = STUDENT_TRANSLATIONS[lang]?.studentLessons;
    assert.ok(studentLessons, `Missing studentLessons in language: ${lang}`);
    for (const key of requiredStudentLessonKeys) {
      assert.ok(
        typeof studentLessons[key] === 'string' && studentLessons[key].trim().length > 0,
        `Missing or empty key studentLessons.${key} in language: ${lang}`
      );
    }
  }
});

test('Teacher translations contain all required PDF materials keys in all 6 languages', () => {
  const languages = ['en', 'ar', 'fr', 'ru', 'tr', 'de'];
  const requiredMaterialSubkeys = [
    'title',
    'subtitle',
    'uploadBtn',
    'uploading',
    'empty',
    'downloadBtn',
    'deleteBtn',
    'downloading',
    'deleting',
    'deleteConfirm',
    'titleLabel',
    'titlePlaceholder',
    'fileLabel',
    'pdfOnlyError',
    'maxSizeError',
    'titleRequired',
    'uploadSuccess',
    'uploadError',
    'deleteSuccess',
    'deleteError',
    'downloadError'
  ];

  const teacherCoursesSpecificSubkeys = [
    ...requiredMaterialSubkeys,
    'manageMaterialsBtn',
    'manageMaterialsAction',
    'saveFirstNotice'
  ];

  for (const lang of languages) {
    const teacherCoursesMaterials = TEACHER_TRANSLATIONS[lang]?.teacherCourses?.materials;
    assert.ok(teacherCoursesMaterials, `Missing teacherCourses.materials in language: ${lang}`);
    for (const key of teacherCoursesSpecificSubkeys) {
      assert.ok(
        typeof teacherCoursesMaterials[key] === 'string' && teacherCoursesMaterials[key].trim().length > 0,
        `Missing or empty key teacherCourses.materials.${key} in language: ${lang}`
      );
    }

    const teacherScheduleMaterials = TEACHER_TRANSLATIONS[lang]?.teacherSchedule?.materials;
    assert.ok(teacherScheduleMaterials, `Missing teacherSchedule.materials in language: ${lang}`);
    for (const key of requiredMaterialSubkeys) {
      assert.ok(
        typeof teacherScheduleMaterials[key] === 'string' && teacherScheduleMaterials[key].trim().length > 0,
        `Missing or empty key teacherSchedule.materials.${key} in language: ${lang}`
      );
    }
  }
});
