// backend/src/utils/courseMaterialUpload.js
// ============================================================
// COURSE & LESSON MATERIAL UPLOAD INFRASTRUCTURE
// ============================================================
// Provides secure in-memory Multer handling, strict PDF signature
// validation (%PDF- magic bytes), unpredictable entity-scoped public IDs,
// authenticated Cloudinary raw storage, and time-limited signed delivery URLs.
//
// ZERO duplicate Cloudinary initialization - reuses existing config.
// ============================================================
import crypto from 'crypto';
import multer from 'multer';
import { cloudinary, uploadFromBuffer } from './cloudinary.js';

export const MAX_MATERIAL_SIZE = 10 * 1024 * 1024; // 10 MB strict limit

const ALLOWED_MIME_TYPES = new Set(['application/pdf']);
const ALLOWED_EXTENSION = /\.pdf$/i;

const storage = multer.memoryStorage();

/**
 * Validates the in-memory buffer header for the canonical PDF magic signature: %PDF-
 * (Hex: 25 50 44 46 2d)
 *
 * @param {Buffer} buffer
 * @returns {boolean}
 */
export const isValidPdfBuffer = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 5) {
    return false;
  }
  return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
};

/**
 * Multer middleware for uploading material PDF documents.
 */
export const materialUpload = multer({
  storage,
  limits: {
    fileSize: MAX_MATERIAL_SIZE
  },
  fileFilter: (req, file, cb) => {
    const isMimeAllowed = ALLOWED_MIME_TYPES.has(String(file.mimetype || '').toLowerCase());
    const isExtAllowed = ALLOWED_EXTENSION.test(String(file.originalname || '').toLowerCase());

    if (isMimeAllowed && isExtAllowed) {
      return cb(null, true);
    }
    cb(new Error('Invalid document format. Allowed types: PDF (max 10MB).'));
  }
});

/**
 * Middleware executed after Multer to guarantee that the uploaded buffer
 * contains an authentic PDF magic signature (%PDF-) before any Cloudinary request.
 */
export const validatePdfSignature = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No document file was uploaded' });
  }

  if (!isValidPdfBuffer(req.file.buffer)) {
    return res.status(400).json({
      success: false,
      message: 'File content does not match a valid PDF signature (%PDF-).'
    });
  }

  next();
};

/**
 * Generates an unpredictable, entity-scoped Cloudinary public ID.
 * Example: "courses/c_507f1f77bcf86cd799439080_mat_a1b2c3d4e5f67890"
 *
 * @param {'course'|'lesson'} entityType
 * @param {string} entityId
 * @returns {string}
 */
export const generateMaterialPublicId = (entityType, entityId) => {
  const randomSuffix = crypto.randomBytes(12).toString('hex');
  const safeEntityId = String(entityId || '').replace(/[^a-zA-Z0-9]/g, '');
  const prefix = entityType === 'lesson' ? 'lesson' : 'course';
  return `homelyserv/${prefix}-materials/${prefix}_${safeEntityId}_mat_${randomSuffix}`;
};

/**
 * Uploads a validated PDF file buffer to authenticated raw storage in Cloudinary.
 *
 * @param {Buffer} fileBuffer
 * @param {Object} options
 * @param {'course'|'lesson'} options.entityType
 * @param {string} options.entityId
 * @param {string} [options.originalFilename]
 * @returns {Promise<{ public_id: string, bytes: number, format: string, secure_url: string }>}
 */
export const uploadMaterialDocument = async (fileBuffer, { entityType = 'course', entityId = '', originalFilename = '' } = {}) => {
  const publicId = generateMaterialPublicId(entityType, entityId);

  const result = await uploadFromBuffer(fileBuffer, {
    public_id: publicId,
    resource_type: 'raw',
    type: 'authenticated'
  });

  return {
    ...result,
    public_id: publicId,
    resource_type: 'raw'
  };
};

/**
 * Generates a signed, time-limited download URL for an authenticated raw PDF asset.
 *
 * @param {string} publicId - Cloudinary public ID
 * @param {number} [expiresInSeconds=3600] - URL validity TTL (default 1 hour)
 * @returns {string|null}
 */
export const generateSignedMaterialUrl = (publicId, expiresInSeconds = 3600) => {
  if (!publicId) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || cloudinary.config().cloud_name;
    if (!cloudName) {
      // Test/unconfigured fallback: return predictable mock URL structure
      return `https://res.cloudinary.com/homelyserv/raw/authenticated/s--test--/v1/${publicId}`;
    }

    return cloudinary.url(publicId, {
      type: 'authenticated',
      resource_type: 'raw',
      sign_url: true,
      expires_at: expiresAt,
      cloud_name: cloudName
    });
  } catch (error) {
    console.error('Failed to generate signed material URL:', error);
    return null;
  }
};

/**
 * Safely destroys an authenticated raw PDF asset from Cloudinary.
 *
 * @param {string} publicId
 * @returns {Promise<Object>}
 */
export const deleteMaterialDocument = async (publicId) => {
  if (!publicId) return { result: 'not_found' };
  try {
    return await cloudinary.uploader.destroy(publicId, {
      type: 'authenticated',
      resource_type: 'raw'
    });
  } catch (error) {
    console.error('❌ Material document deletion failed:', error);
    throw error;
  }
};

export default {
  MAX_MATERIAL_SIZE,
  materialUpload,
  validatePdfSignature,
  isValidPdfBuffer,
  generateMaterialPublicId,
  uploadMaterialDocument,
  generateSignedMaterialUrl,
  deleteMaterialDocument
};
