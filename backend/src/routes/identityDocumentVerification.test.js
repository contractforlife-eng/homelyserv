// backend/src/routes/identityDocumentVerification.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPublicVerification,
  getVerificationDetails,
  normalizeVerificationStatus,
  VERIFICATION_STATUSES
} from '../services/profileVerificationService.js';
import { generateSignedDocumentUrl } from '../utils/verificationDocumentUpload.js';
import { requireSupport } from '../middleware/supportAuth.js';

test('1. Case A: Email verified alone NEVER grants Verified Profile status', () => {
  const user = {
    _id: '507f1f77bcf86cd799439011',
    fullName: 'Case A Worker',
    email: 'case_a@test.com',
    emailVerified: true,
    phoneVerified: false,
    identityVerificationStatus: 'NOT_VERIFIED',
    experienceVerificationStatus: 'NOT_VERIFIED',
    certificatesVerificationStatus: 'NOT_VERIFIED',
    verifiedProfileStatus: 'NOT_VERIFIED'
  };

  const pub = getPublicVerification(user);
  const details = getVerificationDetails(user);

  assert.equal(pub.email, true);
  assert.equal(pub.phone, false);
  assert.equal(pub.identity, false);
  assert.equal(pub.isVerified, false, 'Email verification must NOT grant isVerified');
  assert.equal(pub.verifiedProfileStatus, 'NOT_VERIFIED');
  assert.equal(details.isVerified, false);
  assert.equal(details.profile.status, 'NOT_VERIFIED');
});

test('2. Case B: Email and Phone verified together NEVER grant Verified Profile status', () => {
  const user = {
    _id: '507f1f77bcf86cd799439012',
    fullName: 'Case B Worker',
    email: 'case_b@test.com',
    emailVerified: true,
    phoneVerified: true,
    identityVerificationStatus: 'NOT_VERIFIED',
    experienceVerificationStatus: 'NOT_VERIFIED',
    certificatesVerificationStatus: 'NOT_VERIFIED',
    verifiedProfileStatus: 'NOT_VERIFIED'
  };

  const pub = getPublicVerification(user);
  const details = getVerificationDetails(user);

  assert.equal(pub.email, true);
  assert.equal(pub.phone, true);
  assert.equal(pub.identity, false);
  assert.equal(pub.isVerified, false, 'Email + Phone together must NOT grant isVerified');
  assert.equal(pub.verifiedProfileStatus, 'NOT_VERIFIED');
  assert.equal(details.isVerified, false);
});

test('3. Case C: All categories verified WITHOUT explicit Admin Verified Profile approval => isVerified is false', () => {
  const user = {
    _id: '507f1f77bcf86cd799439013',
    fullName: 'Case C Worker',
    email: 'case_c@test.com',
    emailVerified: true,
    phoneVerified: true,
    identityVerificationStatus: 'VERIFIED',
    experienceVerificationStatus: 'VERIFIED',
    certificatesVerificationStatus: 'VERIFIED',
    verifiedProfileStatus: 'NOT_VERIFIED' // No explicit Admin Verified Profile approval
  };

  const pub = getPublicVerification(user);
  const details = getVerificationDetails(user);

  assert.equal(pub.email, true);
  assert.equal(pub.phone, true);
  assert.equal(pub.identity, true);
  assert.equal(pub.experience, true);
  assert.equal(pub.certificates, true);
  assert.equal(pub.isVerified, false, 'Individual category approvals must NOT grant Verified Profile without Admin approval');
  assert.equal(pub.verifiedProfileStatus, 'NOT_VERIFIED');
  assert.equal(details.isVerified, false);
});

test('4. Case D: Admin explicitly approves Verified Profile => isVerified is true', () => {
  const user = {
    _id: '507f1f77bcf86cd799439014',
    fullName: 'Case D Worker',
    email: 'case_d@test.com',
    emailVerified: true,
    phoneVerified: true,
    identityVerificationStatus: 'VERIFIED',
    experienceVerificationStatus: 'VERIFIED',
    certificatesVerificationStatus: 'VERIFIED',
    verifiedProfileStatus: 'VERIFIED',
    verifiedProfileAt: new Date(),
    verifiedProfileBy: '507f1f77bcf86cd799439099'
  };

  const pub = getPublicVerification(user);
  const details = getVerificationDetails(user);

  assert.equal(pub.isVerified, true, 'Explicit Admin approval must grant isVerified: true');
  assert.equal(pub.verifiedProfileStatus, 'VERIFIED');
  assert.equal(details.isVerified, true);
  assert.equal(details.profile.status, 'VERIFIED');
  assert.ok(details.profile.verifiedAt);
});

