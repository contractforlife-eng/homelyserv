const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  upsertProfile,
  getMyProfile,
  searchWorkers,
  getWorkerById
} = require('../controllers/workerController');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + req.userId + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// ============================================
// PUBLIC ROUTES - No authentication required
// ============================================

// Search workers with filters
router.get('/search', searchWorkers);

// Get worker by ID (public)
router.get('/:id', getWorkerById);

// ============================================
// PROTECTED ROUTES - Authentication required
// ============================================

// Get my worker profile
router.get('/me', auth, getMyProfile);

// Create or update worker profile
router.post('/profile', auth, upsertProfile);

// Upload profile photo
router.post('/upload-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const photoUrl = `${baseUrl}/uploads/${req.file.filename}`;

    console.log('Worker photo uploaded:', photoUrl);

    res.json({
      url: photoUrl,
      message: 'Photo uploaded successfully',
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      message: 'Upload failed',
      error: error.message
    });
  }
});

module.exports = router;