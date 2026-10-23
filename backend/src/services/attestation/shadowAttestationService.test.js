// backend/src/services/attestation/shadowAttestationService.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  isShadowPilotEligible,
  executeShadowAttestation
} from './shadowAttestationService.js';
import {
  ATTESTATION_OID,
  EXPECTED_PACKAGE_NAME,
  EXPECTED_SIGNING_CERT_SHA256,
  SecurityLevel,
  VerifiedBootState
} from './keyAttestationVerifier.js';

// ASN.1 DER Helper Functions for Generating Valid Test Chains
function encodeLength(len) {
  if (len < 128) return Buffer.from([len]);
  const bytes = [];
  let temp = len;
  while (temp > 0) {
    bytes.unshift(temp & 0xff);
    temp >>= 8;
  }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

function encodeTLV(tag, value) {
  const lenBuf = encodeLength(value.length);
  return Buffer.concat([Buffer.from([tag]), lenBuf, value]);
}

function encodeSeq(children) {
  return encodeTLV(0x30, Buffer.concat(children));
}

function encodeOctetString(buf) {
  return encodeTLV(0x04, buf);
}

function encodeInteger(num) {
  if (num === 0) return Buffer.from([0x02, 0x01, 0x00]);
  const bytes = [];
  let temp = num;
  while (temp > 0) {
    bytes.unshift(temp & 0xff);
    temp >>= 8;
  }
  if (bytes[0] & 0x80) bytes.unshift(0x00);
  return encodeTLV(0x02, Buffer.from(bytes));
}

function encodeEnumerated(num) {
  return Buffer.from([0x0a, 0x01, num & 0xff]);
}

function encodeContextTag(tagNum, content) {
  return encodeTLV(0xa0 | tagNum, content);
}

function buildSyntheticKeyDescription({
  challenge,
  packageName = EXPECTED_PACKAGE_NAME,
  certSha256 = EXPECTED_SIGNING_CERT_SHA256,
  attestationLevel = SecurityLevel.TrustedEnvironment,
  keymasterLevel = SecurityLevel.TrustedEnvironment,
  deviceLocked = true,
  verifiedBootState = VerifiedBootState.Verified
}) {
  const attestationVersion = encodeInteger(4);
  const attestationSecurityLevel = encodeEnumerated(attestationLevel);
  const keymasterVersion = encodeInteger(4);
  const keymasterSecurityLevel = encodeEnumerated(keymasterLevel);
  const attestationChallenge = encodeOctetString(Buffer.from(challenge, 'utf8'));
  const uniqueId = encodeOctetString(Buffer.alloc(0));

  const pkgInfoSeq = encodeSeq([
    encodeTLV(0x1a, Buffer.from(packageName, 'utf8')),
    encodeInteger(10034)
  ]);
  const pkgInfoSet = encodeTLV(0x31, pkgInfoSeq);
  const sigDigestsSet = encodeTLV(0x31, encodeOctetString(Buffer.from(certSha256, 'hex')));

  const attestationAppIdSeq = encodeSeq([pkgInfoSet, sigDigestsSet]);
  const attestationAppIdDer = encodeContextTag(709, encodeOctetString(attestationAppIdSeq));

  const rootOfTrustSeq = encodeSeq([
    encodeOctetString(crypto.randomBytes(32)),
    Buffer.from([0x01, 0x01, deviceLocked ? 0xff : 0x00]),
    encodeEnumerated(verifiedBootState),
    encodeOctetString(crypto.randomBytes(32))
  ]);
  const rootOfTrustDer = encodeContextTag(704, rootOfTrustSeq);

  const softwareEnforced = encodeSeq([]);
  const teeEnforced = encodeSeq([attestationAppIdDer, rootOfTrustDer]);

  return encodeSeq([
    attestationVersion,
    attestationSecurityLevel,
    keymasterVersion,
    keymasterSecurityLevel,
    attestationChallenge,
    uniqueId,
    softwareEnforced,
    teeEnforced
  ]);
}

function createSyntheticCertChain(challenge) {
  const rootKeys = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const leafKeys = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });

  const rootCert = crypto.X509Certificate.from({
    subject: 'CN=Google Attestation Root CA',
    issuer: 'CN=Google Attestation Root CA',
    publicKey: rootKeys.publicKey,
    privateKey: rootKeys.privateKey,
    days: 365,
    serial: '01'
  });

  const keyDescDer = buildSyntheticKeyDescription({ challenge });
  const leafCert = crypto.X509Certificate.from({
    subject: 'CN=Android Keystore Key',
    issuer: 'CN=Google Attestation Root CA',
    publicKey: leafKeys.publicKey,
    privateKey: rootKeys.privateKey,
    days: 365,
    serial: '02',
    extensions: [
      {
        oid: ATTESTATION_OID,
        critical: false,
        value: keyDescDer
      }
    ]
  });

  return {
    leafKeys,
    rootKeys,
    leafCertPem: leafCert.toString(),
    rootCertPem: rootCert.toString(),
    certificateChain: [leafCert.toString(), rootCert.toString()]
  };
}

