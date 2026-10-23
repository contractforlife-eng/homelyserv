// frontend/src/utils/familyTrackingTranslations.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { STUDENT_TRANSLATIONS } from '../i18n/studentTranslations.js';

const REQUIRED_FAMILY_TRACKING_KEYS = [
  'studentTitle',
  'studentSubtitle',
  'guardianTitle',
  'guardianSubtitle',
  'androidOnlyNotice',
  'visibleActivationTitle',
  'visibleActivationDesc1',
  'visibleActivationDesc2',
  'consentLabel',
  'serverState',
  'androidPermissions',
  'safeguard',
  'safeguardRequired',
  'safeguardApproved',
  'safeguardAdult',
  'foreground',
  'background',
  'notifications',
  'activityRecognition',
  'granted',
  'notGranted',
  'encryptedQueue',
  'beginActivation',
  'openSettings',
  'verifyAndStart',
  'pause',
  'disableAndClear',
  'startingNotice',
  'safeguardNotice',
  'activeNotice',
  'pausedNotice',
  'disabledNotice',
  'errRequiresGuardian',
  'errForegroundRequired',
  'errBackgroundRequired',
  'errNotificationsRequired',
  'errSafeguardRequired',
  'errGenericStart',
  'errVerificationFailed',
  'errStopFailed',
  'myChildren',
  'retry',
  'lastRecordedLocation',
  'noRecentObservation',
  'accuracyMeters',
  'staleObservation',
  'recentObservation',
  'trackingAndPermission',
  'nativeUnverifiedWarning',
  'approveSafeguardBtn',
  'approvingSafeguard',
  'approveSafeguardConfirm',
  'historyPlan',
  'premiumPlan',
  'freePlan',
  'studentTimezoneNotice',
  'recordedMovementTitle',
  'recordedMovementDesc',
  'tilesDisabledWarning',
  'noObservationsForDate',
  'noObservationsDesc',
  'recordedObservation',
  'routeStart',
  'routeEnd',
  'speedUnit',
  'headingUnit',
  'statusActive',
  'statusPaused',
  'statusIncomplete',
  'statusNotActivated',
  'statusUnavailable',
  'noSuccessfulObservation'
];

test('Family Tracking translations exist and contain all keys for all 6 supported languages', () => {
  const languages = ['en', 'ar', 'fr', 'ru', 'tr', 'de'];
  for (const lang of languages) {
    const studentNav = STUDENT_TRANSLATIONS[lang]?.studentNav;
    assert.ok(studentNav, `studentNav missing for language ${lang}`);
    assert.ok(studentNav.familyTracking, `familyTracking nav key missing for language ${lang}`);

    const familyTracking = STUDENT_TRANSLATIONS[lang]?.familyTracking;
    assert.ok(familyTracking, `familyTracking missing for language ${lang}`);

    for (const key of REQUIRED_FAMILY_TRACKING_KEYS) {
      assert.ok(
        familyTracking[key],
        `Missing translation key "${key}" in familyTracking for language "${lang}"`
      );
      assert.equal(
        typeof familyTracking[key],
        'string',
        `Translation key "${key}" in familyTracking for language "${lang}" must be a string`
      );
      assert.ok(
        familyTracking[key].trim().length > 0,
        `Translation key "${key}" in familyTracking for language "${lang}" must not be empty`
      );
    }
  }
});
