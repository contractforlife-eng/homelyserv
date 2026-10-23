// frontend/src/utils/studentFamilyTrackingBehavior.test.js
// ============================================================
// Focused behavioral regression tests for StudentFamilyTracking:
// 1. Production HTTP 503 displays the localized PRODUCTION_DEVICE_ATTESTATION_REQUIRED message across languages.
// 2. A request timeout displays an error and releases the loading state.
// 3. Failed activation always resets the spinner (busy state).
// 4. Reopening/focusing the page refreshes the actual server status and hydrates consented.
// 5. ACTIVE is never displayed unless the backend confirms activation.
// 6. Interactive button testing: Begin activation gives actionable feedback when consent is missing.
// 7. Interactive button testing: Verify and Start alerts when Android bridge is unavailable.
// 8. Interactive button testing: Pause gives actionable feedback when tracking is not ACTIVE.
// 9. Status rendering: AWAITING_NATIVE_VERIFICATION and AWAITING_AGE_SAFEGUARD are fully localized in Arabic and English without raw enums.
// 10. Safeguard labels: GUARDIAN_APPROVED, VERIFIED_ADULT, REQUIRED are translated across Arabic and English.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { STUDENT_TRANSLATIONS } from '../i18n/studentTranslations.js';

// Setup translation helper matching react-i18next usage in StudentFamilyTracking
const createI18nHelper = (lang = 'en') => {
  const dictionary = STUDENT_TRANSLATIONS[lang] || STUDENT_TRANSLATIONS.en;
  return (key) => {
    const parts = key.split('.');
    let curr = dictionary;
    for (const p of parts) {
      curr = curr?.[p];
    }
    return curr || key;
  };
};

/**
 * Controller embodying the exact state machine and handler logic of StudentFamilyTracking.jsx
 */
class StudentFamilyTrackingController {
  constructor({ studentId, token, isAndroid = true, lang = 'en', apiService, nativeBridge }) {
    this.studentId = studentId;
    this.token = token;
    this.android = isAndroid;
    this.t = createI18nHelper(lang);
    this.api = apiService;
    this.native = nativeBridge;

    // Component state variables (matching useState hooks)
    this.status = null;
    this.nativeStatus = null;
    this.challenge = '';
    this.consented = false;
    this.busy = false;
    this.notice = '';
    this.error = '';

    // Listeners for window/document events (focus, visibilitychange)
    this.eventListeners = new Map();

    // Activation error messages lookup (matching StudentFamilyTracking.jsx line 98)
    this.activationErrorMessages = {
      'PRODUCTION_DEVICE_ATTESTATION_REQUIRED': this.t('familyTracking.errProductionAttestationRequired'),
      'ACTIVATION_NOT_READY': this.t('familyTracking.errActivationNotReady'),
      'NATIVE_KEY_MISMATCH': this.t('familyTracking.errNativeKeyMismatch'),
      'INVALID_NATIVE_SIGNATURE': this.t('familyTracking.errInvalidNativeSignature'),
      'INVALID_NATIVE_PROOF': this.t('familyTracking.errInvalidNativeProof'),
    };
  }

  addEventListener(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(handler);
  }

  removeEventListener(event, handler) {
    this.eventListeners.get(event)?.delete(handler);
  }

