  import jwt from 'jsonwebtoken';

  export const authenticate = (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: 'No token provided' 
        });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'homelyserv_secret_key_2026');
      
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
  };

  export const authorize = (roles) => {
    return (req, res, next) => {
      if (!req.userRole) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }
      
      if (!roles.includes(req.userRole)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }
      
      next();
    };
  };