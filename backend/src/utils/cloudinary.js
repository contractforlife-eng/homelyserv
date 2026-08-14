import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

const REQUIRED_ENV_VARS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
let cloudinaryConfigured = false;

const getMissingEnvVars = () => REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

const configureCloudinary = () => {
  const missing = getMissingEnvVars();
  if (missing.length > 0) return false;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  cloudinaryConfigured = true;
  return true;
};

if (!configureCloudinary()) {
  console.warn(`[CLOUDINARY] Not configured. Missing env vars: ${getMissingEnvVars().join(', ')}`);
}

class CloudinaryConfigurationError extends Error {
  constructor() {
    super('Profile photo storage is not configured');
    this.name = 'CloudinaryConfigurationError';
    this.code = 'CLOUDINARY_NOT_CONFIGURED';
  }
}

const assertCloudinaryConfigured = () => {
  // Environment loading may happen after ESM dependency evaluation. Configure
  // lazily at upload time as well as eagerly above so local .env startup order
  // cannot leave the Cloudinary SDK in an unconfigured state.
  if (!cloudinaryConfigured && !configureCloudinary()) throw new CloudinaryConfigurationError();
};

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

const uploadFromBuffer = (fileBuffer, options = {}) => {
  assertCloudinaryConfigured();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'homelyserv',
        ...options
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

const uploadImage = async (fileBuffer, options = {}) => {
  try {
    const result = await uploadFromBuffer(fileBuffer, options);
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

const deleteImage = async (publicId) => {
  try {
    assertCloudinaryConfigured();
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

export { cloudinary, upload, uploadFromBuffer, uploadImage, deleteImage, CloudinaryConfigurationError };
export default { cloudinary, upload, uploadFromBuffer, uploadImage, deleteImage };
