// backend/src/middleware/liveSupportAuth.js

import { authenticate } from './auth.js';

/**
 * Live Support staff authorization middleware.
 * Authorizes frontline support (SUPPORT_HELPER), elevated support (SUPPORT), and administrative supervision (ADMIN).
 * Keeps other privileged support routes isolated.
 */
export const requireLiveSupportStaff = (req, res, next) => {
  return authenticate(req, res, () => {
    if (!['ADMIN', 'SUPPORT', 'SUPPORT_HELPER'].includes(req.userRole)) {
      console.log(
        `❌ User role "${req.userRole}" not authorized for Live Support staff routes`
      );

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Staff role required for Live Support.',
        required: ['ADMIN', 'SUPPORT', 'SUPPORT_HELPER'],
        current: req.userRole
      });
    }

    console.log(
      `✅ User role "${req.userRole}" authorized for Live Support staff routes`
    );

    next();
  });
};

export default {
  requireLiveSupportStaff
};
