// backend/src/services/attestation/keyAttestationVerifier.js
// ============================================================
// ANDROID KEYSTORE HARDWARE-BACKED ATTESTATION VERIFIER
// ============================================================
// Verifies genuine Android application and hardware-backed key attestation
// in accordance with Google Android Key Attestation (Keymaster / KeyMint) specifications.
//
// Extension OID: 1.3.6.1.4.1.11129.2.1.17 (KeyDescription)
// Pinned Roots: Google Key Attestation Root Certificates (RSA & EC)
// ============================================================

import crypto from 'node:crypto';

export const ATTESTATION_OID = '1.3.6.1.4.1.11129.2.1.17';
export const EXPECTED_PACKAGE_NAME = 'com.homelyserv.app';
export const EXPECTED_SIGNING_CERT_SHA256 = 'b52c2b1a9d4510993219b60b138530583e4ca29274cc32690f44f2f233674c50'.toLowerCase();

// Official Google Key Attestation Root Certificates (pinned)
// Fetched and verified from https://android.googleapis.com/attestation/root
export const GOOGLE_ROOT_CERTIFICATES = [
  // Google Hardware Attestation Root (RSA 4096)
  `-----BEGIN CERTIFICATE-----
MIIFHDCCAwSgAwIBAgIJAPHBcqaZ6vUdMA0GCSqGSIb3DQEBCwUAMBsxGTAXBgNV
BAUTEGY5MjAwOWU4NTNiNmIwNDUwHhcNMjIwMzIwMTgwNzQ4WhcNNDIwMzE1MTgw
NzQ4WjAbMRkwFwYDVQQFExBmOTIwMDllODUzYjZiMDQ1MIICIjANBgkqhkiG9w0B
AQEFAAOCAg8AMIICCgKCAgEAr7bHgiuxpwHsK7Qui8xUFmOr75gvMsd/dTEDDJdS
Sxtf6An7xyqpRR90PL2abxM1dEqlXnf2tqw1Ne4Xwl5jlRfdnJLmN0pTy/4lj4/7
tv0Sk3iiKkypnEUtR6WfMgH0QZfKHM1+di+y9TFRtv6y//0rb+T+W8a9nsNL/ggj
nar86461qO0rOs2cXjp3kOG1FEJ5MVmFmBGtnrKpa73XpXyTqRxB/M0n1n/W9nGq
C4FSYa04T6N5RIZGBN2z2MT5IKGbFlbC8UrW0DxW7AYImQQcHtGl/m00QLVWutHQ
oVJYnFPlXTcHYvASLu+RhhsbDmxMgJJ0mcDpvsC4PjvB+TxywElgS70vE0XmLD+O
JtvsBslHZvPBKCOdT0MS+tgSOIfga+z1Z1g7+DVagf7quvmag8jfPioyKvxnK/Eg
sTUVi2ghzq8wm27ud/mIM7AY2qEORR8Go3TVB4HzWQgpZrt3i5MIlCaY504LzSRi
igHCzAPlHws+W0rB5N+er5/2pJKnfBSDiCiFAVtCLOZ7gLiMm0jhO2B6tUXHI/+M
RPjy02i59lINMRRev56GKtcd9qO/0kUJWdZTdA2XoS82ixPvZtXQpUpuL12ab+9E
aDK8Z4RHJYYfCT3Q5vNAXaiWQ+8PTWm2QgBR/bkwSWc+NpUFgNPN9PvQi8WEg5Um
AGMCAwEAAaNjMGEwHQYDVR0OBBYEFDZh4QB8iAUJUYtEbEf/GkzJ6k8SMB8GA1Ud
IwQYMBaAFDZh4QB8iAUJUYtEbEf/GkzJ6k8SMA8GA1UdEwEB/wQFMAMBAf8wDgYD
VR0PAQH/BAQDAgIEMA0GCSqGSIb3DQEBCwUAA4ICAQB8cMqTllHc8U+qCrOlg3H7
174lmaCsbo/bJ0C17JEgMLb4kvrqsXZs01U3mB/qABg/1t5Pd5AORHARs1hhqGIC
W/nKMav574f9rZN4PC2ZlufGXb7sIdJpGiO9ctRhiLuYuly10JccUZGEHpHSYM2G
tkgYbZba6lsCPYAAP83cyDV+1aOkTf1RCp/lM0PKvmxYN10RYsK631jrleGdcdkx
oSK//mSQbgcWnmAEZrzHoF1/0gso1HZgIn0YLzVhLSA/iXCX4QT2h3J5z3znluKG
1nv8NQdxei2DIIhASWfu804CA96cQKTTlaae2fweqXjdN1/v2nqOhngNyz1361mF
mr4XmaKH/ItTwOe72NI9ZcwS1lVaCvsIkTDCEXdm9rCNPAY10iTunIHFXRh+7KPz
lHGewCq/8TOohBRn0/NNfh7uRslOSZ/xKbN9tMBtw37Z8d2vvnXq/YWdsm1+JLVw
n6yYD/yacNJBlwpddla8eaVMjsF6nBnIgQOf9zKSe06nSTqvgwUHosgOECZJZ1Eu
zbH4yswbt02tKtKEFhx+v+OTge/06V+jGsqTWLsfrOCNLuA8H++z+pUENmpqnnHo
vaI47gC+TNpkgYGkkBT6B/m/U01BuOBBTzhIlMEZq9qkDWuM2cA5kW5V3FJUcfHn
w1IdYIg2Wxg7yHcQZemFQg==
-----END CERTIFICATE-----`,

  // Google Hardware Attestation Root (EC P-384)
  `-----BEGIN CERTIFICATE-----
MIICIjCCAaigAwIBAgIRAISp0Cl7DrWK5/8OgN52BgUwCgYIKoZIzj0EAwMwUjEc
MBoGA1UEAwwTS2V5IEF0dGVzdGF0aW9uIENBMTEQMA4GA1UECwwHQW5kcm9pZDET
MBEGA1UECgwKR29vZ2xlIExMQzELMAkGA1UEBhMCVVMwHhcNMjUwNzE3MjIzMjE4
WhcNMzUwNzE1MjIzMjE4WjBSMRwwGgYDVQQDDBNLZXkgQXR0ZXN0YXRpb24gQ0Ex
MRAwDgYDVQQLDAdBbmRyb2lkMRMwEQYDVQQKDApHb29nbGUgTExDMQswCQYDVQQG
EwJVUzB2MBAGByqGSM49AgEGBSuBBAAiA2IABCPaI3FO3z5bBQo8cuiEas4HjqCt
G/mLFfRT0MsIssPBEEU5Cfbt6sH5yOAxqEi5QagpU1yX4HwnGb7OtBYpDTB57uH5
Eczm34A5FNijV3s0/f0UPl7zbJcTx6xwqMIRq6NCMEAwDwYDVR0TAQH/BAUwAwEB
/zAOBgNVHQ8BAf8EBAMCAQYwHQYDVR0OBBYEFFIyuyz7RkOb3NaBqQ5lZuA0QepA
MAoGCCqGSM49BAMDA2gAMGUCMETfjPO/HwqReR2CS7p0ZWoD/LHs6hDi422opifH
EUaYLxwGlT9SLdjkVpz0UUOR5wIxAIoGyxGKRHVTpqpGRFiJtQEOOTp/+s1GcxeY
uR2zh/80lQyu9vAFCj6E4AXc+osmRg==
-----END CERTIFICATE-----`
];

