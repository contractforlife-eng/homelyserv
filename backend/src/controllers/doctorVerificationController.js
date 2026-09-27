// backend/src/controllers/doctorVerificationController.js
// ============================================================
// DOCTOR VERIFICATION CONTROLLER
// ============================================================
// Handles Doctor-specific Trust & Verification operations:
//
//   SELF-SERVICE (role: DOCTOR, own profile only)
//   - GET  own verification status
//   - POST upload an evidence document (identity / experience / certificates)
//   - POST request a manual review (phone / identity / experience / certificates)
//   - GET  own stored evidence document (time-limited signed URL)
//
//   REVIEW (roles: ADMIN "Co-Admin" and SUPPORT "Sup-Admin" — EQUAL authority)
//   - GET  full verification state + audit trail for a Doctor
//   - PATCH change any verification status, including the authoritative
//          Verified Profile status (an explicit administrative decision)
//   - GET  a Doctor's evidence document for review
//
//   READ-ONLY (role: SUPPORT_HELPER "Sup-Help")
//   - GET  verification status + audit trail
//   - GET  documents permitted for support read-only viewing
//   - NO status changes, NO approvals, NO rejections, ever.
//
// SECURITY NOTES
//   - Every decision is authorised from req.userRole, which the
//     authentication middleware derives from a signed JWT. Client-supplied
//     roles are never trusted.
//   - A reviewer can never review their own Doctor profile, so an account
//     holding a staff role and a Doctor profile cannot self-approve.
//   - Email/phone confirmation NEVER grants the authoritative Verified
//     Profile status; that is only ever set by ADMIN/SUPPORT here.
//   - Every ADMIN/SUPPORT decision writes an immutable audit record.
// ============================================================
import User from '../models/User.js';
import DoctorVerificationAudit from '../models/DoctorVerificationAudit.js';
import {
  VERIFICATION_STATUSES,
  getVerificationDetails,
  adminUpdateVerification,
  uploadUserVerificationDocument,
  requestVerification,
  adminGetLatestUserDocument
} from '../services/profileVerificationService.js';

// ============================================================
// ROLE CONSTANTS
// ============================================================
/**
 * Roles with EQUAL Doctor verification authority.
 * ADMIN (Co-Admin) and SUPPORT (Sup-Admin) are intentionally treated as one
 * tier: Sup-Admin is never given less Doctor verification power than Admin,
 * and never more.
 */
export const DOCTOR_VERIFICATION_REVIEW_ROLES = Object.freeze(['ADMIN', 'SUPPORT']);

/**
 * Roles with READ-ONLY Doctor verification visibility.
 * SUPPORT_HELPER (Sup-Help) may see status and permitted documents but can
 * never change, approve or reject anything.
 */
export const DOCTOR_VERIFICATION_READONLY_ROLES = Object.freeze(['SUPPORT_HELPER']);

/** Verification types a Doctor may self-service. */
const DOCTOR_SELF_SERVICE_TYPES = Object.freeze(['phone', 'identity', 'experience', 'certificates']);

/** Verification types that accept an uploaded evidence document. */
const DOCTOR_DOCUMENT_TYPES = Object.freeze(['identity', 'experience', 'certificates']);

/** Verification types a reviewer (ADMIN/SUPPORT) may change. */
const DOCTOR_REVIEWABLE_TYPES = Object.freeze([
  'phone',
  'email',
  'identity',
  'experience',
  'certificates',
  'profile',
  'verifiedprofile'
]);

/** Audit-record vocabulary for each reviewable verification type. */
const AUDIT_TYPE_BY_REVIEW_TYPE = Object.freeze({
  phone: 'PHONE',
  email: 'EMAIL',
  identity: 'IDENTITY_DOCUMENT',
  experience: 'WORK_EXPERIENCE',
  certificates: 'CERTIFICATES_LICENSES',
  profile: 'PROFILE',
  verifiedprofile: 'PROFILE'
});

const VALID_STATUS_VALUES = Object.freeze(Object.values(VERIFICATION_STATUSES));