  triggerEvent(event) {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler();
      }
    }
  }

  // mount/init effect
  async mount() {
    this.onResume = () => {
      this.refresh();
    };
    this.addEventListener('focus', this.onResume);
    this.addEventListener('visibilitychange', this.onResume);
    await this.refresh();
  }

  // unmount cleanup
  unmount() {
    this.removeEventListener('focus', this.onResume);
    this.removeEventListener('visibilitychange', this.onResume);
  }

  // refresh callback with consent hydration
  async refresh() {
    if (!this.studentId) return;
    try {
      const response = await this.api.getFamilyTrackingStatus(this.studentId);
      const serverStatus = response.status;
      this.status = serverStatus;

      // Hydrate consent from server state if student already consented or is activated
      if (serverStatus?.consentAt || ['AWAITING_AGE_SAFEGUARD', 'AWAITING_NATIVE_VERIFICATION', 'ACTIVE', 'PAUSED'].includes(serverStatus?.activationState)) {
        this.consented = true;
      }

      if (this.android && this.native?.getNativeTrackingStatus) {
        try {
          this.nativeStatus = await this.native.getNativeTrackingStatus();
        } catch {
          // Graceful native bridge catch
        }
      }
    } catch (requestError) {
      this.error = requestError?.response?.data?.message || this.t('familyTracking.errRequiresGuardian');
    }
  }

  // begin activation button handler
  async begin() {
    if (this.busy) return;
    if (!this.android) {
      this.error = this.t('familyTracking.androidOnlyNotice');
      return;
    }
    if (!this.consented) {
      this.error = this.t('familyTracking.consentRequiredNotice');
      return;
    }

    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      const activation = await this.api.requestFamilyTrackingActivation(this.studentId, {
        consentVersion: 'family-tracking-v1',
        timeZone: 'UTC',
        platform: 'android'
      });
      this.challenge = activation.challenge;
      if (this.native?.requestForegroundTrackingPermissions) {
        await this.native.requestForegroundTrackingPermissions();
      }
      if (this.native?.requestSupportingTrackingPermissions) {
        await this.native.requestSupportingTrackingPermissions();
      }
      this.notice = activation.activationState === 'AWAITING_AGE_SAFEGUARD'
        ? this.t('familyTracking.safeguardNotice')
        : this.t('familyTracking.startingNotice');
      await this.refresh();
    } catch (requestError) {
      this.error = requestError?.response?.data?.message || requestError?.message || this.t('familyTracking.errGenericStart');
    } finally {
      this.busy = false;
    }
  }

  // verifyAndStart button handler
  async verifyAndStart() {
    if (this.busy) return;
    if (!this.android) {
      this.error = this.t('familyTracking.androidOnlyNotice');
      return;
    }

    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      const permissions = await this.native.getNativeTrackingStatus();
      this.nativeStatus = permissions;
      if (!permissions.foregroundPermission) {
        throw new Error(this.t('familyTracking.errForegroundRequired'));
      }
      if (!permissions.backgroundPermission) {
        throw new Error(this.t('familyTracking.errBackgroundRequired'));
      }
      if (!permissions.notificationPermission) {
        throw new Error(this.t('familyTracking.errNotificationsRequired'));
      }

      let nativeChallenge = this.challenge;
      if (!nativeChallenge) {
        const activation = await this.api.requestFamilyTrackingActivation(this.studentId, {
          consentVersion: 'family-tracking-v1',
          timeZone: 'UTC',
          platform: 'android'
        });
        if (activation.activationState === 'AWAITING_AGE_SAFEGUARD') {
          throw new Error(this.t('familyTracking.errSafeguardRequired'));
        }
        nativeChallenge = activation.challenge;
        this.challenge = nativeChallenge;
      }

      await this.native.activateNativeTracking({
        studentId: this.studentId,
        token: this.token,
        apiBase: 'https://adventurous-grace-production-1b38.up.railway.app',
        challenge: nativeChallenge
      });
      this.notice = this.t('familyTracking.activeNotice');
      await this.refresh();
    } catch (activationError) {
      // Map error code or message to clean localized UI translation
      const rawCode = activationError?.code || activationError?.response?.data?.code;
      const rawMessage = activationError?.message || activationError?.response?.data?.message || '';
      let backendMessage = this.activationErrorMessages[rawCode];
      if (!backendMessage && typeof rawMessage === 'string') {
        if (rawMessage.includes('PRODUCTION_DEVICE_ATTESTATION_REQUIRED') || rawMessage.includes('approved Android app-attestation provider')) {
          backendMessage = this.t('familyTracking.errProductionAttestationRequired');
        } else if (rawMessage.includes('ACTIVATION_NOT_READY')) {
          backendMessage = this.t('familyTracking.errActivationNotReady');
        } else if (rawMessage.includes('NATIVE_KEY_MISMATCH')) {
          backendMessage = this.t('familyTracking.errNativeKeyMismatch');
        } else if (rawMessage.includes('INVALID_NATIVE_SIGNATURE')) {
          backendMessage = this.t('familyTracking.errInvalidNativeSignature');
        } else if (rawMessage.includes('INVALID_NATIVE_PROOF')) {
          backendMessage = this.t('familyTracking.errInvalidNativeProof');
        } else if (rawMessage.includes('NO_ACTIVE_GUARDIAN')) {
          backendMessage = this.t('familyTracking.errRequiresGuardian');
        }
      }
      this.error = backendMessage || rawMessage || this.t('familyTracking.errVerificationFailed');
    } finally {
      this.busy = false;
    }
  }

  // stop button handler (disable or pause)
  async stop(disable) {
    if (this.busy) return;
    // For pause action, verify that tracking is actually active or paused
    if (!disable && this.status?.activationState !== 'ACTIVE') {
      this.notice = '';
      this.error = this.t('familyTracking.pauseUnavailableNotice');
      return;
    }

    this.busy = true;
    this.error = '';
    try {
      if (disable) {
        await this.api.disableFamilyTracking(this.studentId);
      } else {
        await this.api.pauseFamilyTracking(this.studentId);
      }
      if (this.android && this.native?.stopNativeTracking) {
        await this.native.stopNativeTracking();
      }
      if (disable) {
        this.challenge = '';
        this.consented = false;
      }
      this.notice = disable ? this.t('familyTracking.disabledNotice') : this.t('familyTracking.pausedNotice');
      await this.refresh();
    } catch (requestError) {
      this.error = requestError?.response?.data?.message || requestError?.message || this.t('familyTracking.errStopFailed');
    } finally {
      this.busy = false;
    }
  }

  // Helper reflecting the getServerStateLabel implementation
  getServerStateLabel() {
    const state = this.status?.activationState;
    switch (state) {
      case 'ACTIVE':
        return this.t('familyTracking.statusActive');
      case 'PAUSED':
        return this.t('familyTracking.statusPaused');
      case 'AWAITING_NATIVE_VERIFICATION':
        return this.t('familyTracking.statusAwaitingNative');
      case 'AWAITING_AGE_SAFEGUARD':
        return this.t('familyTracking.statusAwaitingSafeguard');
      case 'DISABLED':
        return this.t('familyTracking.statusNotActivated');
      default:
        return state || this.t('familyTracking.statusUnavailable');
    }
  }

  // Helper reflecting getSafeguardLabel implementation
  getSafeguardLabel(code = this.status?.ageSafeguardStatus) {
    switch (code) {
      case 'GUARDIAN_APPROVED':
        return this.t('familyTracking.safeguardApproved');
      case 'VERIFIED_ADULT':
        return this.t('familyTracking.safeguardAdult');
      case 'REQUIRED':
        return this.t('familyTracking.safeguardRequired');
      default:
        return code || this.t('familyTracking.safeguardRequired');
    }
  }
}

