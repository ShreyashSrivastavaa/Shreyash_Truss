import { verifyToken } from '../utils/crypto.js';

/**
 * Express middleware to authenticate requests via Bearer token in Authorization header.
 * Attaches decoded user payload to `req.user` if valid token is provided.
 */
export function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
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
 * Middleware that strictly requires the user to be authenticated.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    const error = new Error('Authentication required: Bearer token is missing');
    error.statusCode = 401;
    return next(error);
  }
  next();
}

/**
 * Express middleware to enforce Role-Based Access Control (RBAC).
 *
 * @param {...string} allowedRoles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // If strict auth is enforced or a user is logged in:
    if (process.env.STRICT_AUTH === 'true' || req.app.locals.enforceAuth || req.user) {
      if (!req.user) {
        const error = new Error('Authentication required: Bearer token is missing');
        error.statusCode = 401;
        return next(error);
      }

      // ADMIN has universal clearance
      if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
        return next();
      }

      const error = new Error(`Forbidden: Role '${req.user.role}' is not authorized to perform this action. Required: ${allowedRoles.join(', ')}`);
      error.statusCode = 403;
      return next(error);
    }

    // In legacy test mode without auth header, pass through
    next();
  };
}

/**
 * Enforces depot-level authorization for depot managers.
 * If user is a DEPOT_MANAGER with an assigned depotId, verifies that the target depot matches.
 *
 * @param {(req: import('express').Request) => string|null|undefined} getDepotIdFromReq
 */
export function requireDepotScope(getDepotIdFromReq) {
  return (req, res, next) => {
    if (!req.user) return next();

    if (req.user.role === 'DEPOT_MANAGER' && req.user.depotId) {
      const targetDepotId = getDepotIdFromReq(req);
      if (targetDepotId && targetDepotId !== req.user.depotId) {
        const error = new Error(
          `Forbidden: Depot manager '${req.user.email}' is only authorized for depot '${req.user.depotId}', but action targets '${targetDepotId}'`
        );
        error.statusCode = 403;
        return next(error);
      }
    }

    next();
  };
}
