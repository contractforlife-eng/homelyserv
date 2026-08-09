// backend/src/routes/employers.js
import express from 'express';
import User from '../models/User.js';
import prisma from '../lib/prisma.js';
import { authenticate, requireEmployer } from '../middleware/auth.js';
import { hasActiveSubscription, recordSearch, getSearchLimitStatus } from '../services/paymentAuthService.js';

const router = express.Router();

const escapeRegExp = (string) => {
  if (!string) return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// ============================================================
// Search Workers
// ============================================================
/**
 * Search Workers — EMPLOYER ONLY
 *
 * SECURITY: restricted to authenticated EMPLOYER accounts (WORKER / SUPPORT /
 * ADMIN cannot consume the Employer search quota or read worker results here).
 *
 * PRIVACY: worker email/phone are ONLY returned to an Employer who is
 * authorized to contact that specific worker (i.e. a completed paid hire /
 * commission with that worker). Authorization is resolved in BATCH — exactly
 * three DB queries (workers, worker profiles, completed payments) regardless
 * of result size — so no N+1 query pattern is introduced.
 */
router.get('/search', requireEmployer, async (req, res) => {
  try {
    const employerId = req.userId;
    const employerRole = req.userRole;

    const searchResult = await recordSearch(employerId);
    if (!searchResult.allowed) {
      return res.status(403).json({
        success: false,
        message: 'Daily search limit reached. Upgrade to Premium for unlimited searches.',
        searchCount: searchResult.remaining === 0 ? 3 : 0,
        searchLimit: 3,
        remaining: 0,
        isPremium: false
      });
    }

    const { query, category, location, minRating } = req.query;
    
    let filter = { role: 'WORKER' };
    
    if (query) {
      const escapedQuery = escapeRegExp(query);
      filter.$or = [
        { fullName: { $regex: escapedQuery, $options: 'i' } },
        { bio: { $regex: escapedQuery, $options: 'i' } },
        { skills: { $in: [new RegExp(escapedQuery, 'i')] } }
      ];
    }
    
    if (category && category !== 'all') {
      const escapedCategory = escapeRegExp(category);
      filter.skills = { $in: [new RegExp(escapedCategory, 'i')] };
    }
    
    if (location && location !== 'all') {
      const escapedLocation = escapeRegExp(location);
      filter.location = { $regex: escapedLocation, $options: 'i' };
    }
    
    // NOTE: never select the password; leave email/phone selected so we can
    // strip them per-worker below (matching /api/workers/profile/:id behavior).
    const workers = await User.find(filter).select('-password');

    // ============================================================
    // BATCHED CONTACT AUTHORIZATION (no N+1)
    // 1. Map each worker User._id -> WorkerProfile.id
    // 2. Find which worker profiles this Employer has a completed payment for
    // ============================================================
    let profileIdByUserId = new Map();
    let unlockedProfileIds = new Set();

    const userIds = workers.map(w => String(w._id));
    if (userIds.length > 0) {
      const workerProfiles = await prisma.workerProfile.findMany({
        where: { userId: { in: userIds } },
        select: { id: true, userId: true }
      });

      workerProfiles.forEach(p => profileIdByUserId.set(String(p.userId), String(p.id)));

      const profileIds = workerProfiles.map(p => String(p.id));
      if (profileIds.length > 0) {
        const completedPayments = await prisma.payment.findMany({
          where: {
            employerId: String(employerId),
            workerId: { in: profileIds },
            status: 'completed'
          },
          select: { workerId: true },
          distinct: ['workerId']
        });
        completedPayments.forEach(p => unlockedProfileIds.add(String(p.workerId)));
      }
    }

    const result = workers.map(w => {
      const workerObj = w.toObject ? w.toObject() : { ...w };
      workerObj.id = String(workerObj._id || workerObj.id || '');

      const profileId = profileIdByUserId.get(String(workerObj._id));
      const canContact = profileId ? unlockedProfileIds.has(profileId) : false;

      if (!canContact) {
        workerObj.email = null;
        workerObj.phone = null;
      }

      delete workerObj.password;
      delete workerObj.__v;

      return workerObj;
    });

    const isPremium = await hasActiveSubscription(employerId);
    const limitStatus = await getSearchLimitStatus(employerId);
    
    res.json({
      success: true,
      workers: result,
      isPremium,
      searchCount: limitStatus.count,
      searchLimit: limitStatus.limit,
      remaining: limitStatus.remaining
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search workers'
    });
  }
});

// ============================================================
// Get Worker Details
// ============================================================
router.get('/workers/:id', authenticate, async (req, res) => {
  try {
    const worker = await User.findById(req.params.id).select('-password -email -phone');
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    res.json({
      success: true,
      worker
    });
  } catch (error) {
    console.error('Get worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get worker'
    });
  }
});