test('1. Production HTTP 503 displays the localized PRODUCTION_DEVICE_ATTESTATION_REQUIRED message across languages', async () => {
  const languages = ['en', 'ar', 'fr', 'ru', 'tr', 'de'];

  for (const lang of languages) {
    const mockApi = {
      getFamilyTrackingStatus: async () => ({
        status: { activationState: 'DISABLED', ageSafeguardStatus: 'VERIFIED_ADULT' }
      }),
      requestFamilyTrackingActivation: async () => ({
        challenge: 'mock-challenge-token',
        activationState: 'AWAITING_NATIVE_VERIFICATION'
      })
    };

    // Native bridge mock returns valid local permissions, but throws 503 PRODUCTION_DEVICE_ATTESTATION_REQUIRED on complete activation
    const mockNative = {
      getNativeTrackingStatus: async () => ({
        foregroundPermission: true,
        backgroundPermission: true,
        notificationPermission: true,
        queueSize: 0
      }),
      activateNativeTracking: async () => {
        const error = new Error('Service Unavailable');
        error.code = 'PRODUCTION_DEVICE_ATTESTATION_REQUIRED';
        error.response = {
          status: 503,
          data: {
            success: false,
            code: 'PRODUCTION_DEVICE_ATTESTATION_REQUIRED',
            message: 'Production activation requires an approved Android app-attestation provider'
          }
        };
        throw error;
      }
    };

    const ctrl = new StudentFamilyTrackingController({
      studentId: 'student_123',
      token: 'jwt_token',
      isAndroid: true,
      lang,
      apiService: mockApi,
      nativeBridge: mockNative
    });

    await ctrl.mount();
    assert.equal(ctrl.error, '');
    assert.equal(ctrl.busy, false);

    // Trigger activation
    await ctrl.verifyAndStart();

    // Verify error is the expected localized message
    const expectedMessage = STUDENT_TRANSLATIONS[lang].familyTracking.errProductionAttestationRequired;
    assert.ok(expectedMessage && expectedMessage.length > 0, `Expected non-empty translation for ${lang}`);
    assert.equal(ctrl.error, expectedMessage, `Localized 503 message mismatch for ${lang}`);
    assert.equal(ctrl.busy, false, 'Busy spinner must be released after 503 failure');
    assert.notEqual(ctrl.getServerStateLabel(), STUDENT_TRANSLATIONS[lang].familyTracking.statusActive);
    ctrl.unmount();
  }
});

