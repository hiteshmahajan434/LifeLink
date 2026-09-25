import { verifyToken } from '../utils/jwtService.js';

/**
 * Middleware to authenticate requests using JWT Bearer tokens.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Missing or malformed Bearer token.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = {
      _id: decoded._id,
      id: decoded.id,
      role: decoded.role
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

/**
 * Middleware factory to restrict endpoints to specific role (e.g. 'AMBULANCE' or 'HOSPITAL').
 * @param {string} role
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: insufficient permissions.'
      });
    }
    next();
  };
};