// ============================================================
// HELPERS
// ============================================================
const normalizeRole = (role) => String(role || '').trim().toUpperCase();

const isReviewer = (role) => DOCTOR_VERIFICATION_REVIEW_ROLES.includes(normalizeRole(role));
const canReadVerification = (role) =>
  isReviewer(role) || DOCTOR_VERIFICATION_READONLY_ROLES.includes(normalizeRole(role));

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

/**
 * Checks whether the authenticated role may perform a verification action.
 * Returns true when allowed. When denied, writes the 403 response and returns
 * false, so callers can simply `if (!allow) return;`.
 *
 * Frontend hiding is never relied upon; this is the server-side gate.
 */
const isAllowed = (req, res, allowed) => {
  const role = normalizeRole(req.userRole);
  if (allowed.includes(role)) return true;

  res.status(403).json({
    success: false,
    message: 'Insufficient permissions for Doctor verification.',
    required: [...allowed],
    current: req.userRole || null
  });
  return false;
};

/**
 * Loads the target Doctor, guaranteeing the target really is a DOCTOR.
 * A Doctor profile is never substituted with a WorkerProfile.
 */
const loadDoctor = async (res, doctorId) => {
  if (!isValidObjectId(String(doctorId))) {
    res.status(400).json({ success: false, message: 'Invalid doctor ID' });
    return null;
  }

  const doctor = await User.findById(doctorId);
  if (!doctor) {
    res.status(404).json({ success: false, message: 'Doctor not found' });
    return null;
  }

  if (doctor.role !== 'DOCTOR') {
    res.status(400).json({ success: false, message: 'User is not a Doctor' });
    return null;
  }

  return doctor;
};

/**
 * Latest document availability flags so the UI can tell "no evidence uploaded"
 * apart from "evidence uploaded but not yet reviewed".
 */
const buildDocumentSummary = async (doctorId) => {
  try {
    const VerificationDocument = (await import('../models/VerificationDocument.js')).default;
    const docs = await VerificationDocument.find({ userId: doctorId })
      .sort({ createdAt: -1 })
      .lean();

    const latestByType = new Map();
    for (const doc of docs) {
      if (!latestByType.has(doc.verificationType)) {
        latestByType.set(doc.verificationType, doc);
      }
    }

    const identity = latestByType.get('identity');
    const experience = latestByType.get('experience');
    const certificates = latestByType.get('certificates');

    return {
      identityHasDocument: Boolean(identity),
      identityDocumentStatus: identity?.status || null,
      experienceHasDocument: Boolean(experience),
      experienceDocumentStatus: experience?.status || null,
      certificatesHasDocument: Boolean(certificates),
      certificatesDocumentStatus: certificates?.status || null,
      hasDocument: Boolean(identity || experience || certificates)
    };
  } catch (error) {
    console.error('Error loading doctor document summary:', error);
    return null;
  }
};

const readAuditTrail = async (doctorId, limit = 50) => {
  const rows = await DoctorVerificationAudit.find({ doctorId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('reviewerId', 'fullName email role')
    .lean();

  return rows.map((row) => ({
    id: String(row._id),
    doctorId: String(row.doctorId),
    verificationType: row.verificationType,
    previousStatus: row.previousStatus,
    newStatus: row.newStatus,
    reviewerId: row.reviewerId ? String(row.reviewerId._id || row.reviewerId) : null,
    reviewerName: row.reviewerId?.fullName || null,
    reviewerRole: row.reviewerRole,
    rejectionReason: row.rejectionReason || null,
    notes: row.notes || null,
    timestamp: row.createdAt
  }));
};

// ============================================================
// SELF-SERVICE — DOCTOR (own profile only)
// ============================================================

/**
 * GET /api/doctors/verification
 * Current authenticated Doctor's own Trust & Verification state.
 */
export const getDoctorVerification = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Doctor user not found' });
    }

    const documentInfo = await buildDocumentSummary(user._id);
    const verification = getVerificationDetails(user, documentInfo);

    return res.json({
      success: true,
      verification,
      // Makes the read-only rule explicit to the client: a Doctor can see
      // their own status but can never decide it.
      canSubmitEvidence: true,
      canChangeStatus: false
    });
  } catch (error) {
    console.error('Error fetching doctor verification:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching doctor verification',
      error: error.message
    });
  }
};

