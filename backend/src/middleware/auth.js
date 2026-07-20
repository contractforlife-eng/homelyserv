// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwtSecret.js';

// PHASE 0 SECURITY FIX (audit §2.8): no hardcoded fallback secret.
// getJwtSecret() throws if JWT_SECRET is missing/weak; that error is
// caught below and surfaced as a 500 rather than silently signing/
// verifying tokens with a secret that was committed to source control.

export const authenticate = (req, res, next) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('❌ No Authorization header found');
      return res.status(401).json({ 
        success: false, 
        message: 'No authorization header provided' 
      });
    }
    
    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Invalid authorization format (not Bearer)');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format. Expected Bearer token.' 
      });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token found in authorization header');
      return res.status(401).json({ 
        success: false, 
        message: 'Token missing' 
      });
    }
    
    // Log token details for debugging (first 20 chars only)
    console.log(`🔑 Token received: ${token.substring(0, 20)}...`);
    console.log(`🔑 Token length: ${token.length}`);
    
    // Resolve the signing secret first (outside the JWT-error try/catch
    // below) so a missing/weak JWT_SECRET is reported as a 500 server
    // configuration error, not a misleading 401 "invalid token".
    const jwtSecret = getJwtSecret();

    // Verify the token
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log(`✅ Token verified for user: ${decoded.userId || decoded.email || 'unknown'}`);
      
      // Attach user info to request
      req.userId = decoded.userId || decoded.id || decoded.email;
      req.userRole = decoded.role || decoded.userRole;
      req.user = decoded; // Full decoded token
      
      next();
    } catch (jwtError) {
      // Handle specific JWT errors
      console.error('❌ JWT verification error:', jwtError.message);
      console.error('❌ JWT error name:', jwtError.name);
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token format. Please log in again.',
          error: 'JWT_MALFORMED'
        });
      }
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired. Please log in again.',
          error: 'JWT_EXPIRED'
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Please log in again.',
        error: 'JWT_INVALID'
      });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

export const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      console.log('❌ No user role found in request');
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - No role found' 
      });
    }
    
    // Check if user role is in the allowed roles
    if (!roles.includes(req.userRole)) {
      console.log(`❌ User role "${req.userRole}" not in allowed roles: ${roles.join(', ')}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions',
        required: roles,
        current: req.userRole
      });
    }
    
    console.log(`✅ User role "${req.userRole}" authorized for ${roles.join(', ')}`);
    next();
  };
};

// Helper to check if user is authenticated (for routes that need it)
export const requireAuth = (req, res, next) => {
  return authenticate(req, res, next);
};

// Helper for employer-only routes
export const requireEmployer = (req, res, next) => {
  return authenticate(req, res, () => {
    if (req.userRole !== 'EMPLOYER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Employer role required.'
      });
    }
    next();
  });
};

// Helper for worker-only routes
export const requireWorker = (req, res, next) => {
  return authenticate(req, res, () => {
    if (req.userRole !== 'WORKER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Worker role required.'
      });
    }
    next();
  });
};

// Helper for admin-only routes
export const requireAdmin = (req, res, next) => {
  return authenticate(req, res, () => {
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }
    next();
  });
};

export default {
  authenticate,
  authorize,
  requireAuth,
  requireEmployer,
  requireWorker,
  requireAdmin
};