import { Router } from 'express';
import { createTransferSchema } from '../schemas/transferSchema.js';
import {
  getTransferOpportunities,
  createTransfer,
  executeTransfer,
  dispatchTransfer,
  receiveTransfer,
  cancelTransfer,
  getTransferHistory
} from '../services/inventoryService.js';

const router = Router();

// GET /api/transfers/opportunities - lists calculated lateral transfer opportunities
router.get('/opportunities', async (req, res) => {
  try {
    const opportunities = await getTransferOpportunities();
    res.status(200).json({
      count: opportunities.length,
      opportunities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transfers - lists transfer history
router.get('/', async (req, res) => {
  try {
    const history = await getTransferHistory();
    res.status(200).json({
      count: history.length,
      transfers: history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/transfers - validates and creates a lateral inventory transfer in PENDING status
router.post('/', async (req, res) => {
  const validationResult = createTransferSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: (validationResult.error.issues || []).map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  try {
    const result = await createTransfer(validationResult.data);
    res.status(201).json({
      message: 'Transfer created successfully',
      ...result
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      error: error.message
    });
  }
});

// POST /api/transfers/:id/dispatch - dispatches a PENDING transfer to IN_TRANSIT
router.post('/:id/dispatch', async (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return res.status(400).json({ error: 'Valid transfer ID is required' });
  }

  try {
    const result = await dispatchTransfer(id.trim());
    res.status(200).json({
      message: 'Transfer dispatched successfully',
      ...result
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      error: error.message
    });
  }
});

// POST /api/transfers/:id/receive - marks an IN_TRANSIT transfer as RECEIVED
router.post('/:id/receive', async (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return res.status(400).json({ error: 'Valid transfer ID is required' });
  }

  try {
    const result = await receiveTransfer(id.trim());
    res.status(200).json({
      message: 'Transfer received successfully',
      ...result
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      error: error.message
    });
  }
});

// POST /api/transfers/:id/cancel - cancels a PENDING transfer and releases reserved inventory
router.post('/:id/cancel', async (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return res.status(400).json({ error: 'Valid transfer ID is required' });
  }

  try {
    const result = await cancelTransfer(id.trim());
    res.status(200).json({
      message: 'Transfer cancelled successfully',
      ...result
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      error: error.message
    });
  }
});

export default router;