/**
 * POST /api/doctors/verification/request
 * A Doctor asks for manual review of a signal they cannot confirm themselves
 * (phone) or re-submits evidence text for a category awaiting review.
 *
 * The Doctor may only move a category to PENDING. Authoritative Verified
 * Profile status is NOT requestable: it is an administrative decision.
 */
export const requestDoctorVerification = async (req, res) => {
  try {
    const { type, notes } = req.body || {};
    const normType = String(type || '').trim().toLowerCase();

    if (!DOCTOR_SELF_SERVICE_TYPES.includes(normType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid verification type. Doctor may request: ${DOCTOR_SELF_SERVICE_TYPES.join(', ')}`
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Doctor user not found' });
    }

    if (user.role !== 'DOCTOR') {
      return res.status(403).json({ success: false, message: 'Access denied. Doctor role required.' });
    }

    const verification = await requestVerification(user._id, { type: normType, notes });

    return res.json({
      success: true,
      message: 'Verification request submitted and is pending administrative review.',
      verification
    });
  } catch (error) {
    console.error('Error requesting doctor verification:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Server error requesting verification'
    });
  }
};

/**
 * POST /api/doctors/verification/:type/document
 * Uploads an evidence document for identity, work experience, or
 * certifications/licenses. Uploading moves that category to PENDING.
 */
export const uploadDoctorVerificationDocument = async (req, res) => {
  try {
    const normType = String(req.params.type || '').trim().toLowerCase();

    if (!DOCTOR_DOCUMENT_TYPES.includes(normType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid verification type. Documents may be uploaded for: ${DOCTOR_DOCUMENT_TYPES.join(', ')}`
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document file was uploaded' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Doctor user not found' });
    }

    if (user.role !== 'DOCTOR') {
      return res.status(403).json({ success: false, message: 'Access denied. Doctor role required.' });
    }

    const { notes } = req.body || {};

    const result = await uploadUserVerificationDocument({
      userId: user._id,
      verificationType: normType,
      fileBuffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalFilename: req.file.originalname,
      size: req.file.size,
      notes: notes || ''
    });

    return res.json({
      ...result,
      canChangeStatus: false
    });
  } catch (error) {
    console.error('Error uploading doctor verification document:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Server error uploading verification document'
    });
  }
};

/**
 * GET /api/doctors/verification/:type/document
 * The Doctor retrieves a short-lived signed URL for their OWN evidence.
 * No other Doctor's document is reachable from this route: the target user
 * is always the authenticated caller, never a path parameter.
 */