export const SecurityLevel = {
  Software: 0,
  TrustedEnvironment: 1,
  StrongBox: 2
};

// Cached revocation status state
let cachedRevocationData = null;
let cachedRevocationTimestamp = 0;
const REVOCATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REVOCATION_STATUS_URL = 'https://android.googleapis.com/attestation/status';

export const fetchGoogleRevocationStatus = async ({ forceRefresh = false, timeoutMs = 10_000 } = {}) => {
  const now = Date.now();
  if (!forceRefresh && cachedRevocationData && (now - cachedRevocationTimestamp < REVOCATION_CACHE_TTL_MS)) {
    return cachedRevocationData;
  }

  const https = await import('node:https');
  const data = await new Promise((resolve, reject) => {
    const req = https.get(REVOCATION_STATUS_URL, { timeout: timeoutMs }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`Google revocation endpoint returned HTTP ${res.statusCode}`));
        return;
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (!parsed || typeof parsed.entries !== 'object') {
            reject(new Error('Malformed revocation status JSON structure'));
            return;
          }
          resolve(parsed.entries);
        } catch (e) {
          reject(new Error(`Failed to parse revocation JSON: ${e.message}`));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Revocation status request timed out'));
    });
    req.on('error', reject);
  });

  cachedRevocationData = data;
  cachedRevocationTimestamp = now;
  return cachedRevocationData;
};

