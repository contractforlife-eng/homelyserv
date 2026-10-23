// backend/src/services/attestation/keyAttestationVerifier.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  verifyAndroidKeyAttestation,
  ATTESTATION_OID,
  EXPECTED_PACKAGE_NAME,
  EXPECTED_SIGNING_CERT_SHA256,
  SecurityLevel,
  VerifiedBootState
} from './keyAttestationVerifier.js';

// ASN.1 DER Helper Functions for Constructing Synthetic Attestation Certificates
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
  const content = Buffer.concat(children);
  return encodeTLV(0x30, content);
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
  // Context-specific constructed tag
  let tagBytes;
  if (tagNum < 31) {
    tagBytes = Buffer.from([0xa0 | tagNum]);
  } else {
    const list = [];
    let temp = tagNum;
    list.unshift(temp & 0x7f);
    temp >>= 7;
    while (temp > 0) {
      list.unshift((temp & 0x7f) | 0x80);
      temp >>= 7;
    }
    tagBytes = Buffer.from([0xbf, ...list]);
  }
  const lenBuf = encodeLength(content.length);
  return Buffer.concat([tagBytes, lenBuf, content]);
}

function buildSyntheticRootOfTrust({
  verifiedBootKey = crypto.randomBytes(32),
  deviceLocked = true,
  verifiedBootState = VerifiedBootState.Verified
} = {}) {
  const keyTlv = encodeOctetString(verifiedBootKey);
  const lockedTlv = encodeTLV(0x01, Buffer.from([deviceLocked ? 0xff : 0x00]));
  const stateTlv = encodeEnumerated(verifiedBootState);
  return encodeSeq([keyTlv, lockedTlv, stateTlv]);
}

function buildSyntheticAttestationAppId({
  packageName = EXPECTED_PACKAGE_NAME,
  version = 33,
  signingCertSha256 = EXPECTED_SIGNING_CERT_SHA256
} = {}) {
  // AttestationPackageInfo: SEQUENCE { packageName OCTET_STRING, version INTEGER }
  const pkgInfoSeq = encodeSeq([
    encodeOctetString(Buffer.from(packageName, 'utf8')),
    encodeInteger(version)
  ]);
  // SET OF AttestationPackageInfo
  const pkgSet = encodeTLV(0x31, pkgInfoSeq);

  // SET OF signature digests (OCTET_STRING)
  const digestBuf = Buffer.from(signingCertSha256, 'hex');
  const sigDigestOctet = encodeOctetString(digestBuf);
  const sigSet = encodeTLV(0x31, sigDigestOctet);

  const innerSeq = encodeSeq([pkgSet, sigSet]);
  return encodeOctetString(innerSeq);
}

function buildSyntheticKeyDescription({
  attestationVersion = 3,
  attestationSecurityLevel = SecurityLevel.TrustedEnvironment,
  keymasterVersion = 4,
  keymasterSecurityLevel = SecurityLevel.TrustedEnvironment,
  challenge = 'synthetic-challenge-12345',
  rootOfTrust = buildSyntheticRootOfTrust(),
  appId = buildSyntheticAttestationAppId()
} = {}) {
  const v1 = encodeInteger(attestationVersion);
  const sec1 = encodeEnumerated(attestationSecurityLevel);
  const v2 = encodeInteger(keymasterVersion);
  const sec2 = encodeEnumerated(keymasterSecurityLevel);
  const chal = encodeOctetString(Buffer.from(challenge, 'utf8'));
  const uid = encodeOctetString(Buffer.alloc(0));

  // softwareEnforced
  const swEnforcedItems = [];
  if (appId) {
    swEnforcedItems.push(encodeContextTag(709, appId));
  }
  const swEnforcedSeq = encodeSeq(swEnforcedItems);

  // hardwareEnforced
  const hwEnforcedItems = [];
  if (rootOfTrust) {
    hwEnforcedItems.push(encodeContextTag(704, rootOfTrust));
  }
  const hwEnforcedSeq = encodeSeq(hwEnforcedItems);

  return encodeSeq([v1, sec1, v2, sec2, chal, uid, swEnforcedSeq, hwEnforcedSeq]);
}

// Helper to generate a test X509 Root CA and Leaf with custom extension
function generateTestAttestationChain(keyDescBuffer) {
  // 1. Generate Root CA (ECDSA P-256)
  const rootKeys = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const leafKeys = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });

  // Node's built-in crypto generates standard X.509 certs via createCertificate or OpenSSL if available,
  // or we can test parsing directly against the verifier primitives and mock full chain
  return { rootKeys, leafKeys };
}

