// backend/src/services/profileVerificationService.js
// ============================================================
// PROFILE TRUST & VERIFICATION SERVICE
// ============================================================
// Manages multi-level profile verification:
//   1. Phone Verification (SMS/OTP signal)
//   2. Email Verification (email link signal)
//   3. Identity Verification (secure Government ID upload)
//   4. Experience Verification (secure work proof upload)
//   5. Certificates Verification (secure certificate/license upload)
//   6. Verified Profile (authoritative admin-approved status)
//
// CRITICAL BUSINESS RULE:
// Email and phone verifications are individual signals. They NEVER
// automatically grant "Verified Profile" status. Verified Profile is
// an explicit, server-authoritative status that requires administrator approval.
//
// Strictly separates verified trust status from Premium/paid status.
// Exposes only safe public indicators without leaking private data or raw URLs.
// ============================================================
import User from '../models/User.js';
import VerificationDocument from '../models/VerificationDocument.js';
import {
  uploadVerificationDocument,
  generateSignedDocumentUrl,
  deleteVerificationDocument
} from '../utils/verificationDocumentUpload.js';

export const VERIFICATION_STATUSES = Object.freeze({
  NOT_VERIFIED: 'NOT_VERIFIED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
});

export const VERIFICATION_TYPES = Object.freeze([
  'phone',
  'email',
  'identity',
  'experience',
  'certificates',
  'profile',
  'verifiedprofile'
]);

/**
 * Normalizes verification status string to standard enum value.
 */
export const normalizeVerificationStatus = (status) => {
  const norm = String(status || '').trim().toUpperCase();
  return Object.values(VERIFICATION_STATUSES).includes(norm) ? norm : VERIFICATION_STATUSES.NOT_VERIFIED;
};

/**
 * Returns comprehensive verification details for a user (self / admin view).
 * Reuses authoritative emailVerified and phoneVerified fields.
 *
 * @param {Object} user - User document or plain object
 * @param {Object} [documentInfo] - Optional preloaded document metadata
 * @returns {Object} Full verification details
 */
export const getVerificationDetails = (user = {}, documentInfo = null) => {
  if (!user) return null;

  const phoneIsVerified = user.phoneVerified === true || user.phoneVerificationStatus === VERIFICATION_STATUSES.VERIFIED;
  const emailIsVerified = user.emailVerified === true;
  const identityStatus = normalizeVerificationStatus(user.identityVerificationStatus);
  const experienceStatus = normalizeVerificationStatus(user.experienceVerificationStatus);
  const certificatesStatus = normalizeVerificationStatus(user.certificatesVerificationStatus);
  const verifiedProfileStatus = normalizeVerificationStatus(user.verifiedProfileStatus);
  const phoneStatus = phoneIsVerified
    ? VERIFICATION_STATUSES.VERIFIED
    : normalizeVerificationStatus(user.phoneVerificationStatus);

  // Authoritative rule: isVerified is TRUE ONLY when verifiedProfileStatus === VERIFIED
  const isVerified = verifiedProfileStatus === VERIFICATION_STATUSES.VERIFIED;

  return {
    phone: {
      status: phoneStatus,
      verified: phoneIsVerified,
      verifiedAt: user.phoneVerifiedAt || null
    },
    email: {
      status: emailIsVerified ? VERIFICATION_STATUSES.VERIFIED : VERIFICATION_STATUSES.NOT_VERIFIED,
      verified: emailIsVerified,
      verifiedAt: user.emailVerifiedAt || null
    },
    identity: {
      status: identityStatus,
      verified: identityStatus === VERIFICATION_STATUSES.VERIFIED,
      verifiedAt: user.identityVerifiedAt || null,
      hasDocument: documentInfo ? Boolean(documentInfo.hasDocument || documentInfo.identityHasDocument) : false,
      documentStatus: documentInfo?.status || documentInfo?.identityDocumentStatus || null
    },
    experience: {
      status: experienceStatus,
      verified: experienceStatus === VERIFICATION_STATUSES.VERIFIED,
      verifiedAt: user.experienceVerifiedAt || null,
      hasDocument: documentInfo ? Boolean(documentInfo.experienceHasDocument) : false,
      documentStatus: documentInfo?.experienceDocumentStatus || null
    },
    certificates: {
      status: certificatesStatus,
      verified: certificatesStatus === VERIFICATION_STATUSES.VERIFIED,
      verifiedAt: user.certificatesVerifiedAt || null,
      hasDocument: documentInfo ? Boolean(documentInfo.certificatesHasDocument) : false,
      documentStatus: documentInfo?.certificatesDocumentStatus || null
    },
    profile: {
      status: verifiedProfileStatus,
      verified: isVerified,
      verifiedAt: user.verifiedProfileAt || null,
      verifiedBy: user.verifiedProfileBy || null
    },
    verificationNotes: user.verificationNotes || null,
    isVerified,
    verifiedProfileStatus
  };
};