export const clearRevocationCache = () => {
  cachedRevocationData = null;
  cachedRevocationTimestamp = 0;
};

export const VerifiedBootState = {
  Verified: 0,
  SelfSigned: 1,
  Unverified: 2,
  Failed: 3
};

// Strict DER INTEGER and ENUMERATED Decoders
export const parseDerInteger = (buffer, { min = -2147483648, max = 2147483647 } = {}) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('DER INTEGER cannot be empty');
  }
  // Up to 5 bytes supported (4 content bytes plus optional leading 0x00 sign-extension byte)
  if (buffer.length > 5) {
    throw new Error('DER INTEGER exceeds maximum supported length (32-bit range)');
  }
  // Canonical minimal encoding check:
  // Redundant leading 0x00 if the high bit of the next byte is NOT 1
  if (buffer.length > 1 && buffer[0] === 0x00 && (buffer[1] & 0x80) === 0) {
    throw new Error('DER INTEGER contains non-minimal leading zero byte');
  }
  // Redundant leading 0xFF if the high bit of the next byte IS 1
  if (buffer.length > 1 && buffer[0] === 0xFF && (buffer[1] & 0x80) !== 0) {
    throw new Error('DER INTEGER contains non-minimal leading 0xFF byte');
  }

  // Two's complement big-endian decoding
  let value = (buffer[0] & 0x80) !== 0 ? -1 : 0;
  for (let i = 0; i < buffer.length; i++) {
    value = (value * 256) + buffer[i];
  }

  if (value < min || value > max) {
    throw new Error(`DER INTEGER value ${value} out of allowed range [${min}, ${max}]`);
  }
  return value;
};

export const parseDerEnumerated = (buffer, { min = 0, max = 2 } = {}) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('DER ENUMERATED cannot be empty');
  }
  if (buffer.length > 2) {
    throw new Error('DER ENUMERATED exceeds supported length');
  }
  if (buffer.length > 1 && buffer[0] === 0x00 && (buffer[1] & 0x80) === 0) {
    throw new Error('DER ENUMERATED contains non-minimal leading zero byte');
  }
  let value = (buffer[0] & 0x80) !== 0 ? -1 : 0;
  for (let i = 0; i < buffer.length; i++) {
    value = (value * 256) + buffer[i];
  }
  if (value < min || value > max) {
    throw new Error(`DER ENUMERATED value ${value} out of allowed range [${min}, ${max}]`);
  }
  return value;
};

// DER TLV Parser Helper Functions
export const parseTLV = (buffer, offset = 0) => {
  if (!buffer || offset >= buffer.length) return null;
  const tag = buffer[offset];
  if (offset + 1 >= buffer.length) return null;
  let len = buffer[offset + 1];
  let headerLen = 2;
  if (len & 0x80) {
    const numBytes = len & 0x7f;
    if (numBytes === 0 || offset + 2 + numBytes > buffer.length) return null;
    len = 0;
    for (let i = 0; i < numBytes; i++) {
      len = (len << 8) | buffer[offset + 2 + i];
    }
    headerLen = 2 + numBytes;
  }
  if (offset + headerLen + len > buffer.length) return null;
  const value = buffer.subarray(offset + headerLen, offset + headerLen + len);
  return {
    tag,
    len,
    headerLen,
    totalLen: headerLen + len,
    value,
    offset
  };
};

export const parseSequenceChildren = (buffer) => {
  const children = [];
  let pos = 0;
  while (pos < buffer.length) {
    const tlv = parseTLV(buffer, pos);
    if (!tlv || tlv.totalLen === 0) break;
    children.push(tlv);
    pos += tlv.totalLen;
  }
  return children;
};