test('1. Pilot is Default OFF when environment variables are unset', () => {
  const oldEnabled = process.env.SHADOW_ATTESTATION_PILOT_ENABLED;
  const oldIds = process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS;
  delete process.env.SHADOW_ATTESTATION_PILOT_ENABLED;
  delete process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS;

  assert.equal(isShadowPilotEligible('student_123'), false);
  assert.equal(isShadowPilotEligible(null), false);
  assert.equal(isShadowPilotEligible(''), false);

  process.env.SHADOW_ATTESTATION_PILOT_ENABLED = oldEnabled;
  process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS = oldIds;
});

test('2. Pilot only allows explicitly listed student IDs', () => {
  process.env.SHADOW_ATTESTATION_PILOT_ENABLED = 'true';
  process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS = 'student_pilot_1, student_pilot_2 ';

  assert.equal(isShadowPilotEligible('student_pilot_1'), true);
  assert.equal(isShadowPilotEligible('student_pilot_2'), true);
  assert.equal(isShadowPilotEligible('student_unauthorized'), false);
  assert.equal(isShadowPilotEligible(''), false);

  delete process.env.SHADOW_ATTESTATION_PILOT_ENABLED;
  delete process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS;
});

test('3. Unauthorized accounts are skipped and never executed', async () => {
  process.env.SHADOW_ATTESTATION_PILOT_ENABLED = 'true';
  process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS = 'student_pilot_1';

  const result = await executeShadowAttestation({
    studentId: 'student_other',
    requestBody: {},
    setting: {},
    hasActiveGuardianResult: true
  });

  assert.equal(result.executed, false);
  assert.equal(result.reason, 'NOT_ELIGIBLE');

  delete process.env.SHADOW_ATTESTATION_PILOT_ENABLED;
  delete process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS;
});

test('4. Shadow verification fails gracefully on expired or invalid challenges', async () => {
  process.env.SHADOW_ATTESTATION_PILOT_ENABLED = 'true';
  process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS = 'student_pilot_1';

  // Case A: Expired challenge
  const expiredSetting = {
    activationState: 'AWAITING_NATIVE_VERIFICATION',
    ageSafeguardStatus: 'VERIFIED_ADULT',
    activationChallengeExpiresAt: new Date(Date.now() - 1000), // in the past
    activationChallengeHash: 'somehash'
  };

  const resExpired = await executeShadowAttestation({
    studentId: 'student_pilot_1',
    requestBody: {
      proofVersion: 'android-native-v1',
      permissionStatus: 'GRANTED_BACKGROUND',
      challenge: 'chal',
      publicKey: 'pub',
      signature: 'sig',
      certificateChain: ['cert1', 'cert2']
    },
    setting: expiredSetting,
    hasActiveGuardianResult: true
  });

  assert.equal(resExpired.executed, true);
  assert.equal(resExpired.valid, false);
  assert.equal(resExpired.code, 'CHALLENGE_EXPIRED_OR_STATE_INVALID');

  // Case B: Challenge hash mismatch
  const validTimeSetting = {
    activationState: 'AWAITING_NATIVE_VERIFICATION',
    ageSafeguardStatus: 'VERIFIED_ADULT',
    activationChallengeExpiresAt: new Date(Date.now() + 60000),
    activationChallengeHash: crypto.createHash('sha256').update('expected_chal').digest('base64url')
  };

  const resMismatch = await executeShadowAttestation({
    studentId: 'student_pilot_1',
    requestBody: {
      proofVersion: 'android-native-v1',
      permissionStatus: 'GRANTED_BACKGROUND',
      challenge: 'wrong_chal',
      publicKey: 'pub',
      signature: 'sig',
      certificateChain: ['cert1', 'cert2']
    },
    setting: validTimeSetting,
    hasActiveGuardianResult: true
  });

  assert.equal(resMismatch.executed, true);
  assert.equal(resMismatch.valid, false);
  assert.equal(resMismatch.code, 'CHALLENGE_HASH_MISMATCH');

  delete process.env.SHADOW_ATTESTATION_PILOT_ENABLED;
  delete process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS;
});