/**
 * Returns safe, minimal public verification indicators (for search cards, profile view, and chat).
 * Strictly guarantees NO private documents, PII, or storage URLs are exposed.
 *
 * @param {Object} user - User document or plain object
 * @returns {Object} Public verification indicators
 */
export const getPublicVerification = (user = {}) => {
  if (!user) {
    return {
      phone: false,
      email: false,
      identity: false,
      experience: false,
      certificates: false,
      verifiedProfileStatus: VERIFICATION_STATUSES.NOT_VERIFIED,
      isVerified: false
    };
  }

  const phone = user.phoneVerified === true || user.phoneVerificationStatus === VERIFICATION_STATUSES.VERIFIED;
  const email = user.emailVerified === true;
  const identity = user.identityVerificationStatus === VERIFICATION_STATUSES.VERIFIED;
  const experience = user.experienceVerificationStatus === VERIFICATION_STATUSES.VERIFIED;
  const certificates = user.certificatesVerificationStatus === VERIFICATION_STATUSES.VERIFIED;
  const verifiedProfileStatus = normalizeVerificationStatus(user.verifiedProfileStatus);
  
  // Authoritative rule: isVerified is TRUE ONLY when verifiedProfileStatus is VERIFIED
  const isVerified = verifiedProfileStatus === VERIFICATION_STATUSES.VERIFIED;

  return {
    phone,
    email,
    identity,
    experience,
    certificates,
    verifiedProfileStatus,
    isVerified
  };
};

/**
 * Uploads a verification document (Government ID, Work Experience, Certifications/Licenses)
 * and transitions user category verification status to PENDING.
 *
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID
 * @param {string} [params.verificationType='identity'] - 'identity' | 'experience' | 'certificates'
 * @param {Buffer} params.fileBuffer - In-memory file buffer
 * @param {string} params.mimetype - Validated MIME type
 * @param {string} params.originalFilename - Cleaned original filename
 * @param {number} params.size - File size in bytes
 * @param {string} [params.notes] - Optional user notes
 * @returns {Promise<Object>} Verification details
 */
export const uploadUserVerificationDocument = async ({
  userId,
  verificationType = 'identity',
  fileBuffer,
  mimetype,
  originalFilename,
  size,
  notes = ''
}) => {
  if (!userId) throw new Error('User ID is required');
  if (!fileBuffer || !fileBuffer.length) throw new Error('Document file buffer is required');

  const normType = String(verificationType || 'identity').trim().toLowerCase();
  const validUploadTypes = ['identity', 'experience', 'certificates'];
  if (!validUploadTypes.includes(normType)) {
    throw new Error(`Invalid upload verification type. Allowed: ${validUploadTypes.join(', ')}`);
  }

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Upload to authenticated private storage
  const uploadResult = await uploadVerificationDocument(fileBuffer, {
    mimetype,
    originalFilename
  });

  if (!uploadResult?.public_id) {
    throw new Error('Failed to upload document to secure storage');
  }

  // Create or record the VerificationDocument
  const doc = await VerificationDocument.create({
    userId,
    verificationType: normType,
    publicId: uploadResult.public_id,
    resourceType: uploadResult.resource_type || 'image',
    originalFilename: String(originalFilename || '').slice(0, 255),
    mimetype,
    size: Number(size) || fileBuffer.length,
    status: VERIFICATION_STATUSES.PENDING,
    userNotes: typeof notes === 'string' ? notes.trim().slice(0, 1000) : null
  });

  // Update user's corresponding status to PENDING
  if (normType === 'identity') {
    user.identityVerificationStatus = VERIFICATION_STATUSES.PENDING;
  } else if (normType === 'experience') {
    user.experienceVerificationStatus = VERIFICATION_STATUSES.PENDING;
  } else if (normType === 'certificates') {
    user.certificatesVerificationStatus = VERIFICATION_STATUSES.PENDING;
  }

  if (notes) {
    user.verificationNotes = typeof notes === 'string' ? notes.trim().slice(0, 1000) : null;
  }
  await user.save();

  const docInfo = {
    hasDocument: true,
    status: 'PENDING',
    [`${normType}HasDocument`]: true,
    [`${normType}DocumentStatus`]: 'PENDING'
  };

  return {
    success: true,
    message: `${normType.charAt(0).toUpperCase() + normType.slice(1)} document uploaded successfully and is pending review.`,
    verification: getVerificationDetails(user, docInfo),
    documentId: String(doc._id)
  };
};