// Find custom OID extension in DER-encoded TBSCertificate
export const findExtensionByOID = (tbsDerBuffer, targetOidString) => {
  // Convert dotted decimal OID string to DER bytes
  const oidParts = targetOidString.split('.').map(Number);
  const oidBytes = [40 * oidParts[0] + oidParts[1]];
  for (let i = 2; i < oidParts.length; i++) {
    let val = oidParts[i];
    if (val < 128) {
      oidBytes.push(val);
    } else {
      const bytes = [];
      bytes.push(val & 0x7f);
      val >>= 7;
      while (val > 0) {
        bytes.push((val & 0x7f) | 0x80);
        val >>= 7;
      }
      oidBytes.push(...bytes.reverse());
    }
  }
  const targetOidDer = Buffer.concat([Buffer.from([0x06, oidBytes.length]), Buffer.from(oidBytes)]);

  // Search for the OID sequence in TBSCertificate
  const index = tbsDerBuffer.indexOf(targetOidDer);
  if (index === -1) return null;

  // The OID is inside an Extension SEQUENCE { extnId OBJECT IDENTIFIER, critical BOOLEAN OPTIONAL, extnValue OCTET STRING }
  let seqStart = -1;
  for (let lookback = 2; lookback <= 8; lookback++) {
    const candidateOffset = index - lookback;
    if (candidateOffset >= 0 && tbsDerBuffer[candidateOffset] === 0x30) {
      const tlv = parseTLV(tbsDerBuffer, candidateOffset);
      if (tlv && candidateOffset + tlv.totalLen >= index + targetOidDer.length) {
        seqStart = candidateOffset;
        break;
      }
    }
  }
  if (seqStart === -1) return null;

  const extSeq = parseTLV(tbsDerBuffer, seqStart);
  if (!extSeq) return null;

  const extChildren = parseSequenceChildren(extSeq.value);
  // Last child of the extension is the OCTET STRING containing KeyDescription
  const octetString = extChildren[extChildren.length - 1];
  if (!octetString || octetString.tag !== 0x04) return null;

  return octetString.value;
};

// Parse AuthorizationList context-specific tagged items
export const parseAuthorizationList = (authListBuffer) => {
  const result = {
    raw: authListBuffer,
    tagged: new Map()
  };
  let pos = 0;
  while (pos < authListBuffer.length) {
    const byte = authListBuffer[pos];
    // ASN.1 context-specific constructed [tag] starts with 0xa0 or 0xbf
    let tagNumber;
    let headerLen;
    let len;
    if ((byte & 0x1f) === 0x1f) {
      // Multi-byte tag (e.g. tag 704: 0xbf 0x85 0x40, tag 709: 0xbf 0x85 0x45)
      let tagAccum = 0;
      let p = pos + 1;
      while (p < authListBuffer.length) {
        const b = authListBuffer[p++];
        tagAccum = (tagAccum << 7) | (b & 0x7f);
        if (!(b & 0x80)) break;
      }
      tagNumber = tagAccum;
      let lenByte = authListBuffer[p];
      let lenHeader = 1;
      if (lenByte & 0x80) {
        const numLenBytes = lenByte & 0x7f;
        len = 0;
        for (let i = 0; i < numLenBytes; i++) {
          len = (len << 8) | authListBuffer[p + 1 + i];
        }
        lenHeader += numLenBytes;
      } else {
        len = lenByte;
      }
      headerLen = (p - pos) + lenHeader;
    } else {
      tagNumber = byte & 0x1f;
      let lenByte = authListBuffer[pos + 1];
      let lenHeader = 1;
      if (lenByte & 0x80) {
        const numLenBytes = lenByte & 0x7f;
        len = 0;
        for (let i = 0; i < numLenBytes; i++) {
          len = (len << 8) | authListBuffer[pos + 2 + i];
        }
        lenHeader += numLenBytes;
      } else {
        len = lenByte;
      }
      headerLen = 1 + lenHeader;
    }

    if (pos + headerLen + len > authListBuffer.length) break;
    const value = authListBuffer.subarray(pos + headerLen, pos + headerLen + len);
    result.tagged.set(tagNumber, value);
    pos += headerLen + len;
  }
  return result;
};

// Parse Tag 704: RootOfTrust
export const parseRootOfTrust = (rootOfTrustBuffer) => {
  // Can be wrapped in an explicit SEQUENCE
  const tlv = parseTLV(rootOfTrustBuffer);
  const seqBuf = (tlv && tlv.tag === 0x30) ? tlv.value : rootOfTrustBuffer;
  const children = parseSequenceChildren(seqBuf);
  if (children.length < 3) return null;

  const verifiedBootKey = children[0].value.toString('hex');
  const deviceLocked = children[1].value[0] !== 0;
  const verifiedBootState = parseDerEnumerated(children[2].value, { min: 0, max: 3 });
  const verifiedBootHash = children[3] ? children[3].value.toString('hex') : null;

  return {
    verifiedBootKey,
    deviceLocked,
    verifiedBootState,
    verifiedBootHash
  };
};

