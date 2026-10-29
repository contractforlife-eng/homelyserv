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
 * Generates a signed, time-limited URL for secure review by Admin/Staff or Employer.
 * Raw URLs are NEVER public or permanent.
 *
 * @param {string} publicId - Cloudinary authenticated public ID
 * @param {string} resourceType - 'image' or 'raw'
 * @param {number} expiresInSeconds - Default 3600 (1 hour)
 * @param {string|null} [downloadFilename=null] - Optional original filename to preserve on download via attachment flag
 * @returns {string} Signed URL
 */
export const generateSignedDocumentUrl = (publicId, resourceType = 'image', expiresInSeconds = 3600, downloadFilename = null) => {
  if (!publicId) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  let sanitizedAttachment = null;
  if (downloadFilename && typeof downloadFilename === 'string') {
    const fallbackExt = resourceType === 'raw' ? 'pdf' : 'jpg';
    let clean = downloadFilename
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/[\x00-\x1f\x80-\x9f]/g, '')
      .trim();
    const dotIdx = clean.lastIndexOf('.');
    if (dotIdx === -1 || dotIdx === clean.length - 1) {
      clean = clean.replace(/\.+$/, '') + '.' + fallbackExt;
    }
    sanitizedAttachment = clean;
  }

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || cloudinary.config().cloud_name;
    if (!cloudName) {
      // In unconfigured or test environments, return a safe placeholder signed URL structure
      return `https://res.cloudinary.com/homelyserv/${resourceType || 'image'}/authenticated/s--test--/v1/${publicId}`;
    }
    const urlOptions = {
      type: 'authenticated',
      sign_url: true,
      expires_at: expiresAt,
      resource_type: resourceType || 'image',
      cloud_name: cloudName,
      secure: true,
      ...(resourceType === 'image' && !sanitizedAttachment ? { transformation: [{ width: 1600, height: 1600, crop: 'limit' }] } : {})
    };

    if (sanitizedAttachment) {
      urlOptions.flags = `attachment:${sanitizedAttachment}`;
    }

    return cloudinary.url(publicId, urlOptions);
  } catch (error) {
    console.error('Failed to generate signed document URL:', error);
    return null;
  }
};

/**
 * Generates an authenticated, signed download URL for private documents using Cloudinary's private_download_url.
 *
 * @param {string} publicId
 * @param {string} resourceType - 'raw' or 'image'
 * @param {string} format - 'pdf', 'png', 'jpg', etc.
 * @param {number} expiresInSeconds
 * @returns {string|null}
 */
export const generatePrivateDownloadUrl = (publicId, resourceType = 'raw', format = '', expiresInSeconds = 3600) => {
  if (!publicId) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || cloudinary.config().cloud_name;
    const apiKey = process.env.CLOUDINARY_API_KEY || cloudinary.config().api_key;
    const apiSecret = process.env.CLOUDINARY_API_SECRET || cloudinary.config().api_secret;

    if (!cloudName || !apiKey || !apiSecret) {
      return `https://res.cloudinary.com/homelyserv/${resourceType || 'raw'}/authenticated/s--test--/v1/${publicId}`;
    }

    return cloudinary.utils.private_download_url(publicId, format || '', {
      resource_type: resourceType || 'raw',
      type: 'authenticated',
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error('Failed to generate private download URL:', error);
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
  generatePrivateDownloadUrl,
  deleteVerificationDocument
};
