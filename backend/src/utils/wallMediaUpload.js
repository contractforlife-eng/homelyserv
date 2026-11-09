import multer from 'multer';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { cloudinary, uploadFromBuffer } from './cloudinary.js';

export const MAX_WALL_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_WALL_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
export const MAX_CONCURRENT_VIDEO_UPLOADS = 2; // Strict concurrency cap per Node process

let activeVideoUploads = 0;

export const acquireVideoUploadSlot = () => {
  if (activeVideoUploads >= MAX_CONCURRENT_VIDEO_UPLOADS) {
    return false;
  }
  activeVideoUploads++;
  return true;
};

export const releaseVideoUploadSlot = () => {
  if (activeVideoUploads > 0) {
    activeVideoUploads--;
  }
};

export const getActiveVideoUploads = () => activeVideoUploads;

const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedVideoMimeTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

export const detectWallImageType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
};

export const detectWallVideoType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null;
  // WebM / Matroska starts with EBML ID 0x1A45DFA3
  if (buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    return 'video/webm';
  }
  if (buffer.length < 12) return null;
  // ISO base media file format (MP4 / QuickTime MOV): bytes 4-8 equal 'ftyp' or 'moov' or 'mdat'
  const brand = buffer.subarray(4, 8).toString('ascii');
  if (brand === 'ftyp' || brand === 'moov' || brand === 'mdat') {
    // Check subtype or default to mp4
    const majorBrand = buffer.subarray(8, 12).toString('ascii').toLowerCase();
    if (majorBrand.includes('qt')) return 'video/quicktime';
    return 'video/mp4';
  }
  return null;
};

// Disk-backed streaming storage for bounded memory footprint
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `wall_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const uploadMiddleware = multer({
  storage: diskStorage,
  limits: { fileSize: MAX_WALL_VIDEO_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    const fieldName = file.fieldname;
    const mime = String(file.mimetype || '').toLowerCase();
    if (fieldName === 'video') {
      if (allowedVideoMimeTypes.has(mime)) return callback(null, true);
      const error = new Error('INVALID_VIDEO');
      error.code = 'INVALID_VIDEO';
      return callback(error);
    }
    if (allowedImageMimeTypes.has(mime)) return callback(null, true);
    const error = new Error('INVALID_IMAGE');
    error.code = 'INVALID_IMAGE';
    return callback(error);
  }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);

export const wallMediaUpload = (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

export const uploadWallVideoStream = (filePath) => {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'homelyserv/wall/videos',
        resource_type: 'video',
        type: 'upload'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    fileStream.pipe(uploadStream);
  });
};

export const deleteWallMedia = async (publicId, resourceType = 'image') => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: 'upload' });
};