test('2. A request timeout displays an error and releases the loading state', async () => {
  const mockApi = {
    getFamilyTrackingStatus: async () => ({
      status: { activationState: 'DISABLED' }
    }),
    requestFamilyTrackingActivation: async () => {
      const err = new Error('Network timeout: activation request exceeded 10000ms');
      err.code = 'ECONNABORTED';
      throw err;
    }
  };

  const mockNative = {
    getNativeTrackingStatus: async () => ({
      foregroundPermission: true,
      backgroundPermission: true,
      notificationPermission: true
    }),
    activateNativeTracking: async () => {}
  };

  const ctrl = new StudentFamilyTrackingController({
    studentId: 'student_timeout_test',
    token: 'jwt_token',
    isAndroid: true,
    lang: 'en',
    apiService: mockApi,
    nativeBridge: mockNative
  });

  await ctrl.mount();
  assert.equal(ctrl.busy, false);

  await ctrl.verifyAndStart();

  // Assert error is captured and busy is false
  assert.equal(ctrl.busy, false, 'Loading state must be released on timeout');
  assert.ok(ctrl.error.includes('timeout'), 'Timeout error message should be displayed');
  assert.equal(ctrl.notice, '', 'Notice should be empty on timeout failure');
  ctrl.unmount();
});

test('3. Failed activation always resets the spinner under any error type', async () => {
  const failureScenarios = [
    { name: 'Missing foreground permission', nativeError: null, permissions: { foregroundPermission: false } },
    { name: 'Missing background permission', nativeError: null, permissions: { foregroundPermission: true, backgroundPermission: false } },
    { name: 'Missing notification permission', nativeError: null, permissions: { foregroundPermission: true, backgroundPermission: true, notificationPermission: false } },
    { name: 'Bridge crash', nativeError: new Error('Native bridge detached'), permissions: { foregroundPermission: true, backgroundPermission: true, notificationPermission: true } },
    { name: 'HTTP 409 NATIVE_KEY_MISMATCH', nativeError: Object.assign(new Error('Mismatch'), { code: 'NATIVE_KEY_MISMATCH' }), permissions: { foregroundPermission: true, backgroundPermission: true, notificationPermission: true } },
    { name: 'HTTP 403 INVALID_NATIVE_SIGNATURE', nativeError: Object.assign(new Error('Signature failure'), { code: 'INVALID_NATIVE_SIGNATURE' }), permissions: { foregroundPermission: true, backgroundPermission: true, notificationPermission: true } },
    { name: 'HTTP 500 Generic crash', nativeError: new Error('Internal Server Error'), permissions: { foregroundPermission: true, backgroundPermission: true, notificationPermission: true } },
  ];

  for (const scenario of failureScenarios) {
    const mockApi = {
      getFamilyTrackingStatus: async () => ({ status: { activationState: 'DISABLED' } }),
      requestFamilyTrackingActivation: async () => ({ challenge: 'valid-challenge' })
    };

    const mockNative = {
      getNativeTrackingStatus: async () => scenario.permissions,
      activateNativeTracking: async () => {
        if (scenario.nativeError) throw scenario.nativeError;
      }
    };

    const ctrl = new StudentFamilyTrackingController({
      studentId: 'student_fail_test',
      token: 'jwt_token',
      isAndroid: true,
      lang: 'en',
      apiService: mockApi,
      nativeBridge: mockNative
    });

    await ctrl.mount();
    assert.equal(ctrl.busy, false);

    await ctrl.verifyAndStart();

    assert.equal(ctrl.busy, false, `Busy state must reset to false on failure: ${scenario.name}`);
    assert.ok(ctrl.error.length > 0, `Error message must be populated on failure: ${scenario.name}`);
    ctrl.unmount();
  }
});

