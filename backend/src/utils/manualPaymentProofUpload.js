import multer from 'multer';
import { cloudinary } from './cloudinary.js';
import { uploadFromBuffer, deleteImage } from './cloudinary.js';

const PAYMENT_PROOF_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_PROOF_SIZE = 5 * 1024 * 1024;

const storage = multer.memoryStorage();

export const proofUpload = multer({
  storage,
  limits: {
    fileSize: MAX_PROOF_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (PAYMENT_PROOF_MIME_TYPES.has(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Unsupported payment proof type. Only JPEG, PNG, and WebP are allowed.'));
  },
});

export const uploadProof = async (fileBuffer) => {
  const result = await uploadFromBuffer(fileBuffer, {
    folder: 'homelyserv/manual-payment-proofs',
    resource_type: 'image',
    type: 'authenticated',
  });
  return result;
};

export const generateSignedProofUrl = (publicId, expiresInSeconds = 3600) => {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return cloudinary.url(publicId, {
    type: 'authenticated',
    sign_url: true,
    expires_at: expiresAt,
    resource_type: 'image',
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
  });
};

export const deleteProof = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      type: 'authenticated',
      resource_type: 'image',
    });
  } catch (error) {
    console.error('❌ Orphan proof cleanup failed:', error);
  }
};
