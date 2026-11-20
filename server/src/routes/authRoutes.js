import { Router } from 'express';
import { registerSchema, loginSchema } from '../schemas/authSchema.js';
import { registerUser, loginUser, getUserProfile } from '../services/authService.js';
import { authenticateUser, requireAuth } from '../middleware/authMiddleware.js';
import prisma from '../db.js';

const router = Router();

// POST /api/auth/register - Register a new user account in PostgreSQL
router.post('/register', authenticateUser, async (req, res, next) => {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  // Prevent privilege escalation: unauthenticated public callers cannot choose roles or depot scopes
  const isPrivileged = req.user && req.user.role === 'ADMIN';
  const requestedRole = validation.data.role;
  const requestedDepotId = validation.data.depotId;

  if (!isPrivileged && !req.app.locals.allowRoleRegistration) {
    if (requestedRole && requestedRole !== 'VIEWER') {
      return res.status(403).json({
        error: 'Forbidden: Public registration cannot assign privileged roles. Contact an administrator.'
      });
    }
    if (requestedDepotId) {
      return res.status(403).json({
        error: 'Forbidden: Public registration cannot assign depot scope.'
      });
    }
  }

  const registrationData = {
    ...validation.data,
    role: (isPrivileged || req.app.locals.allowRoleRegistration) ? (requestedRole || 'VIEWER') : 'VIEWER',
    depotId: (isPrivileged || req.app.locals.allowRoleRegistration) ? (requestedDepotId || null) : null
  };

  try {
    const client = req.app.locals.prisma !== undefined ? req.app.locals.prisma : prisma;
    const result = await registerUser(registrationData, client);
    res.status(201).json({
      message: 'Account registered successfully',
      ...result
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login - Authenticate credentials and receive a signed Bearer token
router.post('/login', async (req, res, next) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  try {
    const client = req.app.locals.prisma !== undefined ? req.app.locals.prisma : prisma;
    const result = await loginUser(validation.data, client);
    res.status(200).json({
      message: 'Login successful',
      ...result
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me - Retrieve current user profile from token
router.get('/me', authenticateUser, requireAuth, async (req, res, next) => {
  try {
    const client = req.app.locals.prisma !== undefined ? req.app.locals.prisma : prisma;
    const user = await getUserProfile(req.user.sub, client);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
