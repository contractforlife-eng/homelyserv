// frontend/src/utils/studentFamilyTrackingBehavior.test.js
// ============================================================
// Focused behavioral regression tests for StudentFamilyTracking:
// 1. Production HTTP 503 displays the localized PRODUCTION_DEVICE_ATTESTATION_REQUIRED message.
// 2. A request timeout displays an error and releases the loading state.
// 3. Failed activation always resets the spinner (busy state).
// 4. Reopening/focusing the page refreshes the actual server status.
// 5. ACTIVE is never displayed unless the backend confirms activation.
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
 * Controller simulation embodying the StudentFamilyTracking component logic
 * exactly as implemented in frontend/src/pages/StudentFamilyTracking.jsx
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

    // Activation error messages lookup (matching StudentFamilyTracking.jsx line 74)
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

  // refresh callback
  async refresh() {
    if (!this.studentId) return;
    try {
      const response = await this.api.getFamilyTrackingStatus(this.studentId);
      this.status = response.status;
      if (this.android) {
        this.nativeStatus = await this.native.getNativeTrackingStatus();
      }
    } catch (requestError) {
      this.error = requestError?.response?.data?.message || this.t('familyTracking.errRequiresGuardian');
    }
  }

  // verifyAndStart action
  async verifyAndStart() {
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
        apiBase: 'http://localhost:5000',
        challenge: nativeChallenge
      });
      this.notice = this.t('familyTracking.activeNotice');
      await this.refresh();
    } catch (activationError) {
      // Surface backend error codes through the native bridge
      const errorCode = activationError?.code || activationError?.response?.data?.code;
      const backendMessage = this.activationErrorMessages[errorCode];
      this.error = backendMessage || activationError?.message || this.t('familyTracking.errVerificationFailed');
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
      case 'DISABLED':
        return this.t('familyTracking.statusNotActivated');
      default:
        return state || this.t('familyTracking.statusUnavailable');
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

test('4. Reopening or focusing the page refreshes the actual server status', async () => {
  let serverFetchCount = 0;
  let currentServerState = 'DISABLED';

  const mockApi = {
    getFamilyTrackingStatus: async () => {
      serverFetchCount++;
      return { status: { activationState: currentServerState, ageSafeguardStatus: 'GUARDIAN_APPROVED' } };
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

  // Initial mount triggers 1st refresh
  await ctrl.mount();
  assert.equal(serverFetchCount, 1);
  assert.equal(ctrl.status?.activationState, 'DISABLED');
  assert.equal(ctrl.getServerStateLabel(), 'Not activated');

  // External guardian approves and backend transitions state out-of-band
  currentServerState = 'AWAITING_NATIVE_VERIFICATION';

  // Window receives focus event (user switches back to the app / tab)
  ctrl.triggerEvent('focus');
  // allow microtask resolution
  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.equal(serverFetchCount, 2, 'Focus must trigger an immediate status refresh from server');
  assert.equal(ctrl.status?.activationState, 'AWAITING_NATIVE_VERIFICATION');

  // External action finishes
  currentServerState = 'ACTIVE';

  // Document visibility changes to visible
  ctrl.triggerEvent('visibilitychange');
  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.equal(serverFetchCount, 3, 'Visibility change must trigger an immediate status refresh from server');
  assert.equal(ctrl.status?.activationState, 'ACTIVE');
  assert.equal(ctrl.getServerStateLabel(), 'Active on student device');

  ctrl.unmount();
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

  // Case C: Client is awaiting native verification or safeguard approval
  const ctrlAwaiting = new StudentFamilyTrackingController({
    studentId: 'test_c',
    lang: 'en'
  });
  ctrlAwaiting.status = { activationState: 'AWAITING_NATIVE_VERIFICATION' };
  assert.notEqual(ctrlAwaiting.getServerStateLabel(), activeLabel);
  assert.equal(ctrlAwaiting.getServerStateLabel(), 'AWAITING_NATIVE_VERIFICATION');

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
