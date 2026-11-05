import multer from 'multer';
import { cloudinary, uploadFromBuffer } from './cloudinary.js';

export const MAX_MARKETPLACE_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const detectMarketplaceImageType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
};

export const marketplaceImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MARKETPLACE_IMAGE_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (allowedMimeTypes.has(String(file.mimetype).toLowerCase())) return callback(null, true);
    const error = new Error('Unsupported marketplace image type');
    error.code = 'INVALID_IMAGE_TYPE';
    return callback(error);
  }
}).single('image');

export const validateMarketplaceImage = (req, res, next) => {
  if (!req.file?.buffer) return res.status(400).json({ success: false, code: 'IMAGE_REQUIRED' });
  const detectedType = detectMarketplaceImageType(req.file.buffer);
  if (!detectedType || detectedType !== String(req.file.mimetype).toLowerCase()) {
    return res.status(400).json({ success: false, code: 'INVALID_IMAGE_CONTENT' });
  }
  req.marketplaceImageType = detectedType;
  next();
};

export const uploadMarketplaceImage = async (buffer) => uploadFromBuffer(buffer, {
  folder: 'homelyserv/marketplace',
  resource_type: 'image',
  type: 'upload',
  transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
});

export const deleteMarketplaceImage = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image', type: 'upload' });
};