// ============================================================
// Get Employer Profile
// ============================================================
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const userObj = user.toObject ? user.toObject() : { ...user };
    userObj.id = userObj._id;
    res.json({
      success: true,
      user: userObj
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// ============================================================
// Update Employer Profile
// ============================================================
router.put('/profile/:userId', authenticate, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const authenticatedUserId = req.userId;

    console.log('[EmployerProfile] req.params.userId:', targetUserId);
    console.log('[EmployerProfile] req.userId:', authenticatedUserId);
    console.log('[EmployerProfile] req.body:', req.body);

    if (targetUserId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    const { fullName, phone, location, companyName, bio, profileImage, website } = req.body;
    
    const user = await User.findByIdAndUpdate(
      authenticatedUserId,
      { fullName, phone, location, companyName, bio, profileImage, website },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userObj = user.toObject ? user.toObject() : { ...user };
    userObj.id = userObj._id;

    res.json({ success: true, user: userObj });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// ============================================================
// Get Employer Stats
// ============================================================
router.get('/stats/:userId', authenticate, async (req, res) => {
  try {
    const employerId = req.params.userId;

    if (String(req.userId) !== String(employerId) && req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [totalOffers, pendingOffers, totalHires, totalPayments] = await Promise.all([
      prisma.offer.count({ where: { employerId } }),
      prisma.offer.count({ where: { employerId, status: 'pending' } }),
      prisma.hire.count({ where: { employerId } }),
      prisma.payment.aggregate({
        where: { employerId, status: 'completed' },
        _sum: { amount: true }
      })
    ]);

    const totalSpent = totalPayments._sum.amount || 0;

    res.json({
      success: true,
      stats: {
        totalHires,
        activeHires: totalHires,
        pendingApplications: pendingOffers,
        completedHires: totalHires,
        totalSpent,
        savedWorkers: 0,
        messages: 0,
        complaints: 0,
        satisfactionRate: 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats'
    });
  }
});

// ============================================================
// Get Employer Payments
// ============================================================
router.get('/payments/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;

    if (String(req.userId) !== String(userId) && req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const payments = await prisma.payment.findMany({
      where: { employerId: userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments'
    });
  }
});

// ============================================================
// Get Saved Workers
// ============================================================
router.get('/saved/:userId', authenticate, async (req, res) => {
  try {
    if (String(req.userId) !== String(req.params.userId) && req.userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    res.json({
      success: true,
      savedWorkers: [],
      message: 'Saved workers feature not yet implemented in database'
    });
  } catch (error) {
    console.error('Get saved workers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get saved workers'
    });
  }
});

// ============================================================
// Save a Worker
// ============================================================
router.post('/saved/:userId/:workerId', authenticate, async (req, res) => {
  try {
    if (String(req.userId) !== String(req.params.userId) && req.userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    res.json({
      success: true,
      message: 'Worker saved successfully'
    });
  } catch (error) {
    console.error('Save worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save worker'
    });
  }
});

// ============================================================
// Unsave a Worker
// ============================================================
router.delete('/saved/:userId/:workerId', authenticate, async (req, res) => {
  try {
    if (String(req.userId) !== String(req.params.userId) && req.userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    res.json({
      success: true,
      message: 'Worker unsaved successfully'
    });
  } catch (error) {
    console.error('Unsave worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsave worker'
    });
  }
});

export default router;