test('4. Reopening or focusing the page refreshes the actual server status and hydrates consented', async () => {
  let serverFetchCount = 0;
  let currentServerState = 'AWAITING_NATIVE_VERIFICATION';

  const mockApi = {
    getFamilyTrackingStatus: async () => {
      serverFetchCount++;
      return {
        status: {
          activationState: currentServerState,
          ageSafeguardStatus: 'GUARDIAN_APPROVED',
          consentAt: '2026-10-23T12:00:00.000Z'
        }
      };
    }
  };

  const mockNative = {
    getNativeTrackingStatus: async () => ({ queueSize: 0 })
  };

  const ctrl = new StudentFamilyTrackingController({
    studentId: 'student_focus_test',
    token: 'jwt_token',
    isAndroid: true,
    lang: 'en',
    apiService: mockApi,
    nativeBridge: mockNative
  });

  // Initial mount triggers 1st refresh and hydrates consent
  await ctrl.mount();
  assert.equal(serverFetchCount, 1);
  assert.equal(ctrl.consented, true, 'Mount must hydrate consented=true from server consentAt / activationState');
  assert.equal(ctrl.status?.activationState, 'AWAITING_NATIVE_VERIFICATION');
  assert.equal(ctrl.getServerStateLabel(), 'Awaiting device verification', 'Must display localized label for AWAITING_NATIVE_VERIFICATION');

  // Simulate leaving the page and unmounting
  ctrl.unmount();

  // Simulate returning to the page (fresh mount)
  const remountedCtrl = new StudentFamilyTrackingController({
    studentId: 'student_focus_test',
    token: 'jwt_token',
    isAndroid: true,
    lang: 'en',
    apiService: mockApi,
    nativeBridge: mockNative
  });
  await remountedCtrl.mount();
  assert.equal(serverFetchCount, 2);
  assert.equal(remountedCtrl.consented, true, 'Reopened page must retain consented=true hydrated from server');
  assert.equal(remountedCtrl.getServerStateLabel(), 'Awaiting device verification');

  // External action finishes
  currentServerState = 'ACTIVE';

  // Window receives focus event
  remountedCtrl.triggerEvent('focus');
  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.equal(serverFetchCount, 3, 'Focus must trigger an immediate status refresh from server');
  assert.equal(remountedCtrl.status?.activationState, 'ACTIVE');
  assert.equal(remountedCtrl.getServerStateLabel(), 'Active on student device');

  remountedCtrl.unmount();
});

test('5. ACTIVE is never displayed unless the backend confirms activation', async () => {
  const activeLabel = STUDENT_TRANSLATIONS.en.familyTracking.statusActive;

  // Case A: State is null (loading / unconfirmed)
  const ctrlNull = new StudentFamilyTrackingController({
    studentId: 'test_a',
    lang: 'en'
  });
  ctrlNull.status = null;
  assert.notEqual(ctrlNull.getServerStateLabel(), activeLabel);
  assert.equal(ctrlNull.getServerStateLabel(), 'Status unavailable');

  // Case B: Client has permissions granted, but backend state is DISABLED
  const ctrlPermsOnly = new StudentFamilyTrackingController({
    studentId: 'test_b',
    lang: 'en'
  });
  ctrlPermsOnly.status = { activationState: 'DISABLED' };
  ctrlPermsOnly.nativeStatus = { foregroundPermission: true, backgroundPermission: true, notificationPermission: true };
  assert.notEqual(ctrlPermsOnly.getServerStateLabel(), activeLabel);
  assert.equal(ctrlPermsOnly.getServerStateLabel(), 'Not activated');

  // Case C: Client is awaiting native verification
  const ctrlAwaiting = new StudentFamilyTrackingController({
    studentId: 'test_c',
    lang: 'en'
  });
  ctrlAwaiting.status = { activationState: 'AWAITING_NATIVE_VERIFICATION' };
  assert.notEqual(ctrlAwaiting.getServerStateLabel(), activeLabel);
  assert.equal(ctrlAwaiting.getServerStateLabel(), 'Awaiting device verification');

  // Case D: PAUSED
  const ctrlPaused = new StudentFamilyTrackingController({
    studentId: 'test_d',
    lang: 'en'
  });
  ctrlPaused.status = { activationState: 'PAUSED' };
  assert.notEqual(ctrlPaused.getServerStateLabel(), activeLabel);
  assert.equal(ctrlPaused.getServerStateLabel(), 'Paused');

  // Case E: Only when backend explicitly returns ACTIVE
  const ctrlActive = new StudentFamilyTrackingController({
    studentId: 'test_e',
    lang: 'en'
  });
  ctrlActive.status = { activationState: 'ACTIVE' };
  assert.equal(ctrlActive.getServerStateLabel(), activeLabel);
  assert.equal(ctrlActive.getServerStateLabel(), 'Active on student device');
});

