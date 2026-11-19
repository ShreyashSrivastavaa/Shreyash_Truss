import { Router } from 'express';
import {
  createVendorSchema,
  updateVendorSchema,
  vendorIdParamSchema,
  createDeliverySchema,
  updateDeliverySchema,
  deliveryIdParamSchema,
  deliveryQuerySchema
} from '../schemas/vendorSchema.js';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  resetVendorState
} from '../services/vendorService.js';
import prisma from '../db.js';

const router = Router();

function getContext(req) {
  const client = req.app.locals.prisma !== undefined ? req.app.locals.prisma : prisma;
  const referenceDate = req.query.referenceDate
    ? new Date(req.query.referenceDate)
    : (req.app.locals.referenceDate || new Date());
  return { client, referenceDate };
}

// ==========================================
// 1. DELIVERY ROUTES (MUST PRECEDE /:id)
// ==========================================

// GET /api/vendors/deliveries - List deliveries with optional filters
router.get('/deliveries', async (req, res, next) => {
  const queryValidation = deliveryQuerySchema.safeParse(req.query);
  if (!queryValidation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: queryValidation.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  try {
    const { client, referenceDate } = getContext(req);
    const result = await getDeliveries(queryValidation.data, referenceDate, client);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/vendors/deliveries - Record a new purchase order / delivery commitment
router.post('/deliveries', async (req, res, next) => {
  const validation = createDeliverySchema.safeParse(req.body);
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
    const { client, referenceDate } = getContext(req);
    const created = await createDelivery(validation.data, referenceDate, client);
    res.status(201).json({
      message: 'Delivery commitment recorded successfully',
      delivery: created
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/vendors/deliveries/:id - Get single delivery details
router.get('/deliveries/:id', async (req, res, next) => {
  const paramValidation = deliveryIdParamSchema.safeParse(req.params);
  if (!paramValidation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: paramValidation.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  try {
    const { client, referenceDate } = getContext(req);
    const delivery = await getDeliveryById(paramValidation.data.id, referenceDate, client);
    res.status(200).json(delivery);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/vendors/deliveries/:id - Update delivery progress or intake
router.patch('/deliveries/:id', async (req, res, next) => {
  const paramValidation = deliveryIdParamSchema.safeParse(req.params);
  if (!paramValidation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: paramValidation.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  const bodyValidation = updateDeliverySchema.safeParse(req.body);
  if (!bodyValidation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: bodyValidation.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  try {
    const { client, referenceDate } = getContext(req);
    const updated = await updateDelivery(paramValidation.data.id, bodyValidation.data, referenceDate, client);
    res.status(200).json({
      message: 'Delivery updated successfully',
      delivery: updated
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. VENDOR DEMO RESET ROUTE
// ==========================================

// POST /api/vendors/reset - Reset vendor & delivery state back to synthetic baseline
router.post('/reset', async (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_RESET !== 'true') {
    return res.status(403).json({
      error: 'Forbidden: Demo state reset is disabled in production environment'
    });
  }

  try {
    const { client } = getContext(req);
    await resetVendorState(client);
    res.status(200).json({
      message: 'Vendor SLA demo baseline successfully restored'
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. VENDOR REGISTRY ROUTES
// ==========================================

// GET /api/vendors - List all registered vendors with aggregated SLA scorecard metrics
router.get('/', async (req, res, next) => {
  try {
    const { client, referenceDate } = getContext(req);
    const data = await getVendors(referenceDate, client);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/vendors - Register a new vendor profile
router.post('/', async (req, res, next) => {
  const validation = createVendorSchema.safeParse(req.body);
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
    const { client } = getContext(req);
    const created = await createVendor(validation.data, client);
    res.status(201).json({
      message: 'Vendor registered successfully',
      vendor: created
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/vendors/:id - Get single vendor scorecard and delivery history
router.get('/:id', async (req, res, next) => {
  const paramValidation = vendorIdParamSchema.safeParse(req.params);
  if (!paramValidation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: paramValidation.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  try {
    const { client, referenceDate } = getContext(req);
    const vendor = await getVendorById(paramValidation.data.id, referenceDate, client);
    res.status(200).json(vendor);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/vendors/:id - Update vendor settings or SLA target
router.patch('/:id', async (req, res, next) => {
  const paramValidation = vendorIdParamSchema.safeParse(req.params);
  if (!paramValidation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: paramValidation.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  const bodyValidation = updateVendorSchema.safeParse(req.body);
  if (!bodyValidation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: bodyValidation.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  try {
    const { client } = getContext(req);
    const updated = await updateVendor(paramValidation.data.id, bodyValidation.data, client);
    res.status(200).json({
      message: 'Vendor profile updated successfully',
      vendor: updated
    });
  } catch (err) {
    next(err);
  }
});

export default router;