// Parse Tag 709: AttestationApplicationId
export const parseAttestationApplicationId = (appIdOctetBuffer) => {
  // If wrapped in an OCTET STRING, unwrap it
  const outerTlv = parseTLV(appIdOctetBuffer);
  const der = (outerTlv && outerTlv.tag === 0x04) ? outerTlv.value : appIdOctetBuffer;

  const rootSeq = parseTLV(der);
  if (!rootSeq || rootSeq.tag !== 0x30) return null;

  const children = parseSequenceChildren(rootSeq.value);
  if (children.length < 2) return null;

  // children[0] is SET OF AttestationPackageInfo
  const packageInfos = [];
  const pkgSetTlv = children[0];
  const pkgElements = parseSequenceChildren(pkgSetTlv.value);
  for (const pkgElem of pkgElements) {
    if (pkgElem.tag === 0x30) {
      const fields = parseSequenceChildren(pkgElem.value);
      if (fields.length >= 2) {
        packageInfos.push({
          packageName: fields[0].value.toString('utf8'),
          version: parseDerInteger(fields[1].value, { min: 0 })
        });
      }
    }
  }

  // children[1] is SET OF OCTET_STRING (signature digests)
  const signatureDigests = [];
  const sigSetTlv = children[1];
  const sigElements = parseSequenceChildren(sigSetTlv.value);
  for (const sigElem of sigElements) {
    if (sigElem.tag === 0x04) {
      signatureDigests.push(sigElem.value.toString('hex').toLowerCase());
    }
  }

  return {
    packageInfos,
    signatureDigests
  };
};

// Parse the full KeyDescription extension structure
export const parseKeyDescription = (extValueBuffer) => {
  const rootSeq = parseTLV(extValueBuffer);
  if (!rootSeq || rootSeq.tag !== 0x30) {
    throw new Error('KeyDescription extension is not a valid ASN.1 SEQUENCE');
  }

  const children = parseSequenceChildren(rootSeq.value);
  if (children.length < 8) {
    throw new Error(`KeyDescription expected 8 fields, got ${children.length}`);
  }

  const attestationVersion = parseDerInteger(children[0].value, { min: 1 });
  const attestationSecurityLevel = parseDerEnumerated(children[1].value, { min: 0, max: 2 });
  const keymasterVersion = parseDerInteger(children[2].value, { min: 0 });
  const keymasterSecurityLevel = parseDerEnumerated(children[3].value, { min: 0, max: 2 });
  const attestationChallenge = children[4].value; // Buffer
  const uniqueId = children[5].value; // Buffer
  const softwareEnforced = parseAuthorizationList(children[6].value);
  const hardwareEnforced = parseAuthorizationList(children[7].value);

  // Extract Tag 704 (RootOfTrust) - usually in hardwareEnforced
  const rootOfTrustRaw = hardwareEnforced.tagged.get(704);
  const rootOfTrust = rootOfTrustRaw ? parseRootOfTrust(rootOfTrustRaw) : null;

  // Extract Tag 709 (AttestationApplicationId) - can be in softwareEnforced or hardwareEnforced
  const appIdRaw = softwareEnforced.tagged.get(709) || hardwareEnforced.tagged.get(709);
  const attestationApplicationId = appIdRaw ? parseAttestationApplicationId(appIdRaw) : null;

  return {
    attestationVersion,
    attestationSecurityLevel,
    keymasterVersion,
    keymasterSecurityLevel,
    attestationChallenge,
    uniqueId,
    softwareEnforced,
    hardwareEnforced,
    rootOfTrust,
    attestationApplicationId
  };
};