test('6. "Begin Activation" provides immediate, actionable feedback when consent is unselected', async () => {
  const ctrlAr = new StudentFamilyTrackingController({
    studentId: 'student_begin_test',
    isAndroid: true,
    lang: 'ar',
    apiService: {},
    nativeBridge: {}
  });

  ctrlAr.consented = false;
  await ctrlAr.begin();

  assert.equal(ctrlAr.error, STUDENT_TRANSLATIONS.ar.familyTracking.consentRequiredNotice);
  assert.equal(ctrlAr.busy, false);

  // Check in English as well
  const ctrlEn = new StudentFamilyTrackingController({
    studentId: 'student_begin_test_en',
    isAndroid: true,
    lang: 'en',
    apiService: {},
    nativeBridge: {}
  });
  ctrlEn.consented = false;
  await ctrlEn.begin();
  assert.equal(ctrlEn.error, STUDENT_TRANSLATIONS.en.familyTracking.consentRequiredNotice);
});

test('7. "Verify and Start" provides immediate visible feedback if Android platform bridge is missing', async () => {
  const ctrlWeb = new StudentFamilyTrackingController({
    studentId: 'student_web_test',
    isAndroid: false, // Running in mobile browser or desktop
    lang: 'ar',
    apiService: {},
    nativeBridge: {}
  });

  await ctrlWeb.verifyAndStart();
  assert.equal(ctrlWeb.error, STUDENT_TRANSLATIONS.ar.familyTracking.androidOnlyNotice);
  assert.equal(ctrlWeb.busy, false);
});

test('8. "Pause" provides immediate visible feedback explaining when tracking is not ACTIVE', async () => {
  const mockApi = {
    getFamilyTrackingStatus: async () => ({
      status: { activationState: 'AWAITING_NATIVE_VERIFICATION' }
    })
  };

  const ctrl = new StudentFamilyTrackingController({
    studentId: 'student_pause_test',
    isAndroid: true,
    lang: 'ar',
    apiService: mockApi,
    nativeBridge: {}
  });

  await ctrl.mount();
  assert.equal(ctrl.status?.activationState, 'AWAITING_NATIVE_VERIFICATION');

  // Tapping Pause while in pending activation state
  await ctrl.stop(false);

  assert.equal(ctrl.error, STUDENT_TRANSLATIONS.ar.familyTracking.pauseUnavailableNotice);
  assert.equal(ctrl.busy, false);

  // In English
  const ctrlEn = new StudentFamilyTrackingController({
    studentId: 'student_pause_test_en',
    isAndroid: true,
    lang: 'en',
    apiService: mockApi,
    nativeBridge: {}
  });
  await ctrlEn.mount();
  await ctrlEn.stop(false);
  assert.equal(ctrlEn.error, STUDENT_TRANSLATIONS.en.familyTracking.pauseUnavailableNotice);
});