test('5. Shadow verification NEVER consumes or mutates the challenge or activationState', async () => {
  process.env.SHADOW_ATTESTATION_PILOT_ENABLED = 'true';
  process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS = 'student_pilot_1';

  const originalChallengeHash = crypto.createHash('sha256').update('test_challenge').digest('base64url');
  const originalExpiresAt = new Date(Date.now() + 60000);
  const setting = {
    activationState: 'AWAITING_NATIVE_VERIFICATION',
    ageSafeguardStatus: 'VERIFIED_ADULT',
    activationChallengeHash: originalChallengeHash,
    activationChallengeExpiresAt: originalExpiresAt,
    collectionEnabled: false
  };

  await executeShadowAttestation({
    studentId: 'student_pilot_1',
    requestBody: {
      proofVersion: 'android-native-v1',
      permissionStatus: 'GRANTED_BACKGROUND',
      challenge: 'test_challenge',
      publicKey: 'pub',
      signature: 'sig',
      certificateChain: ['cert1', 'cert2']
    },
    setting,
    hasActiveGuardianResult: true
  });

  // Assert setting object was not mutated
  assert.equal(setting.activationChallengeHash, originalChallengeHash, 'Challenge hash must remain unconsumed');
  assert.equal(setting.activationChallengeExpiresAt, originalExpiresAt, 'Challenge expiry must remain untouched');
  assert.equal(setting.activationState, 'AWAITING_NATIVE_VERIFICATION', 'State must not transition to ACTIVE');
  assert.equal(setting.collectionEnabled, false, 'Collection must remain disabled');

  delete process.env.SHADOW_ATTESTATION_PILOT_ENABLED;
  delete process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS;
});

test('6. Sanitized logging excludes keys, challenges, signatures, and certificates', async () => {
  process.env.SHADOW_ATTESTATION_PILOT_ENABLED = 'true';
  process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS = 'student_pilot_1';

  const loggedLines = [];
  const originalLog = console.log;
  console.log = (msg) => {
    loggedLines.push(msg);
  };

  const sensitiveChallenge = 'super-secret-challenge-xyz-987';
  const sensitiveSig = 'base64-secret-signature-abc-123';
  const sensitiveKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----';

  try {
    await executeShadowAttestation({
      studentId: 'student_pilot_1',
      requestBody: {
        proofVersion: 'android-native-v1',
        permissionStatus: 'GRANTED_BACKGROUND',
        challenge: sensitiveChallenge,
        publicKey: sensitiveKey,
        signature: sensitiveSig,
        certificateChain: ['cert1', 'cert2']
      },
      setting: null,
      hasActiveGuardianResult: true
    });
  } finally {
    console.log = originalLog;
  }

  assert.ok(loggedLines.length > 0, 'Audit log must be emitted');
  const logStr = loggedLines.join(' ');

  assert.ok(!logStr.includes(sensitiveChallenge), 'Challenge must be excluded from logs');
  assert.ok(!logStr.includes(sensitiveSig), 'Signature must be excluded from logs');
  assert.ok(!logStr.includes('BEGIN PUBLIC KEY'), 'Public key must be excluded from logs');
  assert.ok(logStr.includes('SHADOW_ATTESTATION_AUDIT'), 'Must contain audit tag');
  assert.ok(logStr.includes('correlationId'), 'Must contain correlation ID');

  delete process.env.SHADOW_ATTESTATION_PILOT_ENABLED;
  delete process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS;
});