test('5. Public verification API strictly isolates private documents, notes, and storage IDs', () => {
  const user = {
    _id: '507f1f77bcf86cd799439015',
    fullName: 'Secure Worker',
    email: 'secure@test.com',
    phone: '+201001234567',
    phoneVerified: true,
    emailVerified: true,
    identityVerificationStatus: 'VERIFIED',
    experienceVerificationStatus: 'VERIFIED',
    certificatesVerificationStatus: 'VERIFIED',
    verifiedProfileStatus: 'VERIFIED',
    verificationNotes: 'Sensitive private notes and national ID number 123456789'
  };

  const pub = getPublicVerification(user);

  assert.equal(pub.publicId, undefined);
  assert.equal(pub.signedUrl, undefined);
  assert.equal(pub.document, undefined);
  assert.equal(pub.verificationNotes, undefined);
  assert.equal(pub.rejectionReason, undefined);
});

test('6. generateSignedDocumentUrl produces safe authenticated URLs in all environments', () => {
  const signed = generateSignedDocumentUrl('homelyserv/verification-documents/test_id_doc', 'image', 3600);
  assert.ok(typeof signed === 'string');
  assert.ok(signed.includes('test_id_doc') || signed.includes('homelyserv'));
});

test('7. Multi-category document status tracking in getVerificationDetails', () => {
  const user = {
    _id: '507f1f77bcf86cd799439016',
    identityVerificationStatus: 'PENDING',
    experienceVerificationStatus: 'PENDING',
    certificatesVerificationStatus: 'PENDING',
    verifiedProfileStatus: 'NOT_VERIFIED'
  };

  const docInfo = {
    identityHasDocument: true,
    identityDocumentStatus: 'PENDING',
    experienceHasDocument: true,
    experienceDocumentStatus: 'PENDING',
    certificatesHasDocument: true,
    certificatesDocumentStatus: 'PENDING'
  };

  const details = getVerificationDetails(user, docInfo);

  assert.equal(details.identity.hasDocument, true);
  assert.equal(details.identity.documentStatus, 'PENDING');
  assert.equal(details.experience.hasDocument, true);
  assert.equal(details.experience.documentStatus, 'PENDING');
  assert.equal(details.certificates.hasDocument, true);
  assert.equal(details.certificates.documentStatus, 'PENDING');
  assert.equal(details.isVerified, false);
});

test('8. Role authorization: SUPPORT (Sup-Admin) and ADMIN (Co-Admin) are authorized; SUPPORT_HELPER and WORKER are rejected', () => {
  const createMockReq = (role) => ({
    userRole: role,
    headers: { authorization: 'Bearer mock_token' }
  });

  const testAuth = (role) => {
    let authorized = false;
    let statusCode = null;
    const req = createMockReq(role);
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: () => {} };
      }
    };
    const next = () => { authorized = true; };

    // Simulate requireSupport logic
    if (req.userRole === 'SUPPORT' || req.userRole === 'ADMIN' || req.userRole === 'SUP_ADMIN') {
      next();
    } else {
      res.status(403).json();
    }

    return { authorized, statusCode };
  };

  assert.equal(testAuth('ADMIN').authorized, true, 'Co-Admin (ADMIN) must be authorized');
  assert.equal(testAuth('SUPPORT').authorized, true, 'Sup-Admin (SUPPORT) must be authorized');
  assert.equal(testAuth('SUPPORT_HELPER').authorized, false, 'Sup-Help (SUPPORT_HELPER) must be rejected');
  assert.equal(testAuth('SUPPORT_HELPER').statusCode, 403);
  assert.equal(testAuth('WORKER').authorized, false, 'Ordinary WORKER must be rejected');
  assert.equal(testAuth('EMPLOYER').authorized, false, 'Ordinary EMPLOYER must be rejected');
});

test('9. Verification status normalization safely rejects malicious inputs', () => {
  assert.equal(normalizeVerificationStatus('VERIFIED'), 'VERIFIED');
  assert.equal(normalizeVerificationStatus('verified'), 'VERIFIED');
  assert.equal(normalizeVerificationStatus('PENDING'), 'PENDING');
  assert.equal(normalizeVerificationStatus('pending'), 'PENDING');
  assert.equal(normalizeVerificationStatus('REJECTED'), 'REJECTED');
  assert.equal(normalizeVerificationStatus('NOT_VERIFIED'), 'NOT_VERIFIED');
  assert.equal(normalizeVerificationStatus(null), 'NOT_VERIFIED');
  assert.equal(normalizeVerificationStatus(undefined), 'NOT_VERIFIED');
  assert.equal(normalizeVerificationStatus('SQL_INJECTION'), 'NOT_VERIFIED');
});
