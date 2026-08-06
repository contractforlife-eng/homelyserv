// backend/src/routes/sidebar.js
// ============================================================
// SIDEBAR ROUTES
// Unified endpoint that returns every sidebar activity counter
// for the authenticated user in a SINGLE request.
//
// GET /api/sidebar/counters
// ============================================================
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getSidebarCounters } from '../services/sidebarCountersService.js';

const router = express.Router();

// All sidebar routes require authentication.
router.use(authenticate);

// ============================================================
// GET /api/sidebar/counters
// Counters are computed per the authenticated user's role and
// scoped strictly to their own data (see sidebarCountersService).
// ============================================================
router.get('/counters', async (req, res) => {
  try {
    const counters = await getSidebarCounters(req.userId, req.userRole);
    return res.json({ success: true, ...counters });
  } catch (error) {
    console.error('❌ Error fetching sidebar counters:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sidebar counters',
    });
  }
});

export default router;
