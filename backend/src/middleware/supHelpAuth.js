// backend/src/middleware/supHelpAuth.js

import { authenticate } from './auth.js';

// Sup-Help authorization middleware
// Allows SUPPORT_HELPER and ADMIN roles only
export const requireSupHelp = (req, res, next) => {
  return authenticate(req, res, () => {
    if (req.userRole !== 'SUPPORT_HELPER' && req.userRole !== 'ADMIN') {
      console.log(
        `User role "${req.userRole}" not authorized for Sup-Help routes`
      );
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Support Helper or Admin role required.',
        required: ['SUPPORT_HELPER', 'ADMIN'],
        current: req.userRole,
      });
    }

    console.log(
      `User role "${req.userRole}" authorized for Sup-Help routes`
    );

    next();
  });
};

export default {
  requireSupHelp,
};