/**
 * Backward-compatible wrapper for identity document uploads.
 */
export const uploadIdentityDocument = async (params) => {
  return uploadUserVerificationDocument({ ...params, verificationType: 'identity' });
};

/**
 * User requests verification for identity, experience, certificates, or phone (text/info only).
 *
 * @param {string} userId - ID of the user requesting verification
 * @param {Object} payload - { type: 'identity'|'experience'|'certificates'|'phone', notes?: string }
 * @returns {Promise<Object>} Updated verification details
 */
export const requestVerification = async (userId, { type, notes = '' } = {}) => {
  if (!userId) throw new Error('userId is required');
  const normType = String(type || '').trim().toLowerCase();

  if (!VERIFICATION_TYPES.includes(normType) || normType === 'email') {
    throw new Error(`Invalid verification type. Supported types for manual request: phone, identity, experience, certificates`);
  }

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const updateFields = {};
  const cleanNotes = typeof notes === 'string' ? notes.trim().slice(0, 1000) : null;

  if (normType === 'phone') {
    if (user.phoneVerified) {
      return getVerificationDetails(user);
    }
    updateFields.phoneVerificationStatus = VERIFICATION_STATUSES.PENDING;
  } else if (normType === 'identity') {
    if (user.identityVerificationStatus === VERIFICATION_STATUSES.VERIFIED) {
      return getVerificationDetails(user);
    }
    updateFields.identityVerificationStatus = VERIFICATION_STATUSES.PENDING;
  } else if (normType === 'experience') {
    if (user.experienceVerificationStatus === VERIFICATION_STATUSES.VERIFIED) {
      return getVerificationDetails(user);
    }
    updateFields.experienceVerificationStatus = VERIFICATION_STATUSES.PENDING;
  } else if (normType === 'certificates') {
    if (user.certificatesVerificationStatus === VERIFICATION_STATUSES.VERIFIED) {
      return getVerificationDetails(user);
    }
    updateFields.certificatesVerificationStatus = VERIFICATION_STATUSES.PENDING;
  }

  if (cleanNotes) {
    updateFields.verificationNotes = cleanNotes;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true }
  );

  return getVerificationDetails(updatedUser);
};

/**
 * Admin updates verification status for a specific verification layer or the overall Verified Profile.
 * Also synchronizes related VerificationDocument records.
 *
 * @param {string} targetUserId - ID of user whose verification is being updated
 * @param {Object} payload - { type, status, notes, rejectionReason }
 * @param {string} adminId - ID of admin making the decision
 * @returns {Promise<Object>} Updated verification details
 */