export const getDoctorOwnVerificationDocument = async (req, res) => {
  try {
    const normType = String(req.params.type || '').trim().toLowerCase();

    if (!DOCTOR_DOCUMENT_TYPES.includes(normType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid verification type. Documents exist for: ${DOCTOR_DOCUMENT_TYPES.join(', ')}`
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Doctor user not found' });
    }

    if (user.role !== 'DOCTOR') {
      return res.status(403).json({ success: false, message: 'Access denied. Doctor role required.' });
    }

    const result = await adminGetLatestUserDocument(user._id, normType);
    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Error fetching own doctor verification document:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching verification document',
      error: error.message
    });
  }
};

// ============================================================
// REVIEW — ADMIN (Co-Admin) AND SUPPORT (Sup-Admin), EQUAL AUTHORITY
// ============================================================

/**
 * GET /api/admin/doctors/:doctorId/verification
 * GET /api/support/doctors/:doctorId/verification
 */
export const getDoctorVerificationForReview = async (req, res) => {
  if (!isAllowed(req, res, DOCTOR_VERIFICATION_REVIEW_ROLES)) return;

  try {
    const doctor = await loadDoctor(res, req.params.doctorId);
    if (!doctor) return;

    const documentInfo = await buildDocumentSummary(doctor._id);
    const verification = getVerificationDetails(doctor, documentInfo);
    const auditTrail = await readAuditTrail(doctor._id);

    return res.json({
      success: true,
      canReview: true,
      canChangeStatus: true,
      doctor: {
        id: String(doctor._id),
        fullName: doctor.fullName,
        email: doctor.email,
        role: doctor.role
      },
      verification,
      auditTrail
    });
  } catch (error) {
    console.error('Error fetching doctor verification for review:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching verification for review',
      error: error.message
    });
  }
};

/**
 * PATCH /api/admin/doctors/:doctorId/verification
 * PATCH /api/support/doctors/:doctorId/verification
 *
 * Changes one verification category and records an immutable audit entry.
 * ADMIN and SUPPORT are accepted here with identical rights.
 */
export const updateDoctorVerification = async (req, res) => {
  if (!isAllowed(req, res, DOCTOR_VERIFICATION_REVIEW_ROLES)) return;

  try {
    const { doctorId } = req.params;
    const { type, status, notes, rejectionReason } = req.body || {};
    const reviewerId = req.userId;
    const reviewerRole = normalizeRole(req.userRole);

    const normType = String(type || '').trim().toLowerCase();
    if (!DOCTOR_REVIEWABLE_TYPES.includes(normType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid verification type. Supported: ${DOCTOR_REVIEWABLE_TYPES.join(', ')}`
      });
    }

    const normStatus = String(status || '').trim().toUpperCase();
    if (!VALID_STATUS_VALUES.includes(normStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid verification status. Allowed: ${VALID_STATUS_VALUES.join(', ')}`
      });
    }

    if (normStatus === VERIFICATION_STATUSES.REJECTED && !String(rejectionReason || '').trim()) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required when rejecting a verification.'
      });
    }

    const doctor = await loadDoctor(res, doctorId);
    if (!doctor) return;

    // No self-review: staff who also hold a Doctor profile cannot approve it.
    if (String(doctor._id) === String(reviewerId)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot review your own Doctor verification.'
      });
    }

    const before = getVerificationDetails(doctor);
    const previousStatus = resolveCurrentStatus(before, normType);

    let result;
    try {
      result = await adminUpdateVerification(
        doctor._id,
        { type: normType, status: normStatus, notes, rejectionReason },
        reviewerId
      );
    } catch (serviceError) {
      return res.status(400).json({ success: false, message: serviceError.message });
    }

    // Immutable audit trail. Written after the decision so it always records
    // an applied change; the append-only model rejects any later mutation.
    await DoctorVerificationAudit.create({
      doctorId: doctor._id,
      verificationType: AUDIT_TYPE_BY_REVIEW_TYPE[normType],
      previousStatus,
      newStatus: normStatus,
      reviewerId,
      reviewerRole,
      rejectionReason: normStatus === VERIFICATION_STATUSES.REJECTED
        ? String(rejectionReason).trim().slice(0, 1000)
        : null,
      notes: typeof notes === 'string' && notes.trim() ? notes.trim().slice(0, 1000) : null
    });

    return res.json({ ...result, canChangeStatus: true });
  } catch (error) {
    console.error('Error updating doctor verification:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating verification',
      error: error.message
    });
  }
};

/**
 * GET /api/admin/doctors/:doctorId/verification/document
 * GET /api/support/doctors/:doctorId/verification/document
 */
export const getDoctorVerificationDocument = async (req, res) => {
  if (!isAllowed(req, res, DOCTOR_VERIFICATION_REVIEW_ROLES)) return;

  try {
    const normType = String(req.query.type || 'identity').trim().toLowerCase();
    if (!DOCTOR_DOCUMENT_TYPES.includes(normType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid verification type. Documents exist for: ${DOCTOR_DOCUMENT_TYPES.join(', ')}`
      });
    }

    const doctor = await loadDoctor(res, req.params.doctorId);
    if (!doctor) return;

    const result = await adminGetLatestUserDocument(doctor._id, normType);
    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Error fetching doctor verification document:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching verification document',
      error: error.message
    });
  }
};

