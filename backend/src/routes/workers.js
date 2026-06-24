const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const {
  upsertProfile, getMyProfile, searchWorkers, getWorkerById
} = require('../controllers/workerController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.userId + '-' + uniqueSuffix + '.jpg');
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
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

    // For now, return a random avatar from picsum
    // In production, you would upload to Cloudinary or similar service
    const photoUrl = `https://picsum.photos/seed/${req.userId}/200/200`;
    
    res.json({ 
      url: photoUrl,
      message: 'Photo uploaded successfully' 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Get worker by ID (public)
router.get('/:id', getWorkerById);

module.exports = router;