export const adminUpdateVerification = async (targetUserId, { type, status, notes = null, rejectionReason = null } = {}, adminId) => {
  if (!targetUserId) throw new Error('targetUserId is required');
  const normType = String(type || '').trim().toLowerCase();
  const normStatus = normalizeVerificationStatus(status);

  if (!VERIFICATION_TYPES.includes(normType)) {
    throw new Error(`Invalid verification type. Supported types: ${VERIFICATION_TYPES.join(', ')}`);
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) throw new Error('User not found');

  const now = new Date();
  const updateFields = {};

  if (normType === 'profile' || normType === 'verifiedprofile') {
    // Explicit Admin decision on overall Verified Profile
    if (normStatus === VERIFICATION_STATUSES.VERIFIED) {
      updateFields.verifiedProfileStatus = VERIFICATION_STATUSES.VERIFIED;
      updateFields.verifiedProfileAt = now;
      updateFields.verifiedProfileBy = adminId || null;
    } else {
      updateFields.verifiedProfileStatus = normStatus;
      updateFields.verifiedProfileAt = null;
      updateFields.verifiedProfileBy = null;
    }
  } else if (normStatus === VERIFICATION_STATUSES.VERIFIED) {
    if (normType === 'phone') {
      updateFields.phoneVerified = true;
      updateFields.phoneVerifiedAt = now;
      updateFields.phoneVerificationStatus = VERIFICATION_STATUSES.VERIFIED;
    } else if (normType === 'email') {
      updateFields.emailVerified = true;
      updateFields.emailVerifiedAt = now;
    } else if (normType === 'identity') {
      updateFields.identityVerificationStatus = VERIFICATION_STATUSES.VERIFIED;
      updateFields.identityVerifiedAt = now;
    } else if (normType === 'experience') {
      updateFields.experienceVerificationStatus = VERIFICATION_STATUSES.VERIFIED;
      updateFields.experienceVerifiedAt = now;
    } else if (normType === 'certificates') {
      updateFields.certificatesVerificationStatus = VERIFICATION_STATUSES.VERIFIED;
      updateFields.certificatesVerifiedAt = now;
    }
  } else {
    // REJECTED, PENDING, or NOT_VERIFIED
    if (normType === 'phone') {
      updateFields.phoneVerified = false;
      updateFields.phoneVerifiedAt = null;
      updateFields.phoneVerificationStatus = normStatus;
    } else if (normType === 'email') {
      updateFields.emailVerified = false;
      updateFields.emailVerifiedAt = null;
    } else if (normType === 'identity') {
      updateFields.identityVerificationStatus = normStatus;
      if (normStatus !== VERIFICATION_STATUSES.VERIFIED) updateFields.identityVerifiedAt = null;
    } else if (normType === 'experience') {
      updateFields.experienceVerificationStatus = normStatus;
      if (normStatus !== VERIFICATION_STATUSES.VERIFIED) updateFields.experienceVerifiedAt = null;
    } else if (normType === 'certificates') {
      updateFields.certificatesVerificationStatus = normStatus;
      if (normStatus !== VERIFICATION_STATUSES.VERIFIED) updateFields.certificatesVerifiedAt = null;
    }
  }

  if (notes !== undefined) {
    updateFields.verificationNotes = typeof notes === 'string' ? notes.trim().slice(0, 1000) : null;
  }

  const updatedUser = await User.findByIdAndUpdate(
    targetUserId,
    { $set: updateFields },
    { new: true }
  );

  // Update latest document for this user & type if one exists
  const latestDoc = await VerificationDocument.findOne({
    userId: targetUserId,
    verificationType: normType
  }).sort({ createdAt: -1 });

  if (latestDoc) {
    latestDoc.status = normStatus;
    latestDoc.reviewedBy = adminId || null;
    latestDoc.reviewedAt = now;
    if (adminNotesOrReason(notes, rejectionReason)) {
      latestDoc.adminNotes = adminNotesOrReason(notes, rejectionReason);
    }
    if (normStatus === VERIFICATION_STATUSES.REJECTED && (rejectionReason || notes)) {
      latestDoc.rejectionReason = rejectionReason || notes;
    }
    await latestDoc.save();
  }

  return {
    success: true,
    verification: getVerificationDetails(updatedUser, latestDoc ? { hasDocument: true, status: latestDoc.status } : null)
  };
};

const adminNotesOrReason = (notes, rejectionReason) => {
  const val = rejectionReason || notes;
  return typeof val === 'string' ? val.trim().slice(0, 1000) : null;
};

/**
 * Retrieves the latest document for a target user and category with a time-limited signed URL for Admin review.
 *
 * @param {string} targetUserId
 * @param {string} [verificationType='identity'] - 'identity' | 'experience' | 'certificates'
 * @returns {Promise<Object>} { success, signedUrl, document }
 */
export const adminGetLatestUserDocument = async (targetUserId, verificationType = 'identity') => {
  if (!targetUserId) throw new Error('User ID is required');
  const normType = String(verificationType || 'identity').trim().toLowerCase();

  const doc = await VerificationDocument.findOne({
    userId: targetUserId,
    verificationType: normType
  }).sort({ createdAt: -1 });

  if (!doc) {
    return {
      success: false,
      message: `No ${normType} document found for this user`
    };
  }

  const signedUrl = generateSignedDocumentUrl(doc.publicId, doc.resourceType || 'image', 3600);

  return {
    success: true,
    signedUrl,
    document: {
      id: String(doc._id),
      verificationType: doc.verificationType,
      originalFilename: doc.originalFilename,
      mimetype: doc.mimetype,
      size: doc.size,
      status: doc.status,
      userNotes: doc.userNotes,
      createdAt: doc.createdAt,
      reviewedAt: doc.reviewedAt
    }
  };
};