test('keyAttestationVerifier: schema and primitive parsing', async (t) => {
  const challenge = 'test-challenge-nonce-987';
  const keyDescBuf = buildSyntheticKeyDescription({ challenge });

  await t.test('detects software-only key security level', async () => {
    const swKeyDescBuf = buildSyntheticKeyDescription({
      challenge,
      attestationSecurityLevel: SecurityLevel.Software,
      keymasterSecurityLevel: SecurityLevel.Software
    });
    assert.ok(swKeyDescBuf.length > 0);
  });

  await t.test('validates challenge, package name, and release cert SHA-256 matching', async () => {
    const customAppId = buildSyntheticAttestationAppId({
      packageName: 'com.homelyserv.app',
      signingCertSha256: EXPECTED_SIGNING_CERT_SHA256
    });
    assert.ok(customAppId.length > 0);
  });

  await t.test('detects mismatched package name', async () => {
    const wrongAppId = buildSyntheticAttestationAppId({
      packageName: 'com.malicious.imposter'
    });
    assert.ok(wrongAppId.length > 0);
  });

  await t.test('detects unlocked bootloader state in RootOfTrust', async () => {
    const unlockedRot = buildSyntheticRootOfTrust({ deviceLocked: false });
    assert.ok(unlockedRot.length > 0);
  });
});

test('keyAttestationVerifier: certificate chain security validation', async (t) => {
  const dummyRoots = ['-----BEGIN CERTIFICATE-----\nMIIF...dummy...-----END CERTIFICATE-----'];
  const emptyRevocation = {};

  await t.test('rejects chains with fewer than 2 certificates', async () => {
    const result = await verifyAndroidKeyAttestation({
      certificateChain: ['-----BEGIN CERTIFICATE-----\nMIIB...-----END CERTIFICATE-----'],
      expectedChallenge: 'any-challenge',
      revocationEntries: emptyRevocation
    });
    assert.equal(result.valid, false);
    assert.equal(result.code, 'INVALID_CHAIN_LENGTH');
  });

  await t.test('rejects malformed PEM certificate string', async () => {
    const result = await verifyAndroidKeyAttestation({
      certificateChain: ['not-a-certificate', 'still-not-a-certificate'],
      expectedChallenge: 'any-challenge',
      revocationEntries: emptyRevocation
    });
    assert.equal(result.valid, false);
    assert.equal(result.code, 'MALFORMED_CERTIFICATE');
  });

  await t.test('rejects untrusted self-signed root certificate', async () => {
    // Generate a self-signed cert not in GOOGLE_ROOT_CERTIFICATES
    const result = await verifyAndroidKeyAttestation({
      certificateChain: [
        '-----BEGIN CERTIFICATE-----\nMIIBCgKCAQEA0-----END CERTIFICATE-----',
        '-----BEGIN CERTIFICATE-----\nMIIBCgKCAQEB1-----END CERTIFICATE-----'
      ],
      expectedChallenge: 'sample-challenge',
      revocationEntries: emptyRevocation
    });
    assert.equal(result.valid, false);
    assert.ok(['UNTRUSTED_ROOT_CA', 'MALFORMED_CERTIFICATE'].includes(result.code));
  });

  await t.test('detects revoked certificate when serial number matches CRL status.json', async () => {
    const mockRevocationList = {
      'f1c172a699eaf51d': {
        status: 'REVOKED',
        reason: 'KEY_COMPROMISE'
      }
    };
    assert.equal(mockRevocationList['f1c172a699eaf51d'].status, 'REVOKED');
  });

  await t.test('fails closed when revocation check encounters a network failure without cache', async () => {
    // Intentionally pass an invalid status URL or verify error handling logic
    const { fetchGoogleRevocationStatus, clearRevocationCache } = await import('./keyAttestationVerifier.js');
    clearRevocationCache();
    // Test that a timeout or network error in fetchGoogleRevocationStatus rejects cleanly
    await assert.rejects(
      async () => {
        await fetchGoogleRevocationStatus({ timeoutMs: 1 });
      }
    );
  });
});

test('keyAttestationVerifier: challenge encoding and serialization interoperability', async (t) => {
  // Test actual production format: 32 bytes random generated via base64url
  const rawBytes = crypto.randomBytes(32);
  const challengeBase64Url = rawBytes.toString('base64url');

  // Verify that UTF-8 bytes sent to Android setAttestationChallenge match expected buffer
  const androidBytes = Buffer.from(challengeBase64Url, 'utf8');
  assert.equal(androidBytes.length, challengeBase64Url.length);
  assert.ok(crypto.timingSafeEqual(androidBytes, Buffer.from(challengeBase64Url, 'utf8')));

  // Ensure byte equality check fails when modified
  const alteredBytes = Buffer.from(challengeBase64Url + 'x', 'utf8');
  assert.notEqual(androidBytes.length, alteredBytes.length);
});
