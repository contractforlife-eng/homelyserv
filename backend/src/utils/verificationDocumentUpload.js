// backend/src/utils/verificationDocumentUpload.js
import multer from 'multer';
import { cloudinary, uploadFromBuffer } from './cloudinary.js';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
]);

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|pdf)$/i;

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.memoryStorage();

export const documentUpload = multer({
  storage,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE
  },
  fileFilter: (req, file, cb) => {
    const isMimeAllowed = ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase());
    const isExtAllowed = ALLOWED_EXTENSIONS.test(file.originalname.toLowerCase());

    if (isMimeAllowed && isExtAllowed) {
      return cb(null, true);
    }
    cb(new Error('Invalid document format. Allowed types: JPG, PNG, WebP, PDF (max 10MB).'));
  }
});

/**
 * Uploads a document buffer to private/authenticated storage in Cloudinary.
 *
 * @param {Buffer} fileBuffer - In-memory file buffer
 * @param {Object} metadata - { mimetype, originalFilename }
 * @returns {Promise<Object>} Upload result containing public_id, resource_type, etc.
 */
export const uploadVerificationDocument = async (fileBuffer, { mimetype = 'image/jpeg', originalFilename = '' } = {}) => {
  const isPdf = mimetype === 'application/pdf' || originalFilename.toLowerCase().endsWith('.pdf');
  const resourceType = isPdf ? 'raw' : 'image';

  const result = await uploadFromBuffer(fileBuffer, {
    folder: 'homelyserv/verification-documents',
    resource_type: resourceType,
    type: 'authenticated'
  });

  return {
    ...result,
    resource_type: resourceType
  };
};

/**
 * Generates a signed, time-limited URL for secure review by Admin/Staff.
 * Raw URLs are NEVER public or permanent.
 *
 * @param {string} publicId - Cloudinary authenticated public ID
 * @param {string} resourceType - 'image' or 'raw'
 * @param {number} expiresInSeconds - Default 3600 (1 hour)
 * @returns {string} Signed URL
 */
export const generateSignedDocumentUrl = (publicId, resourceType = 'image', expiresInSeconds = 3600) => {
  if (!publicId) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || cloudinary.config().cloud_name;
    if (!cloudName) {
      // In unconfigured or test environments, return a safe placeholder signed URL structure
      return `https://res.cloudinary.com/homelyserv/${resourceType || 'image'}/authenticated/s--test--/v1/${publicId}`;
    }
    return cloudinary.url(publicId, {
      type: 'authenticated',
      sign_url: true,
      expires_at: expiresAt,
      resource_type: resourceType || 'image',
      cloud_name: cloudName,
      ...(resourceType === 'image' ? { transformation: [{ width: 1600, height: 1600, crop: 'limit' }] } : {})
    });
  } catch (error) {
    console.error('Failed to generate signed document URL:', error);
    return null;
  }
};

/**
 * Deletes a verification document from storage.
 *
 * @param {string} publicId
 * @param {string} resourceType
 */
export const deleteVerificationDocument = async (publicId, resourceType = 'image') => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      type: 'authenticated',
      resource_type: resourceType || 'image'
    });
  } catch (error) {
    console.error('❌ Verification document deletion failed:', error);
  }
};

export default {
  documentUpload,
  uploadVerificationDocument,
  generateSignedDocumentUrl,
  deleteVerificationDocument
};
