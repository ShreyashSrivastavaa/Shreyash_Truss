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

const router = Router();

// ==========================================
// 1. DELIVERY ROUTES (MUST PRECEDE /:id)
// ==========================================

// GET /api/vendors/deliveries - List deliveries with optional filters
router.get('/deliveries', async (req, res) => {
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
    const result = await getDeliveries(queryValidation.data);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// POST /api/vendors/deliveries - Record a new purchase order / delivery commitment
router.post('/deliveries', async (req, res) => {
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
    const created = await createDelivery(validation.data);
    res.status(201).json({
      message: 'Delivery commitment recorded successfully',
      delivery: created
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// GET /api/vendors/deliveries/:id - Get single delivery details
router.get('/deliveries/:id', async (req, res) => {
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
    const delivery = await getDeliveryById(paramValidation.data.id);
    res.status(200).json(delivery);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// PATCH /api/vendors/deliveries/:id - Update delivery progress or intake
router.patch('/deliveries/:id', async (req, res) => {
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
    const updated = await updateDelivery(paramValidation.data.id, bodyValidation.data);
    res.status(200).json({
      message: 'Delivery updated successfully',
      delivery: updated
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ==========================================
// 2. VENDOR DEMO RESET ROUTE
// ==========================================

// POST /api/vendors/reset - Reset vendor & delivery state back to synthetic baseline
router.post('/reset', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Forbidden: Demo state reset is disabled in production environment'
    });
  }

  try {
    await resetVendorState();
    res.status(200).json({
      message: 'Vendor SLA demo baseline successfully restored'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. VENDOR REGISTRY ROUTES
// ==========================================

// GET /api/vendors - List all registered vendors with aggregated SLA scorecard metrics
router.get('/', async (req, res) => {
  try {
    const data = await getVendors();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vendors - Register a new vendor profile
router.post('/', async (req, res) => {
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
    const created = await createVendor(validation.data);
    res.status(201).json({
      message: 'Vendor registered successfully',
      vendor: created
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// GET /api/vendors/:id - Get single vendor scorecard and delivery history
router.get('/:id', async (req, res) => {
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
    const vendor = await getVendorById(paramValidation.data.id);
    res.status(200).json(vendor);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// PATCH /api/vendors/:id - Update vendor settings or SLA target
router.patch('/:id', async (req, res) => {
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
    const updated = await updateVendor(paramValidation.data.id, bodyValidation.data);
    res.status(200).json({
      message: 'Vendor profile updated successfully',
      vendor: updated
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

export default router;
