import multer from 'multer';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
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

/**
 * Custom Multer storage engine that:
 * 1. Acquires a video slot before accepting video file payload.
 * 2. Streams video directly to disk.
 * 3. Hashes video content incrementally on-the-fly during write stream.
 * 4. Captures header chunk for magic-byte validation.
 * 5. Attaches cleanup hook to req.on('close') for client abort.
 */
class WallMediaStorage {
  _handleFile(req, file, cb) {
    const isVideo = file.fieldname === 'video';
    if (isVideo) {
      if (!acquireVideoUploadSlot()) {
        const err = new Error('TOO_MANY_CONCURRENT_UPLOADS');
        err.code = 'UPLOAD_CONCURRENCY_LIMIT';
        return cb(err);
      }
      req._videoSlotAcquired = true;
    }

    const ext = path.extname(file.originalname) || '';
    const tempDir = getUploadTempDir();
    const tempPath = path.join(tempDir, `wall_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
    const outStream = fs.createWriteStream(tempPath);
    const hash = crypto.createHash('sha256');
    let headerBuffer = Buffer.alloc(0);
    let bytesWritten = 0;

    // Attach client abort / close listener
    const cleanupOnAbort = () => {
      if (req._videoSlotAcquired) {
        releaseVideoUploadSlot();
        req._videoSlotAcquired = false;
      }
      outStream.destroy();
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch {}
    };

    req.once('aborted', cleanupOnAbort);
    req.once('close', () => {
      if (!req.complete && !req._uploadFinished) {
        cleanupOnAbort();
      }
    });

    file.stream.on('data', (chunk) => {
      bytesWritten += chunk.length;
      if (headerBuffer.length < 32) {
        headerBuffer = Buffer.concat([headerBuffer, chunk]).subarray(0, 32);
      }
      hash.update(chunk);
    });

    file.stream.on('error', (err) => {
      cleanupOnAbort();
      cb(err);
    });

    outStream.on('error', (err) => {
      cleanupOnAbort();
      cb(err);
    });

    outStream.on('finish', () => {
      req._uploadFinished = true;
      cb(null, {
        path: tempPath,
        size: bytesWritten,
        hash: hash.digest('hex'),
        headerChunk: headerBuffer,
        isVideo
      });
    });

    file.stream.pipe(outStream);
  }

  _removeFile(_req, file, cb) {
    if (file?.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch {}
    }
    cb(null);
  }
}

const uploadMiddleware = multer({
  storage: new WallMediaStorage(),
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
    if (err) {
      if (req._videoSlotAcquired) {
        releaseVideoUploadSlot();
        req._videoSlotAcquired = false;
      }
      return next(err);
    }
    next();
  });
};

let customTempDir = null;
let videoStorageAdapter = null;

export const setCustomTempDir = (dir) => {
  customTempDir = dir;
};

export const resetCustomTempDir = () => {
  customTempDir = null;
};

export const getUploadTempDir = () => customTempDir || os.tmpdir();

export const setVideoStorageAdapter = (adapter) => {
  videoStorageAdapter = adapter;
};

export const resetVideoStorageAdapter = () => {
  videoStorageAdapter = null;
};

export const uploadWallVideoStream = (filePath) => {
  if (typeof videoStorageAdapter === 'function') {
    return videoStorageAdapter(filePath);
  }
  return new Promise((resolve, reject) => {
    try {
      if (!cloudinary.config().api_key) {
        return reject(new Error('CLOUDINARY_NOT_CONFIGURED'));
      }
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
      fileStream.on('error', reject);
      fileStream.pipe(uploadStream);
    } catch (e) {
      reject(e);
    }
  });
};

export const deleteWallMedia = async (publicId, resourceType = 'image') => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: 'upload' });
};