// ============================================================
// MAIN VERIFICATION FUNCTION
// ============================================================
export const verifyAndroidKeyAttestation = async ({
  certificateChain,
  expectedChallenge,
  expectedPackageName = EXPECTED_PACKAGE_NAME,
  expectedSigningCertSha256 = EXPECTED_SIGNING_CERT_SHA256,
  trustedRoots = GOOGLE_ROOT_CERTIFICATES,
  revocationEntries = null,
  now = new Date()
}) => {
  if (!Array.isArray(certificateChain) || certificateChain.length < 2) {
    return {
      valid: false,
      code: 'INVALID_CHAIN_LENGTH',
      message: 'Certificate chain must contain at least a leaf certificate and a root certificate'
    };
  }

  // 1. Parse and validate X509Certificates
  const x509Chain = [];
  try {
    for (let i = 0; i < certificateChain.length; i++) {
      const certPem = certificateChain[i];
      const cert = new crypto.X509Certificate(certPem);
      // Validate certificate validity window (skip root self-validity check as legacy Google root validity may be expired)
      if (i < certificateChain.length - 1) {
        const notBefore = new Date(cert.validFrom);
        const notAfter = new Date(cert.validTo);
        if (now < notBefore || now > notAfter) {
          return {
            valid: false,
            code: 'CERTIFICATE_EXPIRED',
            message: `Certificate at index ${i} is outside its validity period (${cert.validFrom} to ${cert.validTo})`
          };
        }
      }
      x509Chain.push(cert);
    }
  } catch (parseError) {
    return {
      valid: false,
      code: 'MALFORMED_CERTIFICATE',
      message: `Failed to parse X.509 certificate: ${parseError.message}`
    };
  }

  // 2. Verify root certificate against pinned Google Attestation Roots
  const leafCert = x509Chain[0];
  const rootCert = x509Chain[x509Chain.length - 1];

  let trustedRootMatched = false;
  for (const trustedRootPem of trustedRoots) {
    try {
      const trustedRoot = new crypto.X509Certificate(trustedRootPem);
      if (rootCert.fingerprint256 === trustedRoot.fingerprint256
          && rootCert.verify(trustedRoot.publicKey)) {
        trustedRootMatched = true;
        break;
      }
    } catch {
      // Continue checking other roots
    }
  }

  if (!trustedRootMatched) {
    return {
      valid: false,
      code: 'UNTRUSTED_ROOT_CA',
      message: 'Root certificate does not chain to an approved Google Attestation Root'
    };
  }

  // 3. Verify signatures along the certificate chain
  for (let i = 0; i < x509Chain.length - 1; i++) {
    const child = x509Chain[i];
    const parent = x509Chain[i + 1];
    try {
      const verified = child.verify(parent.publicKey);
      if (!verified) {
        return {
          valid: false,
          code: 'CHAIN_SIGNATURE_INVALID',
          message: `Certificate at index ${i} signature could not be verified by parent key`
        };
      }
    } catch {
      return {
        valid: false,
        code: 'CHAIN_SIGNATURE_INVALID',
        message: `Certificate at index ${i} signature verification failed`
      };
    }
  }

  // 4. Check certificate revocation status if list is provided or if verifyRevocation is requested
  let activeRevocations = revocationEntries;
  if (!activeRevocations) {
    try {
      activeRevocations = await fetchGoogleRevocationStatus();
    } catch (revocationError) {
      // In strict mode or when fail-closed is required, network failures reject verification
      return {
        valid: false,
        code: 'REVOCATION_CHECK_FAILED',
        message: `Could not verify certificate revocation status: ${revocationError.message}`
      };
    }
  }

  if (activeRevocations) {
    for (const cert of x509Chain) {
      // serialNumber in Node X509Certificate is uppercase hex, Google status.json is lowercase hex
      const serialLower = cert.serialNumber.toLowerCase().replace(/^0+/, '');
      if (activeRevocations[serialLower]) {
        const entry = activeRevocations[serialLower];
        if (entry.status === 'REVOKED' || entry.status === 'SUSPENDED') {
          return {
            valid: false,
            code: 'CERTIFICATE_REVOKED',
            message: `Certificate serial ${cert.serialNumber} has invalid status "${entry.status}" (${entry.reason || 'UNSPECIFIED'})`
          };
        }
      }
    }
  }

  // 5. Extract and parse Android Key Attestation Extension from the Leaf Certificate
  let extDerBuffer = null;
  try {
    extDerBuffer = findExtensionByOID(leafCert.raw, ATTESTATION_OID);
  } catch (extError) {
    return {
      valid: false,
      code: 'EXTENSION_PARSING_FAILED',
      message: `Could not parse certificate extensions: ${extError.message}`
    };
  }

  if (!extDerBuffer) {
    return {
      valid: false,
      code: 'ATTESTATION_EXTENSION_MISSING',
      message: `Leaf certificate does not contain Android Key Attestation extension ${ATTESTATION_OID}`
    };
  }

  let keyDescription = null;
  try {
    keyDescription = parseKeyDescription(extDerBuffer);
  } catch (kdError) {
    return {
      valid: false,
      code: 'KEY_DESCRIPTION_INVALID',
      message: `Failed to parse KeyDescription ASN.1 structure: ${kdError.message}`
    };
  }

  // 6. Verify Hardware Security Level (Reject Software-Only Keys)
  if (keyDescription.attestationSecurityLevel === SecurityLevel.Software
      || keyDescription.keymasterSecurityLevel === SecurityLevel.Software) {
    return {
      valid: false,
      code: 'SOFTWARE_KEY_REJECTED',
      message: 'Key attestation was performed in software; TrustedEnvironment or StrongBox required'
    };
  }

  // 7. Verify Attestation Challenge matches expected challenge
  // Server-generated challenge is a base64url string (e.g. from crypto.randomBytes(32).toString('base64url')).
  // Android Keystore receives the UTF-8 bytes of this exact challenge string:
  // specBuilder.setAttestationChallenge(challenge.getBytes(StandardCharsets.UTF_8));
  // Therefore, the raw bytes inside keyDescription.attestationChallenge must match the UTF-8 bytes of expectedChallenge.
  const expectedChallengeBuffer = Buffer.from(String(expectedChallenge), 'utf8');
  if (keyDescription.attestationChallenge.length !== expectedChallengeBuffer.length
      || !crypto.timingSafeEqual(keyDescription.attestationChallenge, expectedChallengeBuffer)) {
    return {
      valid: false,
      code: 'CHALLENGE_MISMATCH',
      message: 'Attestation challenge does not match server-issued challenge'
    };
  }

  // 8. Verify Application Package Name & Signing Certificate Digest
  if (!keyDescription.attestationApplicationId) {
    return {
      valid: false,
      code: 'APPLICATION_ID_MISSING',
      message: 'Attestation does not contain attestationApplicationId tag (709)'
    };
  }

  const { packageInfos, signatureDigests } = keyDescription.attestationApplicationId;
  const matchedPackage = packageInfos.find(p => p.packageName === expectedPackageName);
  if (!matchedPackage) {
    return {
      valid: false,
      code: 'PACKAGE_NAME_MISMATCH',
      message: `Attested package name does not match expected package "${expectedPackageName}"`
    };
  }

  const normalizedExpectedSha256 = expectedSigningCertSha256.toLowerCase();
  const matchedDigest = signatureDigests.find(digest => digest.toLowerCase() === normalizedExpectedSha256);
  if (!matchedDigest) {
    return {
      valid: false,
      code: 'SIGNING_CERTIFICATE_MISMATCH',
      message: 'Attested signing certificate digest does not match HomelyServ official release signing key'
    };
  }

  // 9. Verify Device Integrity via RootOfTrust (if present)
  if (keyDescription.rootOfTrust) {
    if (!keyDescription.rootOfTrust.deviceLocked) {
      return {
        valid: false,
        code: 'DEVICE_UNLOCKED',
        message: 'Device bootloader is unlocked; genuine device integrity cannot be verified'
      };
    }
    if (keyDescription.rootOfTrust.verifiedBootState === VerifiedBootState.Failed
        || keyDescription.rootOfTrust.verifiedBootState === VerifiedBootState.Unverified) {
      return {
        valid: false,
        code: 'VERIFIED_BOOT_COMPROMISED',
        message: `Verified boot state is compromised (${keyDescription.rootOfTrust.verifiedBootState})`
      };
    }
  }

  return {
    valid: true,
    leafPublicKeyPem: leafCert.publicKey.export({ type: 'spki', format: 'pem' }),
    leafCertificate: leafCert,
    attestationSecurityLevel: keyDescription.attestationSecurityLevel,
    keymasterSecurityLevel: keyDescription.keymasterSecurityLevel,
    packageName: matchedPackage.packageName,
    packageVersion: matchedPackage.version,
    signingCertSha256: matchedDigest,
    rootOfTrust: keyDescription.rootOfTrust
  };
};

export default verifyAndroidKeyAttestation;
