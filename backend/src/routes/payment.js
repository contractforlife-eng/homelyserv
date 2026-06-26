const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../utils/prisma');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/payments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for payment proof uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'payment-' + req.userId + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image and PDF files are allowed!'));
  }
});

// ============================================
// PROTECTED ROUTES - Authentication required
// ============================================

// Get payment details for a specific hire
router.get('/:hireId', auth, async (req, res) => {
  try {
    const { hireId } = req.params;

    const hire = await prisma.hire.findUnique({
      where: { id: hireId },
      include: {
        worker: {
          include: {
            user: {
              select: {
                fullName: true,
                phone: true,
                city: true
              }
            }
          }
        },
        employer: {
          select: {
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!hire) {
      return res.status(404).json({ message: 'Hire not found' });
    }

    // Check if user is authorized to view this payment
    if (hire.employerId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(hire);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit payment proof
router.post('/:hireId/submit', auth, upload.single('receipt'), async (req, res) => {
  try {
    const { hireId } = req.params;
    const { paymentMethod } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Payment receipt is required' });
    }

    const hire = await prisma.hire.findUnique({
      where: { id: hireId }
    });

    if (!hire) {
      return res.status(404).json({ message: 'Hire not found' });
    }

    // Check if user is authorized to submit payment for this hire
    if (hire.employerId !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const receiptUrl = `${baseUrl}/uploads/payments/${req.file.filename}`;

    const updatedHire = await prisma.hire.update({
      where: { id: hireId },
      data: {
        paymentMethod: paymentMethod,
        paymentProofUrl: receiptUrl,
        paymentStatus: 'pending'
      }
    });

    res.json({
      message: 'Payment submitted successfully',
      hire: updatedHire
    });
  } catch (error) {
    console.error('Submit payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payment status
router.get('/:hireId/status', auth, async (req, res) => {
  try {
    const { hireId } = req.params;

    const hire = await prisma.hire.findUnique({
      where: { id: hireId },
      select: {
        id: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentReference: true,
        paymentProofUrl: true,
        totalDue: true,
        status: true,
        worker: {
          include: {
            user: {
              select: {
                fullName: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!hire) {
      return res.status(404).json({ message: 'Hire not found' });
    }

    res.json(hire);
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// Get all pending payments (admin only)
router.get('/admin/pending', auth, async (req, res) => {
  try {
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const pendingPayments = await prisma.hire.findMany({
      where: {
        paymentStatus: 'pending'
      },
      include: {
        worker: {
          include: {
            user: {
              select: {
                fullName: true,
                phone: true,
                city: true
              }
            }
          }
        },
        employer: {
          select: {
            fullName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(pendingPayments);
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm payment (admin only)
router.put('/admin/:hireId/confirm', auth, async (req, res) => {
  try {
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { hireId } = req.params;

    const hire = await prisma.hire.update({
      where: { id: hireId },
      data: {
        paymentStatus: 'confirmed',
        status: 'active',
        contactShared: true
      }
    });

    res.json({
      message: 'Payment confirmed successfully! Contact details are now shared.',
      hire
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject payment (admin only)
router.put('/admin/:hireId/reject', auth, async (req, res) => {
  try {
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { hireId } = req.params;

    const hire = await prisma.hire.update({
      where: { id: hireId },
      data: {
        paymentStatus: 'rejected'
      }
    });

    res.json({
      message: 'Payment rejected',
      hire
    });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;