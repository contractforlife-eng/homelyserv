// backend/src/middleware/supportAuth.js

import { authenticate } from './auth.js';

// Support authorization middleware
// Allows SUPPORT and ADMIN roles only
export const requireSupport = (req, res, next) => {
  return authenticate(req, res, () => {

    if (req.userRole !== 'SUPPORT' && req.userRole !== 'ADMIN') {
      console.log(
        `❌ User role "${req.userRole}" not authorized for support routes`
      );

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Support or Admin role required.',
        required: ['SUPPORT', 'ADMIN'],
        current: req.userRole
      });
    }

    console.log(
      `✅ User role "${req.userRole}" authorized for support routes`
    );

    next();
  });
};

export default {
  requireSupport
};