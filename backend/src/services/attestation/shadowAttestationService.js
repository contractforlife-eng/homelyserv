// backend/src/services/attestation/shadowAttestationService.js
// ============================================================
// STAGE 1: SAFE PRODUCTION SHADOW ATTESTATION SERVICE
// ============================================================
// Cryptographically inspects incoming Android hardware attestation proofs
// without enabling tracking, modifying activation state, or bypassing the
// production HTTP 503 activation gate.
//
// INVARIANTS:
// 1. Default OFF: Only runs if SHADOW_ATTESTATION_PILOT_ENABLED === 'true'.
// 2. Narrow Scoping: Only runs if studentId is listed in SHADOW_ATTESTATION_PILOT_STUDENT_IDS.
// 3. Fail-Closed / Isolated: Bounded timeout, never throws to caller.
// 4. Never Consumes Challenge: Does not clear or modify activationChallengeHash.
// 5. Never Activates: Never sets activationState = 'ACTIVE' or collectionEnabled = true.
// 6. Sanitized Telemetry: No PII, keys, challenges, signatures, or certs logged.
// ============================================================

import crypto from 'node:crypto';
import { verifyAndroidKeyAttestation } from './keyAttestationVerifier.js';

const SHADOW_TIMEOUT_MS = 6000; // Hard bounded execution
const MAX_CERT_CHAIN_LENGTH = 10;
const MAX_CERT_STRING_LENGTH = 8192;

/**
 * Checks whether the shadow attestation pilot is enabled for a given student
 */
export const isShadowPilotEligible = (studentId) => {
  if (process.env.SHADOW_ATTESTATION_PILOT_ENABLED !== 'true') {
    return false;
  }
  if (!studentId || typeof studentId !== 'string') {
    return false;
  }
  const rawList = process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS || '';
  const allowedIds = rawList
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  return allowedIds.includes(studentId);
};

/**
 * Sanitized audit logger for shadow attestation events
 */
const logShadowAudit = (entry) => {
  const safeLog = {
    tag: 'SHADOW_ATTESTATION_AUDIT',
    correlationId: entry.correlationId,
    timestamp: new Date().toISOString(),
    stage: entry.stage,
    outcome: entry.outcome, // 'PASS' | 'FAIL' | 'SKIPPED' | 'TIMEOUT'
    code: entry.code || 'NONE',
    durationMs: entry.durationMs || 0,
    attestationSecurityLevel: entry.attestationSecurityLevel || undefined,
    keymasterSecurityLevel: entry.keymasterSecurityLevel || undefined,
    deviceLocked: entry.deviceLocked !== undefined ? entry.deviceLocked : undefined
  };
  // Emits single-line JSON log without sensitive data
  console.log(JSON.stringify(safeLog));
};

/**
 * Executes isolated shadow attestation verification
 */