/**
 * Backward-compatible wrapper for identity document retrieval.
 */
export const adminGetLatestUserIdentityDocument = async (targetUserId) => {
  return adminGetLatestUserDocument(targetUserId, 'identity');
};

/**
 * Retrieves pending verification requests across all users for Admin moderation.
 */
export const getPendingVerifications = async (limit = 50) => {
  const pendingUsers = await User.find({
    $or: [
      { phoneVerificationStatus: VERIFICATION_STATUSES.PENDING },
      { identityVerificationStatus: VERIFICATION_STATUSES.PENDING },
      { experienceVerificationStatus: VERIFICATION_STATUSES.PENDING },
      { certificatesVerificationStatus: VERIFICATION_STATUSES.PENDING },
      { verifiedProfileStatus: VERIFICATION_STATUSES.PENDING }
    ]
  })
    .select('_id fullName email role phone phoneVerificationStatus identityVerificationStatus experienceVerificationStatus certificatesVerificationStatus verifiedProfileStatus verificationNotes createdAt')
    .limit(limit);

  const userIds = pendingUsers.map((u) => u._id);

  // Find latest documents for pending users
  const docs = await VerificationDocument.find({
    userId: { $in: userIds }
  }).sort({ createdAt: -1 });

  const docMap = new Map();
  for (const doc of docs) {
    const key = `${String(doc.userId)}_${doc.verificationType}`;
    if (!docMap.has(key)) {
      docMap.set(key, doc);
    }
  }

  return pendingUsers.map((u) => {
    const idDoc = docMap.get(`${String(u._id)}_identity`);
    const expDoc = docMap.get(`${String(u._id)}_experience`);
    const certDoc = docMap.get(`${String(u._id)}_certificates`);
    
    const details = getVerificationDetails(u, {
      identityHasDocument: Boolean(idDoc),
      identityDocumentStatus: idDoc?.status || null,
      experienceHasDocument: Boolean(expDoc),
      experienceDocumentStatus: expDoc?.status || null,
      certificatesHasDocument: Boolean(certDoc),
      certificatesDocumentStatus: certDoc?.status || null,
      hasDocument: Boolean(idDoc || expDoc || certDoc)
    });

    return {
      userId: String(u._id),
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      phone: u.phone,
      pendingTypes: [
        u.phoneVerificationStatus === VERIFICATION_STATUSES.PENDING ? 'phone' : null,
        u.identityVerificationStatus === VERIFICATION_STATUSES.PENDING ? 'identity' : null,
        u.experienceVerificationStatus === VERIFICATION_STATUSES.PENDING ? 'experience' : null,
        u.certificatesVerificationStatus === VERIFICATION_STATUSES.PENDING ? 'certificates' : null,
        u.verifiedProfileStatus === VERIFICATION_STATUSES.PENDING ? 'profile' : null
      ].filter(Boolean),
      hasIdentityDocument: Boolean(idDoc),
      hasExperienceDocument: Boolean(expDoc),
      hasCertificatesDocument: Boolean(certDoc),
      latestDocument: idDoc || expDoc || certDoc
        ? {
            id: String((idDoc || expDoc || certDoc)._id),
            verificationType: (idDoc || expDoc || certDoc).verificationType,
            originalFilename: (idDoc || expDoc || certDoc).originalFilename,
            mimetype: (idDoc || expDoc || certDoc).mimetype,
            size: (idDoc || expDoc || certDoc).size,
            createdAt: (idDoc || expDoc || certDoc).createdAt
          }
        : null,
      verificationDetails: details,
      verificationNotes: u.verificationNotes || null,
      createdAt: u.createdAt
    };
  });
};

export default {
  VERIFICATION_STATUSES,
  VERIFICATION_TYPES,
  normalizeVerificationStatus,
  getVerificationDetails,
  getPublicVerification,
  uploadUserVerificationDocument,
  uploadIdentityDocument,
  requestVerification,
  adminUpdateVerification,
  adminGetLatestUserDocument,
  adminGetLatestUserIdentityDocument,
  getPendingVerifications
};