const resolveCurrentStatus = (verification, normType) => {
  if (normType === 'phone') return verification.phone?.status || VERIFICATION_STATUSES.NOT_VERIFIED;
  if (normType === 'email') return verification.email?.status || VERIFICATION_STATUSES.NOT_VERIFIED;
  if (normType === 'identity') return verification.identity?.status || VERIFICATION_STATUSES.NOT_VERIFIED;
  if (normType === 'experience') return verification.experience?.status || VERIFICATION_STATUSES.NOT_VERIFIED;
  if (normType === 'certificates') return verification.certificates?.status || VERIFICATION_STATUSES.NOT_VERIFIED;
  return verification.profile?.status || VERIFICATION_STATUSES.NOT_VERIFIED;
};

// ============================================================
// READ-ONLY — SUP-HELP (SUPPORT_HELPER)
// ============================================================

/**
 * GET /api/sup-help/doctors/:doctorId/verification
 * Sup-Help may SEE verification status and the audit trail, and nothing else.
 * The response is explicitly flagged read-only so the client cannot
 * accidentally present a decision control.
 */
export const getDoctorVerificationReadOnly = async (req, res) => {
  if (!isAllowed(req, res, [...DOCTOR_VERIFICATION_REVIEW_ROLES, ...DOCTOR_VERIFICATION_READONLY_ROLES])) return;

  try {
    const doctor = await loadDoctor(res, req.params.doctorId);
    if (!doctor) return;

    const documentInfo = await buildDocumentSummary(doctor._id);
    const verification = getVerificationDetails(doctor, documentInfo);
    const auditTrail = await readAuditTrail(doctor._id);

    return res.json({
      success: true,
      readOnly: true,
      canReview: false,
      canChangeStatus: false,
      canViewDocuments: true,
      doctor: {
        id: String(doctor._id),
        fullName: doctor.fullName,
        email: doctor.email,
        role: doctor.role
      },
      verification,
      auditTrail
    });
  } catch (error) {
    console.error('Error fetching doctor verification (read-only):', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching verification',
      error: error.message
    });
  }
};

/**
 * GET /api/sup-help/doctors/:doctorId/verification/document
 * Sup-Help may open the documents that are permitted for support read-only
 * viewing. The response is a short-lived signed URL to private authenticated
 * storage, never a public URL.
 */
export const getDoctorVerificationDocumentReadOnly = async (req, res) => {
  if (!isAllowed(req, res, [...DOCTOR_VERIFICATION_REVIEW_ROLES, ...DOCTOR_VERIFICATION_READONLY_ROLES])) return;

  try {
    const normType = String(req.query.type || 'identity').trim().toLowerCase();
    if (!DOCTOR_DOCUMENT_TYPES.includes(normType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid verification type. Documents exist for: ${DOCTOR_DOCUMENT_TYPES.join(', ')}`
      });
    }

    const doctor = await loadDoctor(res, req.params.doctorId);
    if (!doctor) return;

    const result = await adminGetLatestUserDocument(doctor._id, normType);
    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.json({ ...result, readOnly: true });
  } catch (error) {
    console.error('Error fetching doctor verification document (read-only):', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching verification document',
      error: error.message
    });
  }
};

export { canReadVerification, isReviewer, DOCTOR_SELF_SERVICE_TYPES, DOCTOR_DOCUMENT_TYPES, DOCTOR_REVIEWABLE_TYPES };

export default {
  getDoctorVerification,
  requestDoctorVerification,
  uploadDoctorVerificationDocument,
  getDoctorOwnVerificationDocument,
  getDoctorVerificationForReview,
  updateDoctorVerification,
  getDoctorVerificationDocument,
  getDoctorVerificationReadOnly,
  getDoctorVerificationDocumentReadOnly
};