export const executeShadowAttestation = async ({
  studentId,
  requestBody,
  setting,
  hasActiveGuardianResult,
  nativeProofVersion = 'android-native-v1'
}) => {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();

  // 1. Check scoping
  if (!isShadowPilotEligible(studentId)) {
    return {
      executed: false,
      reason: 'NOT_ELIGIBLE',
      correlationId
    };
  }

  // 2. Wrap execution in strict timeout with AbortController to prevent hanging the request
  const abortController = new globalThis.AbortController();
  const { signal } = abortController;
  let settled = false;

  let timeoutHandle;
  const timeoutPromise = new Promise((resolve) => {
    timeoutHandle = setTimeout(() => {
      if (!settled) {
        settled = true;
        abortController.abort();
        resolve({
          valid: false,
          code: 'SHADOW_TIMEOUT',
          stage: 'TIMEOUT'
        });
      }
    }, SHADOW_TIMEOUT_MS);
  });

  const verificationPromise = (async () => {
    try {
      if (signal.aborted) {
        return { valid: false, code: 'SHADOW_ABORTED', stage: 'ABORT' };
      }

      // Step A: Guardian Safeguard verification
      if (!hasActiveGuardianResult) {
        return { valid: false, code: 'NO_ACTIVE_GUARDIAN', stage: 'GUARDIAN_CHECK' };
      }

      // Step B: Basic Request Structure & limits
      const { challenge, publicKey, signature, permissionStatus, proofVersion, certificateChain } = requestBody || {};
      if (proofVersion !== nativeProofVersion || permissionStatus !== 'GRANTED_BACKGROUND'
        || typeof challenge !== 'string' || typeof publicKey !== 'string' || typeof signature !== 'string') {
        return { valid: false, code: 'INVALID_PAYLOAD_STRUCTURE', stage: 'STRUCTURE_CHECK' };
      }

      if (!Array.isArray(certificateChain) || certificateChain.length < 2 || certificateChain.length > MAX_CERT_CHAIN_LENGTH) {
        return { valid: false, code: 'INVALID_CHAIN_BOUNDS', stage: 'CERT_CHAIN_CHECK' };
      }

      for (const cert of certificateChain) {
        if (typeof cert !== 'string' || cert.length > MAX_CERT_STRING_LENGTH) {
          return { valid: false, code: 'MALFORMED_CERT_ELEMENT', stage: 'CERT_CHAIN_CHECK' };
        }
      }

      // Step C: Challenge binding and expiry against database setting
      if (!setting || setting.activationState !== 'AWAITING_NATIVE_VERIFICATION'
        || !['VERIFIED_ADULT', 'GUARDIAN_APPROVED'].includes(setting.ageSafeguardStatus)
        || !setting.activationChallengeExpiresAt || setting.activationChallengeExpiresAt <= new Date()) {
        return { valid: false, code: 'CHALLENGE_EXPIRED_OR_STATE_INVALID', stage: 'CHALLENGE_CHECK' };
      }

      const challengeHash = crypto.createHash('sha256').update(challenge).digest('hex');
      if (setting.activationChallengeHash !== challengeHash) {
        return { valid: false, code: 'CHALLENGE_HASH_MISMATCH', stage: 'CHALLENGE_CHECK' };
      }

      if (signal.aborted) {
        return { valid: false, code: 'SHADOW_ABORTED', stage: 'ABORT' };
      }

      // Step D: Device Hardware Attestation Cryptographic Verification
      const attestationResult = await verifyAndroidKeyAttestation({
        certificateChain,
        expectedChallenge: challenge
      });

      if (signal.aborted) {
        return { valid: false, code: 'SHADOW_ABORTED', stage: 'ABORT' };
      }

      if (!attestationResult.valid) {
        return {
          valid: false,
          code: attestationResult.code || 'ATTESTATION_FAILED',
          stage: 'HARDWARE_ATTESTATION'
        };
      }

      // Step E: Native Signature verification (Key binding)
      const payload = `${nativeProofVersion}\n${studentId}\n${challenge}\n${permissionStatus}`;
      let signatureVerified = false;
      try {
        signatureVerified = crypto.verify(
          'sha256',
          Buffer.from(payload),
          crypto.createPublicKey(publicKey),
          Buffer.from(signature, 'base64')
        );
      } catch {
        signatureVerified = false;
      }

      if (!signatureVerified) {
        return { valid: false, code: 'INVALID_NATIVE_SIGNATURE', stage: 'SIGNATURE_CHECK' };
      }

      // Step F: Public key match with leaf certificate in attestation chain
      try {
        const leafCert = new crypto.X509Certificate(certificateChain[0]);
        const leafSpki = leafCert.publicKey.export({ type: 'spki', format: 'pem' });
        const requestSpki = crypto.createPublicKey(publicKey).export({ type: 'spki', format: 'pem' });
        if (leafSpki !== requestSpki) {
          return { valid: false, code: 'ATTESTATION_KEY_MISMATCH', stage: 'KEY_BINDING_CHECK' };
        }
      } catch {
        return { valid: false, code: 'PUBLIC_KEY_PARSE_FAILED', stage: 'KEY_BINDING_CHECK' };
      }

      return {
        valid: true,
        code: 'SUCCESS',
        stage: 'COMPLETE',
        attestationSecurityLevel: attestationResult.attestationSecurityLevel,
        keymasterSecurityLevel: attestationResult.keymasterSecurityLevel,
        deviceLocked: attestationResult.rootOfTrust?.deviceLocked
      };
    } catch {
      return {
        valid: false,
        code: 'UNEXPECTED_ERROR',
        stage: 'EXECUTION'
      };
    }
  })();

  // Guarantee single settlement and zero unhandled rejections
  const outcome = await Promise.race([
    verificationPromise.then((res) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutHandle);
        return res;
      }
      return null;
    }).catch(() => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutHandle);
        return { valid: false, code: 'UNEXPECTED_ERROR', stage: 'EXECUTION' };
      }
      return null;
    }),
    timeoutPromise
  ]);

  clearTimeout(timeoutHandle);
  if (!outcome) {
    // Late resolution after timeout; already settled and logged
    return { executed: true, correlationId, valid: false, code: 'SHADOW_TIMEOUT', durationMs: Date.now() - startTime };
  }

  const durationMs = Date.now() - startTime;
  logShadowAudit({
    correlationId,
    stage: outcome.stage,
    outcome: outcome.valid ? 'PASS' : 'FAIL',
    code: outcome.code,
    durationMs,
    attestationSecurityLevel: outcome.attestationSecurityLevel,
    keymasterSecurityLevel: outcome.keymasterSecurityLevel,
    deviceLocked: outcome.deviceLocked
  });

  return {
    executed: true,
    correlationId,
    valid: outcome.valid,
    code: outcome.code,
    durationMs
  };
};

export default {
  isShadowPilotEligible,
  executeShadowAttestation
};