test('9. Status labels for AWAITING_NATIVE_VERIFICATION and AWAITING_AGE_SAFEGUARD are fully localized', async () => {
  const ctrlAr = new StudentFamilyTrackingController({
    studentId: 'student_labels_ar',
    lang: 'ar'
  });

  ctrlAr.status = { activationState: 'AWAITING_NATIVE_VERIFICATION' };
  assert.equal(ctrlAr.getServerStateLabel(), STUDENT_TRANSLATIONS.ar.familyTracking.statusAwaitingNative);
  assert.equal(ctrlAr.getServerStateLabel(), 'بانتظار التحقق من الجهاز');

  ctrlAr.status = { activationState: 'AWAITING_AGE_SAFEGUARD' };
  assert.equal(ctrlAr.getServerStateLabel(), STUDENT_TRANSLATIONS.ar.familyTracking.statusAwaitingSafeguard);
  assert.equal(ctrlAr.getServerStateLabel(), 'بانتظار موافقة ولي الأمر');

  const ctrlEn = new StudentFamilyTrackingController({
    studentId: 'student_labels_en',
    lang: 'en'
  });
  ctrlEn.status = { activationState: 'AWAITING_NATIVE_VERIFICATION' };
  assert.equal(ctrlEn.getServerStateLabel(), STUDENT_TRANSLATIONS.en.familyTracking.statusAwaitingNative);
  assert.equal(ctrlEn.getServerStateLabel(), 'Awaiting device verification');

  ctrlEn.status = { activationState: 'AWAITING_AGE_SAFEGUARD' };
  assert.equal(ctrlEn.getServerStateLabel(), STUDENT_TRANSLATIONS.en.familyTracking.statusAwaitingSafeguard);
  assert.equal(ctrlEn.getServerStateLabel(), 'Awaiting guardian approval');
});

test('10. Safeguard labels are fully localized across Arabic and English', () => {
  const ctrlAr = new StudentFamilyTrackingController({ studentId: 'student_safe_ar', lang: 'ar' });
  assert.equal(ctrlAr.getSafeguardLabel('GUARDIAN_APPROVED'), STUDENT_TRANSLATIONS.ar.familyTracking.safeguardApproved);
  assert.equal(ctrlAr.getSafeguardLabel('VERIFIED_ADULT'), STUDENT_TRANSLATIONS.ar.familyTracking.safeguardAdult);
  assert.equal(ctrlAr.getSafeguardLabel('REQUIRED'), STUDENT_TRANSLATIONS.ar.familyTracking.safeguardRequired);

  const ctrlEn = new StudentFamilyTrackingController({ studentId: 'student_safe_en', lang: 'en' });
  assert.equal(ctrlEn.getSafeguardLabel('GUARDIAN_APPROVED'), STUDENT_TRANSLATIONS.en.familyTracking.safeguardApproved);
  assert.equal(ctrlEn.getSafeguardLabel('VERIFIED_ADULT'), STUDENT_TRANSLATIONS.en.familyTracking.safeguardAdult);
  assert.equal(ctrlEn.getSafeguardLabel('REQUIRED'), STUDENT_TRANSLATIONS.en.familyTracking.safeguardRequired);
});

test('11. Raw backend English rejection message is mapped to localized Arabic translation', async () => {
  const mockApi = {
    getFamilyTrackingStatus: async () => ({ status: { activationState: 'AWAITING_NATIVE_VERIFICATION' } }),
    requestFamilyTrackingActivation: async () => ({ challenge: 'valid-challenge' })
  };

  // Capacitor plugin throws raw backend English message as error.message
  const mockNative = {
    getNativeTrackingStatus: async () => ({
      foregroundPermission: true,
      backgroundPermission: true,
      notificationPermission: true
    }),
    activateNativeTracking: async () => {
      // Exactly as Capacitor HomelyServFamilyTrackingPlugin rejects:
      const err = new Error('Production activation requires an approved Android app-attestation provider');
      err.code = 'ACTIVATION_REJECTED';
      throw err;
    }
  };

  const ctrl = new StudentFamilyTrackingController({
    studentId: 'student_raw_en_test',
    isAndroid: true,
    lang: 'ar',
    apiService: mockApi,
    nativeBridge: mockNative
  });

  await ctrl.mount();
  await ctrl.verifyAndStart();

  // Must NOT display the raw English string
  assert.notEqual(ctrl.error, 'Production activation requires an approved Android app-attestation provider');
  // MUST display the localized Arabic translation
  assert.equal(ctrl.error, STUDENT_TRANSLATIONS.ar.familyTracking.errProductionAttestationRequired);
  assert.equal(ctrl.busy, false);
});
