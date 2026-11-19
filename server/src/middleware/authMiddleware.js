import { verifyToken } from '../utils/crypto.js';

/**
 * Express middleware to authenticate requests via Bearer token in Authorization header.
 * Attaches decoded user payload to `req.user`.
 */
export function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Authentication required: Bearer token is missing');
    error.statusCode = 401;
    return next(error);
  }

  const token = authHeader.slice(7).trim();
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    const error = new Error(`Authentication failed: ${err.message}`);
    error.statusCode = 401;
    next(error);
  }
}

/**
 * Express middleware to enforce Role-Based Access Control (RBAC).
 * Requires `authenticateUser` to have run previously.
 *
 * @param {...string} allowedRoles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    // ADMIN has universal clearance
    if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    const error = new Error(`Forbidden: Role '${req.user.role}' is not authorized to perform this action. Required: ${allowedRoles.join(', ')}`);
    error.statusCode = 403;
    next(error);
  };
}
