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

// Public routes
router.get('/search', searchWorkers);

// Protected routes (require authentication)
router.get('/me', auth, getMyProfile);
router.post('/profile', auth, upsertProfile);

// Photo upload route
router.post('/upload-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get the uploaded file URL
    // In production with Cloudinary, you would get the URL from Cloudinary
    // For now, we'll use a local URL or a placeholder
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const photoUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    // For production, you might want to use Cloudinary
    // const photoUrl = `https://res.cloudinary.com/your-cloud/image/upload/v123/${req.file.filename}`;
    
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

// Get worker by ID (public)
router.get('/:id', getWorkerById);

module.exports = router;